'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberShell from './member-shell';
import { useMemberRequest } from '@/lib/member-api';
import {
  EmptyState,
  PremiumButton,
  PremiumCard,
  ProfileMatchCard,
  SectionHeader,
  VerificationBadge,
} from '@/app/components';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
  Zap,
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

interface SummaryCard {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface JourneyStep {
  label: string;
  complete: boolean;
  description: string;
}

interface ActionCard {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'gold' | 'burgundy' | 'emerald';
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
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

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<MatchCard[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionOverview | null>(null);
  const [boosts, setBoosts] = useState<BoostItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [profileViewersTotal, setProfileViewersTotal] = useState<number | null>(null);
  const [profileViewersIsPaid, setProfileViewersIsPaid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      const results = await Promise.all([
        memberRequest('/api/me/profile'),
        memberRequest('/api/matches/recommended?limit=4'),
        memberRequest('/api/matches/search?limit=4&sort=RECENTLY_ACTIVE'),
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/subscription'),
        memberRequest('/api/me/boosts'),
        memberRequest('/api/me/conversations'),
        memberRequest('/api/me/profile-viewers'),
      ]);

      const profileRes = results[0];
      const recRes = results[1];
      const activeRes = results[2];
      const interestsRes = results[3];
      const subRes = results[4];
      const boostsRes = results[5];
      const convRes = results[6];
      const viewersRes = results[7];

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
        await loadDashboardData();
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

  const boostLimit = subscriptionData?.plan?.limits?.profileBoostsMonthly ?? 0;
  const boostUsed =
    subscriptionData?.usage?.find((entry) => entry.key === 'profileBoostsMonthly')?.count ?? 0;
  const boostsRemaining = boostLimit === -1 ? Infinity : Math.max(0, boostLimit - boostUsed);

  const completionPercentage = profile?.completionPercentage ?? 0;
  const interestLimit = subscriptionData?.plan?.limits?.interestsMonthly ?? 5;
  const interestUsed =
    subscriptionData?.usage?.find((entry) => entry.key === 'interestsMonthly')?.count ?? 0;

  const newMatchesCount = recommended.length + recentlyActive.length;
  const receivedInterestCount = profile?.stats?.interestsReceived ?? interests.length;
  const unreadMessagesCount = conversations.length;
  const profileViewsCount = profileViewersTotal ?? profile?.stats?.profileViews ?? 0;

  const summaryCards: SummaryCard[] = [
    {
      label: 'New matches',
      value: String(newMatchesCount),
      description: 'Fresh profiles with stronger alignment to your preferences.',
      icon: Sparkles,
      href: '/member/matches',
    },
    {
      label: 'Received interests',
      value: String(receivedInterestCount),
      description: 'People who have already shown intention toward your profile.',
      icon: Heart,
      href: '/member/interests',
    },
    {
      label: 'Unread messages',
      value: String(unreadMessagesCount),
      description: 'Open conversations ready for your next thoughtful reply.',
      icon: MessageSquare,
      href: '/member/messages',
    },
    {
      label: 'Profile views',
      value: String(profileViewsCount),
      description: profileViewersIsPaid
        ? 'See who is taking a closer look at your profile.'
        : 'Profile attention is building as members discover you.',
      icon: Eye,
      href: '/member/profile-viewers',
    },
  ];

  const journeySteps: JourneyStep[] = [
    {
      label: 'Profile completed',
      complete: completionPercentage >= 90,
      description: `${completionPercentage}% complete`,
    },
    {
      label: 'Verified',
      complete: Boolean(profile?.verification?.identityVerified || profile?.verification?.level),
      description: profile?.verification?.level
        ? `${profile.verification.level.replaceAll('_', ' ')} trust level`
        : 'Verification pending',
    },
    {
      label: 'First interest sent',
      complete: (profile?.stats?.interestsSent ?? 0) > 0,
      description: `${profile?.stats?.interestsSent ?? 0} sent`,
    },
    {
      label: 'First conversation',
      complete: conversations.length > 0,
      description: `${conversations.length} active chats`,
    },
    {
      label: 'Contact exchanged',
      complete:
        conversations.length > 0 && interests.some((interest) => interest.status === 'ACCEPTED'),
      description: 'Mutual trust and progress milestone',
    },
  ];

  const nextActions: ActionCard[] = [
    {
      title: 'Complete verification',
      body: profile?.verification?.identityVerified
        ? 'Your verification is already strengthening trust signals.'
        : 'Verified profiles feel safer and are easier for serious members to trust quickly.',
      href: '/member/verification',
      cta: profile?.verification?.identityVerified ? 'Review trust status' : 'Get verified',
      icon: ShieldCheck,
      tone: 'gold',
    },
    {
      title: 'Improve profile photos',
      body: 'Refresh your gallery and privacy settings so the right people see a stronger first impression.',
      href: '/member/media',
      cta: 'Manage photos',
      icon: Star,
      tone: 'burgundy',
    },
    {
      title: "View today's matches",
      body: 'Spend a few minutes on your best recommendations while they are newly active.',
      href: '/member/matches',
      cta: 'Explore matches',
      icon: UserRoundCheck,
      tone: 'emerald',
    },
    {
      title: 'Reply to pending interests',
      body:
        interests.filter((interest) => interest.status === 'PENDING').length > 0
          ? 'You have people waiting on a response. Moving quickly can keep the momentum warm.'
          : 'No pending replies right now. Keep your profile strong so new interest keeps coming.',
      href: '/member/interests',
      cta: 'Open interests',
      icon: Heart,
      tone: 'gold',
    },
  ];

  const discoverToday = [...recommended, ...recentlyActive].reduce<MatchCard[]>((items, match) => {
    if (items.some((item) => item.id === match.id) || items.length >= 4) {
      return items;
    }
    items.push(match);
    return items;
  }, []);

  const pendingInterests = interests.filter((interest) => interest.status === 'PENDING').length;
  const acceptedInterests = interests.filter((interest) => interest.status === 'ACCEPTED').length;
  const membershipName = subscriptionData?.plan?.name ?? 'Free';
  const membershipEndsAt = formatDate(subscriptionData?.subscription?.endsAt);

  const heroHighlights = [
    {
      label: 'Profile completion',
      value: `${completionPercentage}%`,
      icon: CheckCircle2,
    },
    {
      label: 'Verification',
      value: profile?.verification?.level?.replaceAll('_', ' ') ?? 'Unverified',
      icon: ShieldCheck,
    },
    {
      label: 'Membership',
      value: membershipName,
      icon: Crown,
    },
  ];

  const spotlightCards = [
    {
      title: 'Boost visibility',
      description: activeBoost
        ? `Your profile boost is active for another ${boostHoursLeft}h.`
        : boostsRemaining === Infinity
          ? 'Unlimited boosts available with your current tier.'
          : `${boostsRemaining} boost credit${boostsRemaining === 1 ? '' : 's'} available right now.`,
      cta: activeBoost ? 'Boost running' : 'Activate 24h boost',
      disabled: Boolean(activeBoost) || boostsRemaining === 0,
      icon: Rocket,
      onClick: () => {
        void handleActivateBoost();
      },
    },
    {
      title: 'Membership usage',
      description:
        interestLimit === -1
          ? 'Unlimited interest sending on your current plan.'
          : `${interestUsed} of ${interestLimit} monthly interests used so far.`,
      cta: 'Manage membership',
      href: '/member/subscription',
      icon: Crown,
    },
  ];

  const recommendedForYouCount = discoverToday.filter((match) => match.matchScore >= 80).length;
  const dashboardInsight = useMemo(() => {
    if (pendingInterests > 0) {
      return `${pendingInterests} pending interest${pendingInterests === 1 ? '' : 's'} could become your next conversation if you reply today.`;
    }

    if (recommendedForYouCount > 0) {
      return `${recommendedForYouCount} strong matches are sitting above an 80% score right now.`;
    }

    if (activeBoost) {
      return 'Your boosted profile is already positioned for higher discovery today.';
    }

    return 'A complete, verified profile will keep improving the quality of your introductions.';
  }, [activeBoost, pendingInterests, recommendedForYouCount]);

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
      subtitle="Your matchmaking command center for discovery, trust, and momentum."
    >
      {errorMessage ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="size-5 shrink-0" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-8">
        <PremiumCard className="relative overflow-hidden border border-[#7A1F2B]/10 bg-[linear-gradient(135deg,#7A1F2B_0%,#651925_48%,#4A0A14_100%)] p-6 text-white shadow-[0_24px_70px_rgba(122,31,43,0.24)]">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                Matchmaking command center
              </p>
              <h1 className="mt-3 text-3xl font-bold text-[#FCFAF7] sm:text-4xl">
                Namaste, {profile?.personal?.firstName ?? 'Vivah Member'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#FCFAF7]/80 sm:text-base">
                Focus on the next best move for your search. We have surfaced your profile strength,
                trust status, conversation momentum, and best matches in one calmer place.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PremiumButton href="/member/matches" variant="gold" className="min-w-[180px]">
                  Explore Matches
                </PremiumButton>
                <PremiumButton href="/member/profile/edit" variant="secondary" className="min-w-[180px]">
                  Improve Profile
                </PremiumButton>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"
                    >
                      <Icon className="size-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                    Today&apos;s signal
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{dashboardInsight}</p>
                </div>
                <VerificationBadge level={profile?.verification?.level} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                    Membership status
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">{membershipName}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {membershipEndsAt ? `Renews or ends around ${membershipEndsAt}` : 'Manage your plan anytime'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                    Conversation momentum
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">{conversations.length} active</p>
                  <p className="mt-1 text-sm text-white/70">
                    {acceptedInterests > 0
                      ? `${acceptedInterests} accepted interest${acceptedInterests === 1 ? '' : 's'} already opened the door.`
                      : 'Responding to interests is the fastest way to unlock momentum.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PremiumCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="group">
                <PremiumCard className="h-full rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(122,31,43,0.12)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[#1A1A1A]">{card.value}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8E8E8] p-3 text-[#7A1F2B]">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#6B7280]">{card.description}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B]">
                    Open
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </p>
                </PremiumCard>
              </Link>
            );
          })}
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
            <SectionHeader
              eyebrow="Your journey"
              title="Progress toward stronger introductions"
              subtitle="These milestones help move your profile from being visible to being trusted and actively engaged."
            />

            <div className="mt-6 grid gap-4">
              {journeySteps.map((step, index) => (
                <div
                  key={step.label}
                  className="flex items-start gap-4 rounded-3xl bg-[#FCFAF7] p-4"
                >
                  <div
                    className={cx(
                      'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      step.complete ? 'bg-[#7A1F2B] text-white' : 'bg-white text-[#D4AF37]',
                    )}
                  >
                    {step.complete ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#1A1A1A]">{step.label}</h3>
                      <span
                        className={cx(
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                          step.complete
                            ? 'bg-[#E8F7EF] text-[#1F6F4A]'
                            : 'bg-[#FFF2CD] text-[#7A1F2B]',
                        )}
                      >
                        {step.complete ? 'Done' : 'Next up'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6B7280]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <div className="grid gap-6">
            <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
              <SectionHeader
                eyebrow="Recommended next actions"
                title="What will improve your momentum fastest"
                subtitle="Small actions here usually have the biggest impact on response quality."
              />

              <div className="mt-6 grid gap-4">
                {nextActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className={cx(
                        'rounded-3xl border p-4 transition duration-200 hover:-translate-y-0.5',
                        action.tone === 'gold' && 'border-[#D4AF37]/30 bg-[#FFF8EC]',
                        action.tone === 'burgundy' && 'border-[#7A1F2B]/10 bg-[#FCFAF7]',
                        action.tone === 'emerald' && 'border-[#DDEFE7] bg-[#F7FBF8]',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cx(
                            'rounded-2xl p-3',
                            action.tone === 'gold' && 'bg-white text-[#D4AF37]',
                            action.tone === 'burgundy' && 'bg-white text-[#7A1F2B]',
                            action.tone === 'emerald' && 'bg-white text-[#1F6F4A]',
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#1A1A1A]">{action.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#6B7280]">{action.body}</p>
                          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B]">
                            {action.cta}
                            <ArrowRight className="size-4" />
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </PremiumCard>

            <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
              <SectionHeader
                eyebrow="Spotlight"
                title="Visibility and plan tools"
                subtitle="Keep your profile discoverable while staying in control of your pace."
              />

              <div className="mt-6 grid gap-4">
                {spotlightCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-3xl bg-[#FCFAF7] p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-3 text-[#7A1F2B]">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#1A1A1A]">{card.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        {'href' in card ? (
                          <PremiumButton href={card.href} variant="secondary" className="w-full">
                            {card.cta}
                          </PremiumButton>
                        ) : (
                          <PremiumButton
                            onClick={card.onClick}
                            disabled={card.disabled || activatingBoost}
                            className="w-full"
                          >
                            {activatingBoost && card.title === 'Boost visibility' ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Activating...
                              </>
                            ) : (
                              card.cta
                            )}
                          </PremiumButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {boostMessage ? (
                <p className="mt-4 rounded-2xl border border-[#D4AF37]/30 bg-[#FFF8EC] p-3 text-sm font-semibold text-[#7A1F2B]">
                  {boostMessage}
                </p>
              ) : null}
            </PremiumCard>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
            <SectionHeader
              eyebrow="People to discover today"
              title="A smaller, stronger shortlist to review now"
              subtitle="These profiles are surfaced to help you move from browsing into serious conversations."
              action={
                <Link
                  href="/member/matches"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B]"
                >
                  Explore all
                  <ArrowRight className="size-4" />
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                <div className="md:col-span-2">
                  <EmptyState title="No discovery picks yet">
                    Complete your profile and partner preferences to unlock better recommendations.
                  </EmptyState>
                </div>
              )}
            </div>
          </PremiumCard>

          <div className="grid gap-6">
            <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
              <SectionHeader
                eyebrow="Attention and timing"
                title="Stay aware of where your momentum is building"
                subtitle="A quick glance at profile attention and conversation readiness."
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#FCFAF7] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-[#7A1F2B]">
                      <Eye className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                        Viewed me
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">{profileViewsCount}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                    {profileViewersIsPaid
                      ? 'Your paid viewer insights are active.'
                      : 'Upgrade for clearer visibility into profile attention.'}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#FCFAF7] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-[#7A1F2B]">
                      <Clock3 className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                        Pending replies
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">{pendingInterests}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                    Responding while interest is fresh usually improves conversation momentum.
                  </p>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
              <SectionHeader
                eyebrow="Plan and trust"
                title="Your profile is easier to trust when signals stay strong"
                subtitle="A compact view of the core things members notice first."
              />

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-[#FCFAF7] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-[#7A1F2B]" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">Verification level</p>
                      <p className="text-sm text-[#6B7280]">
                        Email and mobile verified, with stronger trust when ID is approved.
                      </p>
                    </div>
                  </div>
                  <VerificationBadge level={profile?.verification?.level} />
                </div>

                <div className="flex items-center justify-between rounded-3xl bg-[#FCFAF7] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Zap className="size-5 text-[#7A1F2B]" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">Interest usage</p>
                      <p className="text-sm text-[#6B7280]">
                        {interestLimit === -1
                          ? 'Unlimited monthly sending on your current tier.'
                          : `${interestUsed} of ${interestLimit} monthly interests used.`}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
                    {subscriptionData?.plan?.limits?.advancedFilters ? 'Advanced search' : 'Standard search'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-3xl bg-[#FCFAF7] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Crown className="size-5 text-[#D4AF37]" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">Membership tier</p>
                      <p className="text-sm text-[#6B7280]">
                        {membershipEndsAt
                          ? `Coverage visible through around ${membershipEndsAt}.`
                          : 'Manage membership, billing, and boost access here.'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/member/subscription"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B]"
                  >
                    Manage
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>
    </MemberShell>
  );
}
