'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberShell from './member-shell';
import { useMemberRequest } from '@/lib/member-api';
import { useEntitlement } from '@/lib/use-entitlement';
import ProfileStrengthMeter, { type ProfileStrength } from './profile-strength-meter';
import {
  EmptyState,
  PremiumButton,
  PremiumCard,
  ProfileMatchCard,
} from '@/app/components';
import {
  AlertCircle,
  ArrowRight,
  Crown,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface InterestProfile {
  id: string;
  firstName?: string;
  age?: number;
  city?: string;
  occupation?: string;
  verificationLevel?: string;
}

interface InterestItem {
  id: string;
  status: string;
  sender?: InterestProfile;
  receiver?: InterestProfile;
  createdAt: string;
}

interface MatchCard {
  id: string;
  displayId: string;
  firstName?: string;
  age?: number;
  heightCm?: number;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  education?: string;
  religion?: string;
  community?: string;
  motherTongue?: string;
  maritalStatus?: string;
  verificationLevel: string;
  lastActiveAt?: Date;
  photoUrl?: string;
  matchScore: number;
  matchReasons: string[];
}

interface ProfileStats {
  profileViews: number;
  interestsReceived: number;
  interestsSent: number;
  favouritesCount: number;
}

interface ProfilePersonal {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
}

interface ProfileVerification {
  level: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  employmentVerified: boolean;
  visaVerified: boolean;
  policeClearanceVerified: boolean;
  facialVerified: boolean;
}

interface ProfileData {
  id: string;
  personal?: ProfilePersonal;
  religion?: { religion?: string; community?: string };
  location?: { city?: string; country?: string };
  education?: { highestQualification?: string };
  employment?: { occupation?: string };
  about?: { aboutMe?: string; partnerExpectations?: string };
  completionPercentage: number;
  profileStrength?: ProfileStrength;
  verification?: ProfileVerification;
  stats?: ProfileStats;
  moderation?: {
    approvalStatus: string;
  };
}

interface BoostItem {
  id: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  source: string;
}

interface ConversationItem {
  id: string;
  participantIds: string[];
  otherUserId?: string;
  isLocked?: boolean;
  lockReason?: string;
  otherProfile?: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
    occupation?: string;
  };
  lastMessageAt?: string;
}

interface SummaryCard {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function formatDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const memberRequest = useMemberRequest();
  const entitlement = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<MatchCard[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [boosts, setBoosts] = useState<BoostItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [profileViewersTotal, setProfileViewersTotal] = useState<number | null>(null);
  const [, setProfileViewersIsPaid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      const results = await Promise.all([
        memberRequest('/api/me/profile'),
        memberRequest('/api/matches/recommended?limit=4'),
        memberRequest('/api/matches/recommended?limit=4&mode=RECENTLY_ACTIVE'),
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/boosts'),
        memberRequest('/api/me/conversations'),
        memberRequest('/api/me/profile-viewers'),
      ]);

      const profileRes = results[0];
      const recRes = results[1];
      const activeRes = results[2];
      const interestsRes = results[3];
      const boostsRes = results[4];
      const convRes = results[5];
      const viewersRes = results[6];

      if (profileRes.ok && profileRes.data) {
        const rawProfile = (profileRes.data as { profile: ProfileData }).profile;
        if (rawProfile.moderation?.approvalStatus === 'DRAFT') {
          router.replace('/member/onboarding');
          return;
        }
        setProfile(rawProfile);
      } else {
        setErrorMessage(profileRes.message);
      }

      if (recRes.ok && recRes.data) {
        setRecommended((recRes.data as { results: MatchCard[] }).results ?? []);
      }

      if (activeRes.ok && activeRes.data) {
        setRecentlyActive((activeRes.data as { results: MatchCard[] }).results ?? []);
      }

      if (interestsRes.ok && interestsRes.data) {
        setInterests((interestsRes.data as { interests: InterestItem[] }).interests ?? []);
      }

      if (boostsRes.ok && boostsRes.data) {
        setBoosts((boostsRes.data as { boosts: BoostItem[] }).boosts ?? []);
      }

      if (convRes.ok && convRes.data) {
        setConversations(
          (convRes.data as { data?: ConversationItem[] }).data ?? [],
        );
      }

      if (viewersRes.ok && viewersRes.data) {
        const viewersData = viewersRes.data as { total: number; isPaid: boolean };
        setProfileViewersTotal(viewersData.total);
        setProfileViewersIsPaid(viewersData.isPaid);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while loading your dashboard.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  async function handleActivateBoost() {
    setActivatingBoost(true);
    setBoostMessage(null);
    try {
      const result = await memberRequest('/api/me/boosts', {
        method: 'POST',
        body: { durationHours: 24 },
      });
      setBoostMessage(result.message);
      if (result.ok) {
        await Promise.all([loadDashboardData(), entitlement.refresh()]);
      }
    } catch {
      setBoostMessage('Failed to activate profile boost. Please try again.');
    } finally {
      setActivatingBoost(false);
    }
  }

  const activeBoost = boosts.find((boost) => new Date(boost.endsAt) > new Date() && boost.active);
  const boostHoursLeft = activeBoost
    ? Math.ceil((new Date(activeBoost.endsAt).getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  const boostLimit = entitlement.plan?.limits?.profileBoostsMonthly ?? 0;
  const boostUsed =
    entitlement.usage.find((entry) => entry.key === 'profileBoostsMonthly')?.count ?? 0;
  const boostsRemaining = boostLimit === -1 ? Infinity : Math.max(0, boostLimit - boostUsed);

  const completionPercentage = profile?.completionPercentage ?? 0;
  const profileStrength = profile?.profileStrength ?? null;
  const strengthPercentage = profileStrength?.percentage ?? completionPercentage;
  const newMatchesCount = recommended.length + recentlyActive.length;
  const receivedInterestCount = profile?.stats?.interestsReceived ?? interests.length;
  const unreadMessagesCount = conversations.length;
  const profileViewsCount = profileViewersTotal ?? profile?.stats?.profileViews ?? 0;

  const summaryCards: SummaryCard[] = [
    { label: 'New matches', value: String(newMatchesCount), description: '', icon: Sparkles, href: '/member/matches' },
    { label: 'Received interests', value: String(receivedInterestCount), description: '', icon: Heart, href: '/member/interests' },
    { label: 'Messages', value: String(unreadMessagesCount), description: '', icon: MessageSquare, href: '/member/messages' },
    { label: 'Profile views', value: String(profileViewsCount), description: '', icon: Eye, href: '/member/profile-viewers' },
  ];

  const membershipName = entitlement.plan?.name ?? 'Free';

  const heroHighlights = [
    { label: 'Profile', value: `${strengthPercentage}%`, icon: CheckCircle2 },
    { label: 'Verification', value: profile?.verification?.level?.replaceAll('_', ' ') ?? 'Unverified', icon: ShieldCheck },
    { label: 'Plan', value: membershipName, icon: Crown },
  ];

  const discoverToday = [...recommended, ...recentlyActive].reduce<MatchCard[]>((items, match) => {
    if (items.some((item) => item.id === match.id) || items.length >= 4) return items;
    items.push(match);
    return items;
  }, []);

  const recentVisitorProfiles = discoverToday.slice(0, 4);

  if (loading) {
    return (
      <MemberShell
        title="Dashboard"
        subtitle="Start from your profile, matches, messages, and account updates."
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#A10E4D]" />
          <p className="text-sm font-semibold text-[#6B7280]">Loading your premium dashboard...</p>
        </div>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="Dashboard"
      subtitle="Your matchmaking overview."
    >
      {errorMessage ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="size-5 shrink-0" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-5">
        {/* Slim hero */}
        <PremiumCard className="relative overflow-hidden border border-[#A10E4D]/10 bg-[linear-gradient(135deg,#A10E4D_0%,#890B40_48%,#4A0A14_100%)] px-5 py-5 text-white shadow-[0_16px_48px_rgba(122,31,43,0.22)]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4A04C]/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#FFF9F5] sm:text-2xl">
                Namaste, {profile?.personal?.firstName ?? 'Vivah Member'}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <Icon className="size-3 text-[#D4A04C]" />
                      <span className="text-white/70">{item.label}:</span>
                      <span className="text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <PremiumButton href="/member/matches" variant="gold" className="text-sm">
                Find matches
              </PremiumButton>
              <PremiumButton href="/member/profile/edit" variant="secondary" className="text-sm">
                Edit profile
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>

        {profileStrength && strengthPercentage < 80 ? (
          <PremiumCard className="rounded-2xl border border-[#D4A04C]/25 bg-[#FFF8EC] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-[#2F2F2F]">
                  Complete your profile to get more matches
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Stronger profiles help members and families feel confident before they connect.
                </p>
              </div>
              {profileStrength.nextAction ? (
                <PremiumButton href={profileStrength.nextAction.href} className="text-sm">
                  {profileStrength.nextAction.actionLabel}
                </PremiumButton>
              ) : null}
            </div>
          </PremiumCard>
        ) : null}

        {/* 4 summary stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="group">
                <PremiumCard className="flex items-center gap-4 rounded-2xl border border-[#A10E4D]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="rounded-xl bg-[#FFF0F3] p-2.5 text-[#A10E4D]">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-[#2F2F2F]">{card.value}</p>
                    <p className="text-xs font-semibold text-[#6B7280]">{card.label}</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-[#A10E4D]/40 transition group-hover:translate-x-0.5 group-hover:text-[#A10E4D]" />
                </PremiumCard>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-5">
            {/* Recommended matches */}
            <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-[#2F2F2F]">Recommended today</p>
                <Link href="/member/matches" className="inline-flex items-center gap-1 text-sm font-semibold text-[#A10E4D]">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {discoverToday.length > 0 ? (
                  discoverToday.map((match) => (
                    <ProfileMatchCard
                      key={match.id}
                      compact
                      profile={{
                        id: match.id,
                        name: match.firstName ?? 'Vivah member',
                        age: match.age,
                        city: match.city || match.state || match.country || 'Australia',
                        community: match.community ?? match.motherTongue,
                        education: match.education,
                        matchScore: match.matchScore,
                        occupation: match.occupation,
                        photoUrl: match.photoUrl,
                        religion: match.religion,
                        verificationLevel: match.verificationLevel,
                        slug: match.id,
                      }}
                    />
                  ))
                ) : (
                  <div className="md:col-span-2 xl:col-span-4">
                    <EmptyState title="No picks yet">
                      Complete your profile to get personalised recommendations.
                    </EmptyState>
                  </div>
                )}
              </div>
            </PremiumCard>

            {/* Pending interests + Recent conversations */}
            <div className="grid gap-4 md:grid-cols-2">
              <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#2F2F2F]">Pending interests</p>
                  <Link href="/member/interests" className="text-xs font-semibold text-[#A10E4D]">View all</Link>
                </div>
                {interests.filter((i) => i.status === 'PENDING').length > 0 ? (
                  <div className="grid gap-2">
                    {interests.filter((i) => i.status === 'PENDING').slice(0, 4).map((item) => {
                      const p = item.sender ?? item.receiver;
                      return (
                        <Link key={item.id} href="/member/interests" className="flex items-center gap-3 rounded-xl bg-[#FFF9F5] px-3 py-2.5 transition hover:bg-white">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0F3] text-sm font-bold text-[#A10E4D]">
                            {(p?.firstName ?? 'V').slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2F2F2F]">{p?.firstName ?? 'Member'}</p>
                            <p className="text-xs text-[#6B7280]">{p?.age ? `${p.age} yrs` : ''}{p?.city ? ` · ${p.city}` : ''}</p>
                          </div>
                          <Heart className="ml-auto size-4 shrink-0 text-[#A10E4D]/50" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No pending interests right now.</p>
                )}
              </PremiumCard>

              <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#2F2F2F]">Recent messages</p>
                  <Link href="/member/messages" className="text-xs font-semibold text-[#A10E4D]">View all</Link>
                </div>
                {conversations.length > 0 ? (
                  <div className="grid gap-2">
                    {conversations.slice(0, 4).map((conv) => (
                      <Link key={conv.id} href="/member/messages" className="flex items-center gap-3 rounded-xl bg-[#FFF9F5] px-3 py-2.5 transition hover:bg-white">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0F3] text-sm font-bold text-[#A10E4D]">
                          {(conv.otherProfile?.firstName ?? 'V').slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2F2F2F]">{conv.otherProfile?.firstName ?? 'Member'}</p>
                          <p className="text-xs text-[#6B7280]">{conv.lastMessageAt ? formatDate(conv.lastMessageAt) : 'Active'}</p>
                        </div>
                        <MessageSquare className="ml-auto size-4 shrink-0 text-[#A10E4D]/50" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No active conversations yet.</p>
                )}
              </PremiumCard>
            </div>
          </div>

          {/* Sidebar */}
          <div className="grid gap-4 self-start">
            <ProfileStrengthMeter strength={profileStrength} compact />

            {/* Quick actions */}
            <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-4">
              <p className="mb-3 text-sm font-bold text-[#2F2F2F]">Quick actions</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Matches', href: '/member/matches', icon: Search },
                  { label: 'Upgrade', href: '/member/subscription', icon: Crown },
                  { label: 'Verify', href: '/member/verification', icon: ShieldCheck },
                  { label: 'Profile', href: '/member/profile/edit', icon: Star },
                  { label: 'Photos', href: '/member/media', icon: Eye },
                  { label: 'Activity', href: '/member/activity', icon: Heart },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-2.5 transition hover:bg-white"
                    >
                      <Icon className="size-4 text-[#A10E4D]" />
                      <span className="text-[11px] font-semibold text-[#2F2F2F]">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </PremiumCard>

            {/* Boost */}
            <PremiumCard className="rounded-2xl border border-[#D4A04C]/20 bg-[#FFF8EC] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Rocket className="size-4 text-[#A10E4D]" />
                <p className="text-sm font-bold text-[#2F2F2F]">Profile boost</p>
              </div>
              <p className="mb-3 text-xs text-[#6B7280]">
                {activeBoost
                  ? `Boost active · ${boostHoursLeft}h left`
                  : boostsRemaining === Infinity
                    ? 'Unlimited boosts on your plan'
                    : `${boostsRemaining} credit${boostsRemaining === 1 ? '' : 's'} remaining`}
              </p>
              <PremiumButton
                onClick={() => void handleActivateBoost()}
                disabled={Boolean(activeBoost) || boostsRemaining === 0 || activatingBoost}
                className="w-full text-sm"
              >
                {activatingBoost ? <><Loader2 className="size-3.5 animate-spin" /> Activating…</> : activeBoost ? 'Boost running' : 'Activate boost'}
              </PremiumButton>
              {boostMessage && <p className="mt-2 text-xs font-semibold text-[#A10E4D]">{boostMessage}</p>}
            </PremiumCard>

            {/* Recent visitors */}
            <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-[#2F2F2F]">Profile views</p>
                <Link href="/member/profile-viewers" className="text-xs font-semibold text-[#A10E4D]">View all</Link>
              </div>
              <p className="mb-3 text-2xl font-bold text-[#2F2F2F]">{profileViewsCount}</p>
              {recentVisitorProfiles.length > 0 ? (
                <div className="flex -space-x-2">
                  {recentVisitorProfiles.map((profileCard) => (
                    <div
                      key={`visitor-${profileCard.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FFF0F3] text-sm font-bold text-[#A10E4D]"
                    >
                      {(profileCard.firstName || 'V').slice(0, 1)}
                    </div>
                  ))}
                  {profileViewsCount > recentVisitorProfiles.length && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FFF7EC] text-xs font-semibold text-[#A10E4D]">
                      +{profileViewsCount - recentVisitorProfiles.length}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">Views will appear as members discover you.</p>
              )}
            </PremiumCard>
          </div>
        </div>
      </div>
    </MemberShell>
  );
}
