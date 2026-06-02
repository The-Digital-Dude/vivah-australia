'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  LoadingState,
  MatchScoreBadge,
  PageHero,
  PremiumButton,
  PremiumCard,
  ProfileDetailSection,
  StaticPageLayout,
  VerificationBadge,
} from '@/app/components';
import { useAuth } from '@/app/auth-context';
import ProfileActions from '../../member/profile-actions';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface PublicProfileResponse {
  profile?: ProfileDetail;
}

interface ProfileDetail {
  _id?: string;
  displayId: string;
  completionPercentage: number;
  personal?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    maritalStatus?: string;
    heightCm?: number;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    suburb?: string;
    visaStatus?: string;
  };
  religion?: {
    religion?: string;
    community?: string;
    motherTongue?: string;
    languagesSpoken?: string[];
  };
  education?: { highestQualification?: string };
  employment?: {
    occupation?: string;
    industry?: string;
    annualIncome?: number;
    employerName?: string;
  };
  family?: {
    familyValues?: string;
    familyType?: string;
    fatherOccupation?: string;
    motherOccupation?: string;
  };
  lifestyle?: {
    diet?: string;
    smoking?: string;
    drinking?: string;
    livingArrangement?: string;
  };
  about?: {
    aboutMe?: string;
    hobbies?: string[];
    interests?: string[];
    partnerExpectations?: string;
  };
  partnerPreference?: {
    ageMin?: number;
    ageMax?: number;
    countries?: string[];
    cities?: string[];
    religions?: string[];
    communities?: string[];
    educationLevels?: string[];
  };
  stats?: {
    profileViews?: number;
    interestsReceived?: number;
  };
  updatedAt?: string;
  createdAt?: string;
  verification?: { level?: string };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'restricted' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: ProfileDetail };

export default function ProfileDetailClient({ profileId }: Readonly<{ profileId: string }>) {
  const { initialized, refreshAccessToken, token } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!initialized) return;

    let active = true;

    async function loadProfile(accessToken: string | null) {
      const response = await fetch(`${apiBaseUrl}/api/profiles/${profileId}`, {
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.status === 401 && accessToken) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return loadProfile(refreshedToken);
        }
      }

      if (!active) return;

      if (response.status === 401) {
        setState({ status: 'restricted' });
        return;
      }

      if (response.status === 404) {
        setState({ status: 'not-found' });
        return;
      }

      if (!response.ok) {
        setState({ status: 'error', message: 'Unable to load this profile right now.' });
        return;
      }

      const data = (await response.json()) as PublicProfileResponse;
      if (!data.profile) {
        setState({ status: 'not-found' });
        return;
      }

      setState({ status: 'ready', profile: data.profile });
    }

    setState({ status: 'loading' });
    void loadProfile(token);

    return () => {
      active = false;
    };
  }, [initialized, profileId, refreshAccessToken, token]);

  if (state.status === 'loading') {
    return (
      <StaticPageLayout>
        <div className="mx-auto max-w-3xl">
          <LoadingState label="Loading profile" />
        </div>
      </StaticPageLayout>
    );
  }

  if (state.status === 'restricted') {
    return <RestrictedProfilePage profileId={profileId} />;
  }

  if (state.status === 'not-found') {
    return (
      <ProfileMessage
        title="Profile not found"
        message="This profile is unavailable or no longer visible."
      />
    );
  }

  if (state.status === 'error') {
    return <ProfileMessage title="Unable to load profile" message={state.message} />;
  }

  return <ProfileDetailView profile={state.profile} profileId={profileId} />;
}

function ProfileDetailView({
  profile,
  profileId,
}: Readonly<{ profile: ProfileDetail; profileId: string }>) {
  const actionProfileId = profile._id ?? profileId;
  const fullName =
    [profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
    'Member profile';
  const heroSummary = [
    profile.personal?.age ? `${profile.personal.age} years` : undefined,
    profile.location?.city,
    profile.employment?.occupation,
  ]
    .filter(Boolean)
    .join(' | ');
  const lastActive = profile.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString()
    : 'Recently active';
  const membershipBadge =
    profile.verification?.level === 'FULLY_VERIFIED' ? 'Platinum member' : 'Vivah member';

  return (
    <StaticPageLayout
      hero={
        <PageHero eyebrow={profile.displayId} title={fullName}>
          <p>{heroSummary || 'Verified matrimonial profile in Australia'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <VerificationBadge level={profile.verification?.level} />
            <MatchScoreBadge score={profile.completionPercentage} />
            <Badge>{membershipBadge}</Badge>
            <Badge>{lastActive}</Badge>
          </div>
        </PageHero>
      }
    >
      <article className="mx-auto grid max-w-6xl gap-6 pb-28 lg:grid-cols-[1fr_320px] lg:pb-0">
        <div className="grid gap-6">
          <PremiumCard className="overflow-hidden p-0">
            <div className="grid gap-0 md:grid-cols-[280px_1fr]">
              <div className="grid min-h-[360px] place-items-center bg-gradient-to-br from-[#7A1F2B] via-[#8f3240] to-[#D4AF37] p-8 text-white">
                <div className="grid size-36 place-items-center rounded-full border border-white/30 bg-white/15 text-5xl font-semibold shadow-2xl">
                  {(profile.personal?.firstName ?? 'V').slice(0, 1).toUpperCase()}
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Profile overview
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1A1A1A]">{fullName}</h2>
                <div className="mt-5 grid gap-3 text-sm text-[#6B7280] sm:grid-cols-2">
                  <Detail label="Age" value={profile.personal?.age} />
                  <Detail label="City" value={profile.location?.city} />
                  <Detail label="Profession" value={profile.employment?.occupation} />
                  <Detail label="Last active" value={lastActive} />
                  <Detail label="Membership" value={membershipBadge} />
                  <Detail label="Profile completion" value={`${profile.completionPercentage}%`} />
                </div>
                <div className="mt-6 hidden lg:block">
                  <PremiumButton href="/member/messages" variant="secondary">
                    Message if allowed
                  </PremiumButton>
                </div>
              </div>
            </div>
          </PremiumCard>

          <ProfileDetailSection title="About Me">
            <p>{profile.about?.aboutMe ?? 'No profile summary has been shared yet.'}</p>
          </ProfileDetailSection>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Basic Details">
              <Detail label="Gender" value={formatEnum(profile.personal?.gender)} />
              <Detail label="Marital status" value={formatEnum(profile.personal?.maritalStatus)} />
              <Detail
                label="Height"
                value={profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined}
              />
              <Detail label="Display ID" value={profile.displayId} />
            </Panel>
            <Panel title="Religion & Community">
              <Detail label="Religion" value={profile.religion?.religion} />
              <Detail label="Community" value={profile.religion?.community} />
              <Detail label="Mother tongue" value={profile.religion?.motherTongue} />
              <Detail label="Languages" value={joinList(profile.religion?.languagesSpoken)} />
            </Panel>
            <Panel title="Education & Career">
              <Detail label="Education" value={profile.education?.highestQualification} />
              <Detail label="Occupation" value={profile.employment?.occupation} />
              <Detail label="Industry" value={profile.employment?.industry} />
              <Detail label="Employer" value={profile.employment?.employerName} />
            </Panel>
            <Panel title="Location">
              <Detail label="Country" value={profile.location?.country} />
              <Detail label="State" value={profile.location?.state} />
              <Detail label="City" value={profile.location?.city} />
              <Detail label="Visa status" value={profile.location?.visaStatus} />
            </Panel>
            <Panel title="Lifestyle">
              <Detail label="Diet" value={formatEnum(profile.lifestyle?.diet)} />
              <Detail label="Smoking" value={formatEnum(profile.lifestyle?.smoking)} />
              <Detail label="Drinking" value={formatEnum(profile.lifestyle?.drinking)} />
              <Detail
                label="Living arrangement"
                value={formatEnum(profile.lifestyle?.livingArrangement)}
              />
            </Panel>
            <Panel title="Family Details">
              <Detail label="Family values" value={profile.family?.familyValues} />
              <Detail label="Family type" value={profile.family?.familyType} />
              <Detail label="Father occupation" value={profile.family?.fatherOccupation} />
              <Detail label="Mother occupation" value={profile.family?.motherOccupation} />
            </Panel>
          </div>

          <ProfileDetailSection title="Partner Expectations">
            <p>
              {profile.about?.partnerExpectations ?? 'Partner expectations have not been shared.'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Detail
                label="Preferred age"
                value={
                  profile.partnerPreference?.ageMin || profile.partnerPreference?.ageMax
                    ? `${profile.partnerPreference?.ageMin ?? 'Any'} - ${
                        profile.partnerPreference?.ageMax ?? 'Any'
                      }`
                    : undefined
                }
              />
              <Detail
                label="Preferred countries"
                value={joinList(profile.partnerPreference?.countries)}
              />
              <Detail
                label="Preferred cities"
                value={joinList(profile.partnerPreference?.cities)}
              />
              <Detail
                label="Preferred religions"
                value={joinList(profile.partnerPreference?.religions)}
              />
              <Detail
                label="Preferred communities"
                value={joinList(profile.partnerPreference?.communities)}
              />
              <Detail
                label="Preferred education"
                value={joinList(profile.partnerPreference?.educationLevels)}
              />
            </div>
          </ProfileDetailSection>

          <ProfileDetailSection title="Photos / Gallery">
            <div className="rounded-3xl border border-dashed border-[#D4AF37]/70 bg-[#FCFAF7] p-6 text-center">
              <p className="font-semibold text-[#1A1A1A]">Private gallery locked</p>
              <p className="mt-2 text-sm text-[#6B7280]">
                Private photos visible after interest acceptance.
              </p>
            </div>
          </ProfileDetailSection>

          <ProfileDetailSection title="Verification Status">
            <div className="flex flex-wrap gap-2">
              <VerificationBadge level={profile.verification?.level} />
              <Badge>{profile.completionPercentage}% complete</Badge>
            </div>
          </ProfileDetailSection>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 grid gap-4">
            <PremiumCard>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Connect safely</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Send interest, save, report, or block from this action panel.
              </p>
              <div className="mt-5">
                <ProfileActions profileId={actionProfileId} />
              </div>
              <PremiumButton href="/member/messages" variant="secondary" className="mt-3 w-full">
                Message if allowed
              </PremiumButton>
            </PremiumCard>
          </div>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#7A1F2B]/10 bg-white/95 p-3 shadow-[0_-14px_40px_rgba(122,31,43,0.12)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-5xl gap-2">
            <ProfileActions profileId={actionProfileId} compact />
            <PremiumButton href="/member/messages" variant="secondary" className="w-full">
              Message if allowed
            </PremiumButton>
          </div>
        </div>
      </article>
    </StaticPageLayout>
  );
}

function RestrictedProfilePage({ profileId }: Readonly<{ profileId: string }>) {
  return (
    <StaticPageLayout
      hero={
        <PageHero eyebrow="Members only" title="Sign in to view this profile">
          <p>
            This Vivah Australia profile is available to signed-in members only. Create a free
            profile or log in to continue viewing compatible matches.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PremiumButton href="/register">Create free profile</PremiumButton>
            <PremiumButton href={`/login?next=/profiles/${profileId}`} variant="secondary">
              Log in
            </PremiumButton>
          </div>
        </PageHero>
      }
    >
      <div className="mx-auto max-w-3xl">
        <PremiumCard>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Private member profile</h2>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Member-only visibility protects personal details while still letting genuine Vivah
            Australia members connect after signing in.
          </p>
        </PremiumCard>
      </div>
    </StaticPageLayout>
  );
}

function ProfileMessage({ message, title }: Readonly<{ message: string; title: string }>) {
  return (
    <StaticPageLayout
      hero={
        <PageHero eyebrow="Profile" title={title}>
          <p>{message}</p>
        </PageHero>
      }
    >
      <div />
    </StaticPageLayout>
  );
}

function Panel({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return <ProfileDetailSection title={title}>{children}</ProfileDetailSection>;
}

function Detail({ label, value }: Readonly<{ label: string; value?: ReactNode }>) {
  return (
    <div className="rounded-2xl bg-[#FCFAF7] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">{label}</p>
      <p className="mt-1 font-medium text-[#1A1A1A]">{value || 'Not shared'}</p>
    </div>
  );
}

function Badge({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-[#7A1F2B] ring-1 ring-[#7A1F2B]/10">
      {children}
    </span>
  );
}

function joinList(value?: string[]) {
  return value?.length ? value.join(', ') : undefined;
}

function formatEnum(value?: string) {
  return value ? value.replaceAll('_', ' ') : undefined;
}
