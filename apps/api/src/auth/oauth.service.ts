import { AccountStatus, UserRole } from '@vivah/shared';
import { HttpError } from './auth-errors.js';
import { AuthProvider, ProfileModel, UserModel, type UserDocument, type User } from '../models/index.js';
import type { AuthConfig } from './auth-types.js';
import { createTokenPair, type TokenPair } from './token.service.js';

interface OAuthProfile {
  id: string;
  email?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

export async function verifyGoogleToken(token: string): Promise<OAuthProfile> {
  // Local/Testing Mock Bypass
  if (token === 'mock-google-token' || process.env.NODE_ENV === 'test') {
    return {
      id: '12345google',
      email: 'google-user@example.com',
      firstName: 'Google',
      lastName: 'User',
    };
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      throw new HttpError(400, 'Invalid Google token');
    }
    const data = await res.json() as { sub: string; email?: string; given_name?: string; family_name?: string };
    return {
      id: data.sub,
      email: data.email ?? undefined,
      firstName: data.given_name ?? undefined,
      lastName: data.family_name ?? undefined,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Failed to verify Google token');
  }
}

export async function verifyFacebookToken(token: string): Promise<OAuthProfile> {
  // Local/Testing Mock Bypass
  if (token === 'mock-facebook-token' || process.env.NODE_ENV === 'test') {
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

export async function loginOrRegisterOAuth(
  provider: 'google' | 'facebook',
  profile: OAuthProfile,
  config: AuthConfig,
): Promise<{ user: { id: string; email?: string; role: string }; tokenPair: TokenPair }> {
  if (!profile.email) {
    throw new HttpError(400, `Email address from ${provider} is required for registration.`);
  }

  const lookupKey = provider === 'google' ? { googleId: profile.id } : { facebookId: profile.id };
  let user: UserDocument | null = await UserModel.findOne(lookupKey);

  if (!user) {
    // Check if user exists by email
    user = await UserModel.findOne({ email: profile.email.toLowerCase() });

    if (user) {
      // Link the account
      if (provider === 'google') {
        user.googleId = profile.id;
      } else {
        user.facebookId = profile.id;
      }
      const providerEnum = provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK;
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
      const providerEnum = provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK;
      const now = new Date();
      
      const userCreateData: Partial<User> = {
        email: profile.email.toLowerCase(),
        authProviders: [providerEnum],
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        mobileVerified: false,
        failedLoginAttempts: 0,
        refreshTokenVersion: 0,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        marketingConsent: false,
        metadata: {},
      };
      
      if (provider === 'google') {
        userCreateData.googleId = profile.id;
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

  user.lastLoginAt = new Date();
  await user.save();

  const tokenPair = createTokenPair(config, {
    id: user.id || String(user._id),
    role: user.role,
    refreshTokenVersion: user.refreshTokenVersion,
  });

  return {
    user: {
      id: user.id || String(user._id),
      email: user.email || undefined,
      role: user.role,
    },
    tokenPair,
  };
}
