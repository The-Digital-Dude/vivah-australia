import { AccountStatus, UserRole } from '@vivah/shared';
import { HttpError } from './auth-errors.js';
import { AuthProvider, ProfileModel, UserModel, type UserDocument, type User } from '../models/index.js';
import type { AuthConfig } from './auth-types.js';
import { createTokenPair, createOpaqueToken, type TokenPair } from './token.service.js';

interface OAuthProfile {
  id: string;
  email?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  // Apple only: refresh token from the sign-in authorization code, kept so the
  // grant can be revoked when the member deletes their account.
  appleRefreshToken?: string | undefined;
}

export interface AppleSignInExtras {
  authorizationCode?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(accessToken: string): Promise<OAuthProfile> {
  // Mock profile for the automated test suite only. It is gated on the runtime
  // environment, never on a token value a caller could send to a live server.
  if (process.env.NODE_ENV === 'test') {
    return {
      id: '12345google',
      email: 'google-user@example.com',
      firstName: 'Google',
      lastName: 'User',
    };
  }

  try {
    const tokenInfo = await googleClient.getTokenInfo(accessToken);
    if (!tokenInfo.email) {
      throw new HttpError(400, 'Invalid Google token payload');
    }
    
    // To get names, we must fetch the userinfo endpoint because tokenInfo only has basic info
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      throw new HttpError(400, 'Failed to fetch user profile from Google');
    }
    
    const data = await res.json() as { sub: string; email: string; given_name?: string; family_name?: string };
    
    return {
      id: data.sub,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Failed to verify Google access token');
  }
}

export async function verifyFacebookToken(token: string): Promise<OAuthProfile> {
  if (process.env.NODE_ENV === 'test') {
    return {
      id: '12345fb',
      email: 'facebook-user@example.com',
      firstName: 'Facebook',
      lastName: 'User',
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      throw new HttpError(400, 'Invalid Facebook token');
    }
    const data = await res.json() as { id: string; email?: string; first_name?: string; last_name?: string };
    return {
      id: data.id,
      email: data.email ?? undefined,
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Failed to verify Facebook token');
  }
}

import appleSignin from 'apple-signin-auth';

// Sign in with Apple. APPLE_CLIENT_ID is the iOS bundle id. The revoke/refresh
// calls additionally need a Sign in with Apple key (APPLE_TEAM_ID, APPLE_KEY_ID,
// APPLE_PRIVATE_KEY — the .p8 contents, "\n" escapes allowed).
function appleClientSecret(): string | null {
  const { APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = process.env;
  if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) return null;
  return appleSignin.getClientSecret({
    clientID: APPLE_CLIENT_ID,
    teamID: APPLE_TEAM_ID,
    keyIdentifier: APPLE_KEY_ID,
    privateKey: APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
}

export async function verifyAppleToken(
  token: string,
  extras: AppleSignInExtras = {},
): Promise<OAuthProfile> {
  if (process.env.NODE_ENV === 'test') {
    return {
      id: '12345apple',
      email: 'apple-user@example.com',
      firstName: 'Apple',
      lastName: 'User',
    };
  }

  // Without an audience the library would accept an Apple token minted for any
  // other app, so refuse to verify at all rather than verify loosely.
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new HttpError(503, 'Sign in with Apple is not configured.');
  }

  let data: Awaited<ReturnType<typeof appleSignin.verifyIdToken>>;
  try {
    data = await appleSignin.verifyIdToken(token, {
      audience: clientId,
      ignoreExpiration: false,
    });
  } catch {
    throw new HttpError(400, 'Failed to verify Apple token');
  }

  // Apple reveals the member's name only to the app, on the first sign-in, so it
  // arrives alongside the token rather than inside it.
  const profile: OAuthProfile = {
    id: data.sub,
    email: data.email,
    firstName: extras.firstName,
    lastName: extras.lastName,
  };

  // Best effort: a refresh token lets us revoke the grant on account deletion.
  // Failing to get one must never block the member from signing in.
  const clientSecret = extras.authorizationCode ? appleClientSecret() : null;
  if (extras.authorizationCode && clientSecret) {
    try {
      const grant = await appleSignin.getAuthorizationToken(extras.authorizationCode, {
        clientID: clientId,
        clientSecret,
        redirectUri: '',
      });
      profile.appleRefreshToken = grant.refresh_token;
    } catch {
      // Sign-in proceeds without it.
    }
  }

  return profile;
}

/**
 * Revokes the member's Sign in with Apple grant. Apple (guideline 5.1.1(v))
 * expects this when an account is deleted. No-op when the member never signed in
 * with Apple or revocation is not configured; never throws, so a failure here
 * cannot block the deletion itself.
 */
export async function revokeAppleGrant(refreshToken: string | undefined | null): Promise<boolean> {
  const clientSecret = refreshToken ? appleClientSecret() : null;
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!refreshToken || !clientSecret || !clientId) return false;
  try {
    await appleSignin.revokeAuthorizationToken(refreshToken, {
      clientID: clientId,
      clientSecret,
      tokenTypeHint: 'refresh_token',
    });
    return true;
  } catch {
    return false;
  }
}

export async function loginOrRegisterOAuth(
  provider: 'google' | 'facebook' | 'apple',
  profile: OAuthProfile,
  config: AuthConfig,
): Promise<{ user: { id: string; email?: string; role: string }; tokenPair: TokenPair }> {
  if (!profile.email) {
    throw new HttpError(400, `Email address from ${provider} is required for registration.`);
  }

  const lookupKey = provider === 'google' ? { googleId: profile.id } : provider === 'apple' ? { appleId: profile.id } : { facebookId: profile.id };
  let user: UserDocument | null = await UserModel.findOne(lookupKey);

  if (!user) {
    // Check if user exists by email
    user = await UserModel.findOne({ email: profile.email.toLowerCase() });

    if (user) {
      // Link the account
      if (provider === 'google') {
        user.googleId = profile.id;
      } else if (provider === 'apple') {
        user.appleId = profile.id;
      } else {
        user.facebookId = profile.id;
      }
      const providerEnum = provider === 'google' ? AuthProvider.GOOGLE : provider === 'apple' ? AuthProvider.APPLE : AuthProvider.FACEBOOK;
      if (!user.authProviders.includes(providerEnum)) {
        user.authProviders.push(providerEnum);
      }
      user.emailVerified = true;
      if (user.status === AccountStatus.PENDING) {
        user.status = AccountStatus.ACTIVE;
      }
      await user.save();
    } else {
      // Create new user
      const providerEnum = provider === 'google' ? AuthProvider.GOOGLE : provider === 'apple' ? AuthProvider.APPLE : AuthProvider.FACEBOOK;
      const now = new Date();
      
      const userCreateData: Partial<User> = {
        email: profile.email.toLowerCase(),
        authProviders: [providerEnum],
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        mobileVerified: false,
        failedLoginAttempts: 0,
        activeSessions: [],
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        marketingConsent: false,
        metadata: {},
      };
      
      if (provider === 'google') {
        userCreateData.googleId = profile.id;
      } else if (provider === 'apple') {
        userCreateData.appleId = profile.id;
      } else {
        userCreateData.facebookId = profile.id;
      }
      
      user = await UserModel.create(userCreateData);

      // Create a profile draft
      await ProfileModel.create({
        userId: user._id,
        displayId: `VA${user._id.toString().slice(-8).toUpperCase()}`,
        completionPercentage: 15,
        personal: {
          firstName: profile.firstName ?? 'Matrimonial',
          lastName: profile.lastName ?? 'Member',
        },
        religion: { languagesSpoken: [] },
        location: {},
        education: { additionalCertifications: [] },
        employment: { annualIncomeVisibility: 'PRIVATE' },
        family: {},
        lifestyle: { fitnessInterests: [] },
        about: { hobbies: [], interests: [] },
        partnerPreference: {},
        verification: {
          level: 'BASIC',
          emailVerified: true,
          mobileVerified: false,
          identityVerified: false,
          addressVerified: false,
          employmentVerified: false,
          visaVerified: false,
          policeClearanceVerified: false,
          facialVerified: false,
        },
        visibility: {
          status: 'MEMBERS_ONLY',
          showPhoto: true,
          showIncome: false,
          showEmployer: false,
          showLastName: false,
        },
        stats: {
          profileViews: 0,
          interestsReceived: 0,
          interestsSent: 0,
          favouritesCount: 0,
        },
        moderation: {
          approvalStatus: 'PENDING',
        },
      });
    }
  }

  if (user.status !== AccountStatus.ACTIVE || user.isDeleted) {
    throw new HttpError(403, 'Account is not active.');
  }

  if (provider === 'apple' && profile.appleRefreshToken) {
    user.appleRefreshToken = profile.appleRefreshToken;
  }

  const sessionId = createOpaqueToken();
  user.activeSessions.push(sessionId);
  user.lastLoginAt = new Date();
  await user.save();

  const tokenPair = createTokenPair(config, {
    id: user.id || String(user._id),
    role: user.role,
    sessionId,
  });

  const userResult: { id: string; email?: string; role: string } = {
    id: user.id || String(user._id),
    role: user.role,
  };
  if (user.email) {
    userResult.email = user.email;
  }

  return {
    user: userResult,
    tokenPair,
  };
}
