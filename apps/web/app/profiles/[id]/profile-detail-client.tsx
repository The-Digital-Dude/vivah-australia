'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  ImageOff,
  Lock,
  Send,
  X,
} from 'lucide-react';
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

// ── Types ────────────────────────────────────────────────────────────────────

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

type PhotoRequestStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

interface PhotoStatusResponse {
  status: PhotoRequestStatus;
  hasAccess: boolean;
  requestId: string | null;
  accessGrantedUntil: string | null;
}

interface PrivatePhoto {
  id: string;
  assetUrl: string;
  mediaType: string;
  isPrimary: boolean;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'restricted' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: ProfileDetail };

// ── Photo Gallery Section ─────────────────────────────────────────────────────

function PhotoGallerySection({
  profileId,
  token,
}: {
  profileId: string;
  token: string | null;
}) {
  const [requestStatus, setRequestStatus] = useState<PhotoStatusResponse | null>(null);
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function authFetch(path: string, options?: RequestInit) {
    return fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
  }

  async function loadStatus() {
    if (!token) {
      setLoadingStatus(false);
      return;
    }
    try {
      const res = await authFetch(`/api/me/photo-requests/status/${profileId}`);
      if (res.ok) {
        const data = (await res.json()) as PhotoStatusResponse;
        setRequestStatus(data);

        if (data.hasAccess) {
          setLoadingPhotos(true);
          const photosRes = await authFetch(`/api/profiles/${profileId}/private-gallery`);
          if (photosRes.ok) {
            const pd = (await photosRes.json()) as { photos: PrivatePhoto[] };
            setPhotos(pd.photos ?? []);
          }
          setLoadingPhotos(false);
        }
      }
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, token]);

  async function handleSendRequest() {
    setSending(true);
    setFeedback(null);
    try {
      const res = await authFetch('/api/me/photo-requests', {
        method: 'POST',
        body: JSON.stringify({ profileId, message: message.trim() || undefined }),
      });
      const data = (await res.json()) as { message?: string };
      setFeedback(data.message ?? (res.ok ? 'Request sent!' : 'Failed to send request'));
      if (res.ok) {
        setShowMessageBox(false);
        setMessage('');
        await loadStatus();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleWithdraw() {
    if (!requestStatus?.requestId) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/me/photo-requests/${requestStatus.requestId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedback('Request withdrawn');
        await loadStatus();
      }
    } finally {
      setSending(false);
    }
  }

  // Not logged in
  if (!token) {
    return (
      <div className="rounded-3xl border border-dashed border-[#D4AF37]/70 bg-[#FCFAF7] p-6 text-center">
        <Lock className="mx-auto size-8 text-[#D4AF37] mb-3" />
        <p className="font-semibold text-[#1A1A1A]">Sign in to request private photo access</p>
      </div>
    );
  }

  if (loadingStatus) {
    return (
      <div className="rounded-3xl border border-[#7A1F2B]/10 bg-[#FCFAF7] p-6 text-center text-sm text-[#6B7280]">
        Checking photo access…
      </div>
    );
  }

  const status = requestStatus?.status ?? 'NONE';

  // ── ACCESS GRANTED — show gallery ─────────────────────────────────────────
  if (requestStatus?.hasAccess) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
            <CheckCircle2 className="size-3.5" />
            Access granted
            {requestStatus.accessGrantedUntil
              ? ` until ${new Date(requestStatus.accessGrantedUntil).toLocaleDateString()}`
              : ''}
          </span>
        </div>

        {loadingPhotos ? (
          <p className="text-sm text-[#6B7280]">Loading photos…</p>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square overflow-hidden rounded-2xl border border-[#7A1F2B]/10 bg-[#F3E8E9]"
              >
                <img
                  src={photo.assetUrl}
                  alt="Private gallery photo"
                  className="size-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#D4AF37]/70 bg-[#FCFAF7] p-6 text-center">
            <ImageOff className="mx-auto size-8 text-[#D4AF37]/60 mb-2" />
            <p className="text-sm text-[#6B7280]">No private photos have been added yet.</p>
          </div>
        )}
      </div>
    );
  }

  // ── PENDING — waiting for response ────────────────────────────────────────
  if (status === 'PENDING') {
    return (
      <div className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#FFFBEB] to-[#FDF6F0] p-6 text-center space-y-3">
        <Clock className="mx-auto size-8 text-[#D4AF37]" />
        <p className="font-semibold text-[#1A1A1A]">Request pending</p>
        <p className="text-sm text-[#6B7280]">
          Your request is awaiting their response. We&apos;ll notify you when they respond.
        </p>
        {feedback && <p className="text-sm text-[#7A1F2B]">{feedback}</p>}
        <PremiumButton
          variant="secondary"
          onClick={() => void handleWithdraw()}
          disabled={sending}
        >
          <X className="size-4" />
          Withdraw request
        </PremiumButton>
      </div>
    );
  }

  // ── REJECTED / WITHDRAWN / NONE — show request form ───────────────────────
  return (
    <div className="rounded-3xl border border-dashed border-[#D4AF37]/70 bg-[#FCFAF7] p-6 space-y-4">
      <div className="text-center">
        <Lock className="mx-auto size-8 text-[#7A1F2B]/50 mb-3" />
        <p className="font-semibold text-[#1A1A1A]">Private gallery</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          {status === 'REJECTED'
            ? 'Your previous request was declined. You can send a new request.'
            : 'Request access to view their private photos.'}
        </p>
      </div>

      {feedback && (
        <p className="rounded-xl bg-[#F8E8E8] px-4 py-2 text-center text-sm font-semibold text-[#7A1F2B]">
          {feedback}
        </p>
      )}

      {showMessageBox ? (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a short note (optional)…"
            maxLength={200}
            rows={3}
            className="w-full rounded-2xl border border-[#7A1F2B]/20 bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] outline-none focus:border-[#7A1F2B]/40 focus:ring-1 focus:ring-[#7A1F2B]/20 resize-none"
          />
          <div className="flex gap-2">
            <PremiumButton
              onClick={() => void handleSendRequest()}
              disabled={sending}
              className="flex-1"
            >
              <Send className="size-4" />
              {sending ? 'Sending…' : 'Send request'}
            </PremiumButton>
            <PremiumButton
              variant="secondary"
              onClick={() => {
                setShowMessageBox(false);
                setMessage('');
              }}
            >
              Cancel
            </PremiumButton>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <PremiumButton onClick={() => setShowMessageBox(true)}>
            <Camera className="size-4" />
            Request private photos
          </PremiumButton>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

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

  return <ProfileDetailView profile={state.profile} profileId={profileId} token={token} />;
}

// ── Profile detail view ───────────────────────────────────────────────────────

function ProfileDetailView({
  profile,
  profileId,
  token,
}: Readonly<{ profile: ProfileDetail; profileId: string; token: string | null }>) {
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

          {/* ── Photos / Gallery ── */}
          <ProfileDetailSection title="Photos / Gallery">
            <PhotoGallerySection profileId={actionProfileId} token={token} />
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

// ── Small helpers ─────────────────────────────────────────────────────────────

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

