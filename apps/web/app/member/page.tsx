'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberShell from './member-shell';
import { useMemberRequest } from '@/lib/member-api';
import {
  PremiumButton,
  PremiumCard,
  ProfileMatchCard,
  VerificationBadge,
  SectionHeader,
  EmptyState,
} from '@/app/components';
import {
  CheckCircle2,
  Heart,
  Eye,
  Crown,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Rocket,
  MessageSquare,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
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
  verification?: ProfileVerification;
  stats?: ProfileStats;
  moderation?: {
    approvalStatus: string;
  };
}

interface SubscriptionPlan {
  name: string;
  code: string;
  limits?: {
    interestsMonthly?: number;
    advancedFilters?: boolean;
    profileBoostsMonthly?: number;
  };
}

interface SubscriptionOverview {
  subscription?: {
    status: string;
    endsAt?: string;
  } | null;
  plan?: SubscriptionPlan | null;
  usage?: Array<{ key: string; count: number }>;
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
  otherProfile?: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
    occupation?: string;
  };
  lastMessageAt?: string;
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const memberRequest = useMemberRequest();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<MatchCard[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionOverview | null>(null);
  const [boosts, setBoosts] = useState<BoostItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      const results = await Promise.all([
        memberRequest('/api/me/profile'),
        memberRequest('/api/matches/recommended?limit=2'),
        memberRequest('/api/matches/search?limit=2&sort=RECENTLY_ACTIVE'),
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/subscription'),
        memberRequest('/api/me/boosts'),
        memberRequest('/api/me/conversations'),
      ]);

      const profileRes = results[0];
      const recRes = results[1];
      const activeRes = results[2];
      const interestsRes = results[3];
      const subRes = results[4];
      const boostsRes = results[5];
      const convRes = results[6];

      if (profileRes.ok && profileRes.data) {
        const rawProfile = (profileRes.data as { profile: ProfileData }).profile;
        if (!rawProfile.verification?.mobileVerified) {
          router.replace('/member/verification');
          return;
        }
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

      if (subRes.ok && subRes.data) {
        setSubscriptionData(subRes.data);
      }

      if (boostsRes.ok && boostsRes.data) {
        setBoosts((boostsRes.data as { boosts: BoostItem[] }).boosts ?? []);
      }

      if (convRes.ok && convRes.data) {
        setConversations(
          (convRes.data as { conversations: ConversationItem[] }).conversations ?? [],
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading your dashboard.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  async function handleInterestResponse(id: string, action: 'ACCEPT' | 'REJECT') {
    const result = await memberRequest(`/api/interests/${id}`, {
      method: 'PATCH',
      body: { action },
    });

    if (result.ok) {
      const results = await Promise.all([
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/profile'),
        memberRequest('/api/me/conversations'),
      ]);

      const interestsRes = results[0];
      const profileRes = results[1];
      const convRes = results[2];

      if (interestsRes.ok && interestsRes.data) {
        setInterests((interestsRes.data as { interests: InterestItem[] }).interests ?? []);
      }
      if (profileRes.ok && profileRes.data) {
        setProfile((profileRes.data as { profile: ProfileData }).profile);
      }
      if (convRes.ok && convRes.data) {
        setConversations(
          (convRes.data as { conversations: ConversationItem[] }).conversations ?? [],
        );
      }
    } else {
      setErrorMessage(result.message);
    }
  }

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
        await loadDashboardData();
      }
    } catch {
      setBoostMessage('Failed to activate profile boost. Please try again.');
    } finally {
      setActivatingBoost(false);
    }
  }

  if (loading) {
    return (
      <MemberShell
        title="Dashboard"
        subtitle="Start from your profile, matches, messages, and account updates."
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#7A1F2B]" />
          <p className="text-sm font-semibold text-[#6B7280]">Loading your premium dashboard...</p>
        </div>
      </MemberShell>
    );
  }

  // Active boost calculations
  const activeBoost = boosts.find((b) => new Date(b.endsAt) > new Date() && b.active);
  const isBoosted = !!activeBoost;
  const activeBoostEndsAt = activeBoost ? new Date(activeBoost.endsAt) : null;
  const boostHoursLeft = activeBoostEndsAt
    ? Math.ceil((activeBoostEndsAt.getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  // Boost allowance calculations
  const boostLimit = subscriptionData?.plan?.limits?.profileBoostsMonthly ?? 0;
  const boostUsed =
    subscriptionData?.usage?.find((u) => u.key === 'profileBoostsMonthly')?.count ?? 0;
  const boostsRemaining = boostLimit === -1 ? Infinity : Math.max(0, boostLimit - boostUsed);

  // Interest limit usage calculations
  const interestLimit = subscriptionData?.plan?.limits?.interestsMonthly ?? 5;
  const interestUsed =
    subscriptionData?.usage?.find((u) => u.key === 'interestsMonthly')?.count ?? 0;

  // Completion Checklist calculations
  const missingSteps = [];
  if (!profile?.personal?.lastName) {
    missingSteps.push({ label: 'Add your last name', path: '/member/profile/edit' });
  }
  if (!profile?.personal?.maritalStatus) {
    missingSteps.push({ label: 'Set your marital status', path: '/member/profile/edit' });
  }
  if (!profile?.religion?.religion) {
    missingSteps.push({ label: 'Select your religion', path: '/member/profile/edit' });
  }
  if (!profile?.religion?.community) {
    missingSteps.push({ label: 'Select your community background', path: '/member/profile/edit' });
  }
  if (!profile?.location?.city) {
    missingSteps.push({ label: 'Add your current city', path: '/member/profile/edit' });
  }
  if (!profile?.education?.highestQualification) {
    missingSteps.push({
      label: 'Add your educational qualification',
      path: '/member/profile/edit',
    });
  }
  if (!profile?.employment?.occupation) {
    missingSteps.push({ label: 'Specify your occupation', path: '/member/profile/edit' });
  }
  if (!profile?.about?.aboutMe) {
    missingSteps.push({ label: 'Write a warm "About Me" section', path: '/member/profile/edit' });
  }
  if (!profile?.about?.partnerExpectations) {
    missingSteps.push({ label: 'Specify your partner expectations', path: '/member/profile/edit' });
  }
  if (!profile?.verification?.mobileVerified) {
    missingSteps.push({ label: 'Verify your mobile number via OTP', path: '/member/verification' });
  }

  // Circular progress calculations
  const completionPercentage = profile?.completionPercentage ?? 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <MemberShell
      title="Dashboard"
      subtitle="Overview of your matrimonial status, dynamic interests, and verified suggestions."
    >
      {errorMessage ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fade-in">
          <AlertCircle className="size-5 shrink-0" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      ) : null}

      {/* Grid wrapper for entire page */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Area (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Banner */}
          <PremiumCard className="relative overflow-hidden bg-gradient-to-br from-[#7A1F2B] via-[#651925] to-[#4A0A14] p-6 text-white shadow-xl">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Matrimonial Hub
                </span>
                <h1 className="mt-2 text-3xl font-bold text-[#FCFAF7] md:text-4xl">
                  Namaste, {profile?.personal?.firstName ?? 'Vivah Member'}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#FCFAF7]/80 max-w-xl">
                  Manage your matrimonial activity in real time. Connect with genuine, verified
                  South Asian singles who are committed to a serious marriage journey in Australia.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/10 min-w-[100px]">
                  <Eye className="mx-auto size-5 text-[#D4AF37]" />
                  <span className="mt-2 block text-2xl font-bold">
                    {profile?.stats?.profileViews ?? 0}
                  </span>
                  <span className="text-xs text-[#FCFAF7]/70">Profile Views</span>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/10 min-w-[100px]">
                  <Heart className="mx-auto size-5 text-[#D4AF37]" />
                  <span className="mt-2 block text-2xl font-bold">
                    {profile?.stats?.interestsReceived ?? 0}
                  </span>
                  <span className="text-xs text-[#FCFAF7]/70">Interests Recd</span>
                </div>
              </div>
            </div>
          </PremiumCard>

          {/* Pending Actions & Conversations Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Received Interests Widget */}
            <PremiumCard className="flex flex-col justify-between p-5 min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3 mb-4">
                  <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <Heart className="size-5 text-[#7A1F2B]" /> Interests Received
                  </h3>
                  {interests.filter((i) => i.status === 'PENDING').length > 0 && (
                    <span className="rounded-full bg-[#F8E8E8] px-2.5 py-0.5 text-xs font-bold text-[#7A1F2B]">
                      {interests.filter((i) => i.status === 'PENDING').length} Pending
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#7A1F2B]/5">
                  {interests.length > 0 ? (
                    interests.slice(0, 3).map((interest) => {
                      const sender = interest.sender;
                      return (
                        <div key={interest.id} className="py-3 first:pt-0 last:pb-0 animate-hover">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/profiles/${sender?.id}`}
                                className="font-semibold text-[#1A1A1A] hover:text-[#7A1F2B] hover:underline text-sm truncate block"
                              >
                                {sender?.firstName ?? 'Member'}, {sender?.age ?? 'Age hidden'}
                              </Link>
                              <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                                {[sender?.city, sender?.occupation].filter(Boolean).join(' | ') ||
                                  'Australia'}
                              </p>
                            </div>
                            {interest.status === 'PENDING' ? (
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => void handleInterestResponse(interest.id, 'ACCEPT')}
                                  className="rounded-full bg-[#7A1F2B]/10 p-2 text-[#7A1F2B] hover:bg-[#7A1F2B] hover:text-white transition flex items-center justify-center"
                                  title="Accept Interest"
                                >
                                  <CheckCircle2 className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleInterestResponse(interest.id, 'REJECT')}
                                  className="rounded-full bg-[#6B7280]/10 p-2 text-[#6B7280] hover:bg-[#6B7280] hover:text-white transition flex items-center justify-center"
                                  title="Decline Interest"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold shrink-0 rounded-full px-2.5 py-0.5 bg-[#FCFAF7] text-[#6B7280] border border-[#7A1F2B]/5 uppercase tracking-wider text-[9px]">
                                {interest.status.toLowerCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <Heart className="size-7 text-[#7A1F2B]/35 mx-auto mb-2" />
                      <p className="text-xs text-[#6B7280] max-w-[200px] mx-auto">
                        No received interests yet. Complete your profile to attract other
                        matrimonial members.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <PremiumButton
                href="/member/interests"
                variant="ghost"
                className="w-full mt-4 min-h-[38px]"
              >
                Manage Interests
              </PremiumButton>
            </PremiumCard>

            {/* Recent Conversations Widget */}
            <PremiumCard className="flex flex-col justify-between p-5 min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3 mb-4">
                  <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <MessageSquare className="size-5 text-[#7A1F2B]" /> Active Chats
                  </h3>
                  {conversations.length > 0 && (
                    <span className="rounded-full bg-[#F8E8E8] px-2.5 py-0.5 text-xs font-bold text-[#7A1F2B]">
                      {conversations.length} Active
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#7A1F2B]/5">
                  {conversations.length > 0 ? (
                    conversations.slice(0, 3).map((conv) => {
                      const other = conv.otherProfile;
                      const initial = (other?.firstName ?? 'V').slice(0, 1).toUpperCase();
                      return (
                        <div key={conv.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-full bg-[#F8E8E8] text-[#7A1F2B] font-bold text-sm flex items-center justify-center shrink-0 border border-[#7A1F2B]/10">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/member/messages`}
                                  className="font-semibold text-[#1A1A1A] hover:text-[#7A1F2B] hover:underline text-sm truncate block"
                                >
                                  {other?.firstName ?? 'Member'}
                                </Link>
                                <p className="text-xs text-[#6B7280] truncate mt-0.5">
                                  {other?.occupation ? `${other.occupation} | ` : ''}
                                  {other?.city ?? 'Australia'}
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/member/messages"
                              className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B] hover:bg-[#F8E8E8] shrink-0 transition"
                              title="Go to messages"
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <MessageSquare className="size-7 text-[#7A1F2B]/35 mx-auto mb-2" />
                      <p className="text-xs text-[#6B7280] max-w-[200px] mx-auto">
                        No active conversations yet. Accept received interests to start chatting.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <PremiumButton
                href="/member/messages"
                variant="ghost"
                className="w-full mt-4 min-h-[38px]"
              >
                Open Inbox
              </PremiumButton>
            </PremiumCard>
          </div>

          {/* Discovery: Recommended Matches */}
          <div className="space-y-6">
            <SectionHeader
              title="Recommended Matches"
              subtitle="Handpicked profiles matching your specific partner preferences"
              action={
                <Link
                  href="/member/matches"
                  className="text-sm font-semibold text-[#7A1F2B] hover:text-[#651925] flex items-center gap-1"
                >
                  Explore all <ChevronRight className="size-4" />
                </Link>
              }
            />
            <div className="grid gap-6 md:grid-cols-2">
              {recommended.length > 0 ? (
                recommended.map((match) => (
                  <ProfileMatchCard
                    key={match.id}
                    profile={{
                      id: match.id,
                      name: match.firstName ?? 'Member',
                      age: match.age,
                      city: match.city || match.state || match.country || 'Australia',
                      community: match.community,
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
                <div className="md:col-span-2">
                  <EmptyState title="No custom recommendations yet">
                    Complete your partner preferences in edit profile to get matches tailored for
                    you.
                  </EmptyState>
                </div>
              )}
            </div>
          </div>

          {/* Discovery: Recently Active */}
          <div className="space-y-6">
            <SectionHeader
              title="Recently Active Members"
              subtitle="Serious matrimonial members active within the last 30 days"
              action={
                <Link
                  href="/member/matches"
                  className="text-sm font-semibold text-[#7A1F2B] hover:text-[#651925] flex items-center gap-1"
                >
                  Search all <ChevronRight className="size-4" />
                </Link>
              }
            />
            <div className="grid gap-6 md:grid-cols-2">
              {recentlyActive.length > 0 ? (
                recentlyActive.map((match) => (
                  <ProfileMatchCard
                    key={match.id}
                    profile={{
                      id: match.id,
                      name: match.firstName ?? 'Member',
                      age: match.age,
                      city: match.city || match.state || match.country || 'Australia',
                      community: match.community,
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
                <div className="md:col-span-2">
                  <EmptyState title="No recently active members found">
                    Check back later to discover newly active South Asian matrimonial profiles in
                    Australia.
                  </EmptyState>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Trust & Conversion Hub - 1 column) */}
        <div className="space-y-6">
          {/* Profile Strength Checklist */}
          <PremiumCard className="p-5">
            <h3 className="font-semibold text-[#1A1A1A] border-b border-[#7A1F2B]/10 pb-3">
              Profile Strength
            </h3>

            <div className="flex flex-col items-center mt-5">
              {/* Circular SVG Progress */}
              <div className="relative size-24 flex items-center justify-center">
                <svg className="size-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-[#F8E8E8]"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-[#7A1F2B] transition-all duration-500 ease-out"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#7A1F2B]">{completionPercentage}%</span>
                  <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Complete
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6B7280] text-center mt-4 max-w-[200px] leading-relaxed">
                Complete profiles get 3x more visibility and higher verification scores.
              </p>
            </div>

            {/* Checklist items */}
            {missingSteps.length > 0 ? (
              <div className="mt-5 space-y-2 bg-[#FCFAF7] p-3.5 rounded-2xl border border-[#7A1F2B]/5">
                <p className="text-[10px] font-bold text-[#7A1F2B] uppercase tracking-wider mb-2">
                  Next steps to 100%:
                </p>
                {missingSteps.slice(0, 3).map((step, idx) => (
                  <Link
                    key={idx}
                    href={step.path}
                    className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A] hover:text-[#7A1F2B] transition py-1 group"
                  >
                    <div className="size-1.5 rounded-full bg-[#D4AF37] shrink-0 group-hover:scale-125 transition" />
                    <span className="truncate flex-1">{step.label}</span>
                    <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 bg-green-50 text-green-800 p-3 rounded-2xl text-xs font-semibold border border-green-200">
                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                <span>Your profile is fully complete. Great job.</span>
              </div>
            )}

            <PremiumButton href="/member/profile/edit" variant="secondary" className="w-full mt-5">
              Complete Profile
            </PremiumButton>
          </PremiumCard>

          {/* Trust Verification Hub */}
          <PremiumCard className="p-5">
            <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3 mb-4">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#7A1F2B]" /> Trust Verification
              </h3>
              <VerificationBadge level={profile?.verification?.level} />
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7280]">Email ID Verified:</span>
                <span className="font-semibold text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Yes
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7280]">Mobile OTP Verified:</span>
                {profile?.verification?.mobileVerified ? (
                  <span className="font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Yes
                  </span>
                ) : (
                  <Link
                    href="/member/verification"
                    className="text-[#7A1F2B] font-semibold hover:underline"
                  >
                    Verify now
                  </Link>
                )}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7280]">ID & Residency:</span>
                {profile?.verification?.identityVerified ? (
                  <span className="font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Yes
                  </span>
                ) : (
                  <Link
                    href="/member/verification"
                    className="text-[#7A1F2B] font-semibold hover:underline"
                  >
                    Submit document
                  </Link>
                )}
              </div>
            </div>

            <p className="text-[10px] text-[#6B7280] leading-relaxed mt-4 bg-[#FCFAF7] p-3 rounded-2xl border border-[#7A1F2B]/5">
              Secure a verified gold badge to gain trust. Verification filters allow serious members
              to find you easily.
            </p>

            <PremiumButton href="/member/verification" variant="gold" className="w-full mt-4">
              Get Verified
            </PremiumButton>
          </PremiumCard>

          {/* Profile Booster widget */}
          <PremiumCard className="p-5 relative overflow-hidden">
            {isBoosted && (
              <div className="absolute right-0 top-0 bg-[#D4AF37] text-[#7A1F2B] px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-bl-2xl">
                Boosted
              </div>
            )}

            <h3 className="font-semibold text-[#1A1A1A] border-b border-[#7A1F2B]/10 pb-3 flex items-center gap-2">
              <Rocket className="size-5 text-[#D4AF37]" /> Profile Booster
            </h3>

            {isBoosted ? (
              <div className="mt-4 space-y-3">
                <div className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#D4AF37]/30 flex items-start gap-3">
                  <Sparkles className="size-5 text-[#D4AF37] shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-[#7A1F2B] uppercase tracking-wider">
                      Active Boost
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                      Your profile is placed at the top of matrimonial searches for Australian
                      singles.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] mt-3">
                      <Clock className="size-3.5" /> {boostHoursLeft} hours remaining
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs leading-relaxed text-[#6B7280]">
                  Boost your matrimonial profile to get **3x higher search rankings** and priority
                  featured recommendation slots.
                </p>
                <div className="bg-[#FCFAF7] p-3 rounded-2xl border border-[#7A1F2B]/5 text-xs text-[#1A1A1A] font-semibold flex items-center gap-2">
                  <Zap className="size-4 text-[#D4AF37]" />
                  <span>
                    {boostsRemaining === Infinity ? 'Unlimited' : boostsRemaining} boost credits
                    available
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <PremiumButton
                onClick={() => {
                  void handleActivateBoost();
                }}
                disabled={activatingBoost || boostsRemaining === 0 || isBoosted}
                variant="primary"
                className="w-full"
              >
                {activatingBoost ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Activating...
                  </>
                ) : isBoosted ? (
                  'Currently Boosted'
                ) : boostsRemaining > 0 ? (
                  'Activate 24h Boost'
                ) : (
                  'Buy Boost Credits'
                )}
              </PremiumButton>
            </div>

            {boostMessage ? (
              <p className="mt-3 text-xs font-semibold text-[#7A1F2B] text-center animate-fade-in">
                {boostMessage}
              </p>
            ) : null}
          </PremiumCard>

          {/* Membership & Limit Usage status */}
          <PremiumCard className="p-5">
            <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3 mb-4">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Crown className="size-5 text-[#D4AF37]" /> Member Tier
              </h3>
              <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#7A1F2B] uppercase tracking-wider">
                {subscriptionData?.plan?.name ?? 'Free Tier'}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Interest quota limit indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B7280]">Interests sent:</span>
                  <span className="text-[#1A1A1A]">
                    {interestUsed} / {interestLimit === -1 ? 'Unlimited' : interestLimit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F8E8E8]">
                  <div
                    className="h-2 rounded-full bg-[#7A1F2B] transition-all duration-500"
                    style={{
                      width: `${interestLimit === -1 ? 0 : Math.min(100, (interestUsed / interestLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Search capability indicator */}
              <div className="flex justify-between items-center text-xs bg-[#FCFAF7] p-3 rounded-2xl border border-[#7A1F2B]/5">
                <span className="text-[#6B7280]">Search Level:</span>
                <span className="font-bold text-[#7A1F2B]">
                  {subscriptionData?.plan?.limits?.advancedFilters
                    ? 'Advanced Filters'
                    : 'Standard Filters'}
                </span>
              </div>
            </div>

            <PremiumButton href="/member/subscription" variant="secondary" className="w-full mt-5">
              Manage Membership
            </PremiumButton>
          </PremiumCard>
        </div>
      </div>
    </MemberShell>
  );
}
