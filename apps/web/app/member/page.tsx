'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  Bell,
  CheckCircle2,
  Heart,
  Eye,
  Crown,
  ChevronRight,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

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
}

interface ProfileVerification {
  level: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

interface ProfileData {
  id: string;
  personal?: ProfilePersonal;
  completionPercentage: number;
  verification?: ProfileVerification;
  stats?: ProfileStats;
}

interface SubscriptionPlan {
  name: string;
  limits?: {
    interestsMonthly?: number;
    advancedFilters?: boolean;
  };
}

interface SubscriptionOverview {
  subscription?: {
    status: string;
    endsAt?: string;
  } | null;
  plan?: SubscriptionPlan | null;
}

export default function MemberDashboardPage() {
  const memberRequest = useMemberRequest();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<MatchCard[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionOverview | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      const results = await Promise.all([
        memberRequest('/api/me/profile'),
        memberRequest('/api/matches/recommended?limit=2'),
        memberRequest('/api/matches/search?limit=2&sort=RECENTLY_ACTIVE'),
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/subscription'),
        memberRequest('/api/me/notifications'),
      ]);

      const profileRes = results[0];
      const recRes = results[1];
      const activeRes = results[2];
      const interestsRes = results[3];
      const subRes = results[4];
      const notifRes = results[5];

      if (profileRes.ok && profileRes.data) {
        setProfile((profileRes.data as { profile: ProfileData }).profile);
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

      if (notifRes.ok && notifRes.data) {
        setNotifications((notifRes.data as { notifications: NotificationItem[] }).notifications ?? []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while loading your dashboard.';
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
        memberRequest('/api/me/notifications'),
        memberRequest('/api/me/profile'),
      ]);

      const interestsRes = results[0];
      const notifRes = results[1];
      const profileRes = results[2];
      
      if (interestsRes.ok && interestsRes.data) {
        setInterests((interestsRes.data as { interests: InterestItem[] }).interests ?? []);
      }
      if (notifRes.ok && notifRes.data) {
        setNotifications((notifRes.data as { notifications: NotificationItem[] }).notifications ?? []);
      }
      if (profileRes.ok && profileRes.data) {
        setProfile((profileRes.data as { profile: ProfileData }).profile);
      }
    } else {
      setErrorMessage(result.message);
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

  return (
    <MemberShell
      title="Dashboard"
      subtitle="Start from your profile, matches, messages, and account updates."
    >
      {errorMessage ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="size-5 shrink-0" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Welcome Card */}
        <PremiumCard className="relative overflow-hidden bg-gradient-to-br from-[#7A1F2B] via-[#651925] to-[#4A0A14] p-6 text-white shadow-xl md:col-span-2">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Matrimonial Dashboard</span>
              <h1 className="mt-2 text-3xl font-bold text-[#FCFAF7] md:text-4xl">
                Namaste, {profile?.personal?.firstName ?? 'Vivah Member'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#FCFAF7]/80 max-w-xl">
                Welcome to your matrimonial dashboard. Discover matches, manage dynamic interests, and follow up with certified members to begin your sacred marriage journey.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/10 min-w-[100px]">
                <Eye className="mx-auto size-5 text-[#D4AF37]" />
                <span className="mt-2 block text-2xl font-bold">{profile?.stats?.profileViews ?? 0}</span>
                <span className="text-xs text-[#FCFAF7]/70">Profile Views</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/10 min-w-[100px]">
                <Heart className="mx-auto size-5 text-[#D4AF37]" />
                <span className="mt-2 block text-2xl font-bold">{profile?.stats?.interestsReceived ?? 0}</span>
                <span className="text-xs text-[#FCFAF7]/70">Interests Recd</span>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* Profile Completion Card */}
        <PremiumCard className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A1A]">Profile Completion</h3>
              <span className="text-sm font-bold text-[#7A1F2B]">{profile?.completionPercentage ?? 0}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full rounded-full bg-[#F8E8E8]">
              <div
                className="h-2.5 rounded-full bg-[#7A1F2B] transition-all duration-500"
                style={{ width: `${profile?.completionPercentage ?? 0}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
              Completed matrimonial profiles are shown 3x more frequently in matchmaking suggestions.
            </p>
          </div>
          <PremiumButton href="/member/profile/edit" variant="secondary" className="w-full">
            Complete Profile
          </PremiumButton>
        </PremiumCard>

        {/* Verification Status Card */}
        <PremiumCard className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A1A]">Trust Verification</h3>
              <VerificationBadge level={profile?.verification?.level} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
              A verified profile secures high-trust badge indicators, validating your identity, location, and residency.
            </p>
          </div>
          <PremiumButton href="/member/verification" variant="gold" className="w-full">
            Get Verified
          </PremiumButton>
        </PremiumCard>
      </div>

      {/* Discovery Grids */}
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Recommended Matches */}
        <div className="space-y-6">
          <SectionHeader
            title="Recommended Matches"
            subtitle="Handpicked profiles matching your partner criteria"
            action={
              <Link href="/member/matches" className="text-sm font-semibold text-[#7A1F2B] hover:text-[#651925] flex items-center gap-1">
                Explore all <ChevronRight className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-4">
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
              <EmptyState title="No recommendations yet">
                Ensure your preferences are completed to receive custom recommendations.
              </EmptyState>
            )}
          </div>
        </div>

        {/* Recently Active */}
        <div className="space-y-6">
          <SectionHeader
            title="Recently Active"
            subtitle="Matrimonial members active in the last 30 days"
            action={
              <Link href="/member/matches" className="text-sm font-semibold text-[#7A1F2B] hover:text-[#651925] flex items-center gap-1">
                Search more <ChevronRight className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-4">
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
              <EmptyState title="No active members found">
                Check back later to discover new Australia matrimonial users.
              </EmptyState>
            )}
          </div>
        </div>
      </div>

      {/* Relations & Premium Tiers */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Interests Received */}
        <PremiumCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Heart className="size-5 text-[#7A1F2B]" /> Interests Received
              </h3>
              {interests.length > 0 && (
                <span className="rounded-full bg-[#F8E8E8] px-2.5 py-0.5 text-xs font-bold text-[#7A1F2B]">
                  {interests.filter((i) => i.status === 'PENDING').length} Pending
                </span>
              )}
            </div>

            <div className="mt-4 divide-y divide-[#7A1F2B]/5">
              {interests.length > 0 ? (
                interests.slice(0, 3).map((interest) => {
                  const sender = interest.sender;
                  return (
                    <div key={interest.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/profiles/${sender?.id}`}
                            className="font-semibold text-[#1A1A1A] hover:text-[#7A1F2B] hover:underline text-sm"
                          >
                            {sender?.firstName ?? 'Member'}, {sender?.age ?? 'Age hidden'}
                          </Link>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {[sender?.city, sender?.occupation].filter(Boolean).join(' | ') || 'Australia'}
                          </p>
                        </div>
                        {interest.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleInterestResponse(interest.id, 'ACCEPT')}
                              className="rounded-full bg-[#7A1F2B]/10 p-1.5 text-[#7A1F2B] hover:bg-[#7A1F2B] hover:text-white transition flex items-center justify-center animate-hover"
                              title="Accept"
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleInterestResponse(interest.id, 'REJECT')}
                              className="rounded-full bg-[#6B7280]/10 p-1.5 text-[#6B7280] hover:bg-[#6B7280] hover:text-white transition flex items-center justify-center animate-hover"
                              title="Decline"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold capitalize text-[#6B7280]">
                            {interest.status.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-[#6B7280]">
                  No received interests yet. Complete your profile to attract more attention.
                </p>
              )}
            </div>
          </div>
          <PremiumButton href="/member/interests" variant="ghost" className="w-full mt-4 min-h-[38px]">
            Manage Interests
          </PremiumButton>
        </PremiumCard>

        {/* Membership Status */}
        <PremiumCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Crown className="size-5 text-[#D4AF37]" /> Membership Tier
              </h3>
              <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#7A1F2B]">
                {subscriptionData?.plan?.name ?? 'Free Tier'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-[#6B7280]">
                Active Tier: <span className="font-semibold text-[#1A1A1A]">{subscriptionData?.plan?.name ?? 'Free Plan'}</span>
              </p>
              {subscriptionData?.plan?.limits ? (
                <div className="space-y-1.5 bg-[#FCFAF7] p-3 rounded-2xl border border-[#7A1F2B]/5">
                  <p className="text-xs font-medium text-[#1A1A1A]">Monthly Allowances:</p>
                  <div className="flex justify-between text-[11px] text-[#6B7280] mt-1">
                    <span>Monthly Interests:</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {subscriptionData.plan.limits.interestsMonthly === -1 ? 'Unlimited' : subscriptionData.plan.limits.interestsMonthly ?? 5}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#6B7280]">
                    <span>Search Filters:</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {subscriptionData.plan.limits.advancedFilters ? 'Premium' : 'Standard'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">Upgrade your membership to gain access to premium advanced filters and unlimited interests.</p>
              )}
            </div>
          </div>
          <PremiumButton href="/member/subscription" variant="primary" className="w-full mt-4 min-h-[38px]">
            Manage Membership
          </PremiumButton>
        </PremiumCard>

        {/* Notifications Preview */}
        <PremiumCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#7A1F2B]/10 pb-3">
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Bell className="size-5 text-[#7A1F2B]" /> Notifications
              </h3>
              {notifications.filter((n) => !n.readAt).length > 0 && (
                <span className="rounded-full bg-[#7A1F2B] px-2 py-0.5 text-[10px] font-bold text-white">
                  {notifications.filter((n) => !n.readAt).length} New
                </span>
              )}
            </div>

            <div className="mt-4 divide-y divide-[#7A1F2B]/5">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif) => (
                  <div key={notif._id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{notif.title}</p>
                    <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{notif.body}</p>
                    <span className="text-[9px] text-[#6B7280] block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-[#6B7280]">
                  No recent notifications.
                </p>
              )}
            </div>
          </div>
          <PremiumButton href="/member/notifications" variant="ghost" className="w-full mt-4 min-h-[38px]">
            View All Notifications
          </PremiumButton>
        </PremiumCard>
      </div>
    </MemberShell>
  );
}
