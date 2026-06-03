'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Globe,
  Heart,
  Lock,
  MessageCircle,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { FAQAccordion, PremiumButton, PublicFooter, PublicHeader } from '@/app/components';
import { Badge } from '@/app/components/ui/badge';
import { track } from '@/lib/analytics';
import UpgradeModal from '../member/upgrade-modal';
import { validateCoupon } from '@/lib/public-api';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  features: string[];
  limits: Record<string, number>;
}

type TierKey = 'FREE' | 'PREMIUM' | 'GOLD' | 'PLATINUM';
type BillingOption = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
type ComparisonRowKey =
  | 'monthlyInterests'
  | 'acceptedMatchMessaging'
  | 'advancedFilters'
  | 'priorityDiscovery'
  | 'profileBoost'
  | 'photoPrivacyControls'
  | 'verificationSupport'
  | 'dedicatedProfileReview'
  | 'supportPriority';
type RecommendationPace = 'CASUAL' | 'ACTIVE';
type RecommendationAnswerKey =
  | 'searchPace'
  | 'wantsVisibility'
  | 'wantsPrioritySupport'
  | 'needsAdvancedFilters';

interface BillingOptionMeta {
  value: BillingOption;
  label: string;
  months: number;
  badge?: string;
}

interface RecommendationAnswers {
  searchPace: RecommendationPace;
  wantsVisibility: boolean;
  wantsPrioritySupport: boolean;
  needsAdvancedFilters: boolean;
}

interface ComparisonRow {
  key: ComparisonRowKey;
  label: string;
  outcomeLabel: string;
  type: 'boolean' | 'text';
}

type ComparisonValue = string | boolean;

interface TierContent {
  tierKey: TierKey;
  displayName: string;
  positioning: string;
  outcomeHeadline: string;
  benefits: Array<{ icon: ReactNode; label: string; outcome: string }>;
  ctaLabel: string;
  microcopy: string;
  comparison: Record<ComparisonRowKey, ComparisonValue>;
  recommendationLabel: string;
  color: 'free' | 'premium' | 'gold' | 'platinum';
}

interface DisplayPlan extends Plan {
  tierKey: TierKey;
  tierName: string;
  billingOption: BillingOption | 'FREE';
  billingLabel: string;
  periodLabel: string;
  positioning: string;
  outcomeHeadline: string;
  benefits: Array<{ icon: ReactNode; label: string; outcome: string }>;
  ctaLabel: string;
  microcopy: string;
  comparison: Record<ComparisonRowKey, ComparisonValue>;
  recommendationLabel: string;
  isAvailableForBilling: boolean;
  availabilityNote?: string;
  savingsLabel?: string;
  color: 'free' | 'premium' | 'gold' | 'platinum';
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const BILLING_OPTIONS: BillingOptionMeta[] = [
  { value: 'MONTHLY', label: 'Monthly', months: 1 },
  { value: 'QUARTERLY', label: 'Quarterly', months: 3, badge: 'Save more' },
  { value: 'ANNUAL', label: 'Annual', months: 12, badge: 'Best value' },
];

const BILLING_OPTION_MAP = Object.fromEntries(
  BILLING_OPTIONS.map((option) => [option.value, option]),
) as Record<BillingOption, BillingOptionMeta>;

const TIER_ORDER: TierKey[] = ['FREE', 'PREMIUM', 'GOLD', 'PLATINUM'];

const TIER_CONTENT: Record<TierKey, TierContent> = {
  FREE: {
    tierKey: 'FREE',
    displayName: 'Free',
    positioning: 'Start your journey',
    outcomeHeadline: 'Explore at your own pace',
    benefits: [
      { icon: <Users className="size-4" />, label: 'Build your profile', outcome: 'Make a strong first impression with a complete, polished profile' },
      { icon: <Heart className="size-4" />, label: 'Receive interests', outcome: 'See who is genuinely interested in connecting with you' },
      { icon: <Shield className="size-4" />, label: 'Privacy controls', outcome: 'Manage who sees your photos from day one' },
      { icon: <Star className="size-4" />, label: 'Explore matches', outcome: 'Browse compatible profiles before committing to premium' },
    ],
    ctaLabel: 'Create free profile',
    microcopy: 'No credit card required. Start browsing today.',
    comparison: {
      monthlyInterests: '5 interests / month',
      acceptedMatchMessaging: false,
      advancedFilters: false,
      priorityDiscovery: false,
      profileBoost: false,
      photoPrivacyControls: true,
      verificationSupport: false,
      dedicatedProfileReview: false,
      supportPriority: 'Standard support',
    },
    recommendationLabel: 'A calm way to start before investing in premium tools.',
    color: 'free',
  },
  PREMIUM: {
    tierKey: 'PREMIUM',
    displayName: 'Premium',
    positioning: 'Best for serious members',
    outcomeHeadline: 'Start meaningful conversations faster',
    benefits: [
      { icon: <MessageCircle className="size-4" />, label: 'Direct messaging', outcome: 'Connect directly with serious verified members without delay' },
      { icon: <TrendingUp className="size-4" />, label: 'Reach more matches', outcome: 'Reach up to 50 compatible matches every month' },
      { icon: <Zap className="size-4" />, label: 'Advanced filtering', outcome: 'Find exactly who you are looking for with precision filters' },
      { icon: <Eye className="size-4" />, label: 'Get noticed', outcome: 'Get noticed by more serious members with monthly profile boosts' },
      { icon: <Shield className="size-4" />, label: 'Privacy first', outcome: 'Stay in full control of your photo privacy and visibility' },
    ],
    ctaLabel: 'Unlock Premium',
    microcopy: 'Most popular with members actively looking for a partner.',
    comparison: {
      monthlyInterests: '50 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: false,
      profileBoost: '1 boost / month',
      photoPrivacyControls: true,
      verificationSupport: 'Standard review',
      dedicatedProfileReview: false,
      supportPriority: 'Member care',
    },
    recommendationLabel: 'Start meaningful conversations with serious verified members.',
    color: 'premium',
  },
  GOLD: {
    tierKey: 'GOLD',
    displayName: 'Gold',
    positioning: 'For faster results',
    outcomeHeadline: 'Get noticed by more serious members',
    benefits: [
      { icon: <TrendingUp className="size-4" />, label: 'Expand your reach', outcome: 'Connect with up to 120 compatible matches every month' },
      { icon: <Star className="size-4" />, label: 'Rise to the top', outcome: 'Appear higher in discovery when serious members are searching' },
      { icon: <Zap className="size-4" />, label: 'Smart filters', outcome: 'Surface aligned profiles faster across all of Australia' },
      { icon: <Eye className="size-4" />, label: 'Boost visibility', outcome: 'Stay visible with 4 profile boosts per month' },
      { icon: <ShieldCheck className="size-4" />, label: 'Priority support', outcome: 'Get faster help when you need to move forward with confidence' },
    ],
    ctaLabel: 'Choose Gold',
    microcopy: 'Ideal when response speed and stronger visibility matter.',
    comparison: {
      monthlyInterests: '120 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: true,
      profileBoost: '4 boosts / month',
      photoPrivacyControls: true,
      verificationSupport: 'Priority verification',
      dedicatedProfileReview: false,
      supportPriority: 'Priority care',
    },
    recommendationLabel: 'Get noticed by more serious members and build momentum faster.',
    color: 'gold',
  },
  PLATINUM: {
    tierKey: 'PLATINUM',
    displayName: 'Platinum',
    positioning: 'Maximum visibility + concierge',
    outcomeHeadline: 'The highest-visibility path to your life partner',
    benefits: [
      { icon: <Crown className="size-4" />, label: 'Top of discovery', outcome: 'Stay front-of-mind with the strongest discovery presence available' },
      { icon: <Users className="size-4" />, label: 'Curated introductions', outcome: 'Reach 200+ compatible members with maximum visibility' },
      { icon: <Sparkles className="size-4" />, label: 'Concierge assistance', outcome: 'Dedicated support team helps you present your best profile' },
      { icon: <Zap className="size-4" />, label: 'Premium boosts', outcome: '8 powerful visibility boosts every month' },
      { icon: <Phone className="size-4" />, label: 'Priority support', outcome: 'Front-of-queue care whenever you need guidance' },
    ],
    ctaLabel: 'Go Platinum',
    microcopy: 'For members who want the highest-touch experience.',
    comparison: {
      monthlyInterests: '200 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: true,
      profileBoost: '8 boosts / month',
      photoPrivacyControls: true,
      verificationSupport: 'Fast-track verification',
      dedicatedProfileReview: true,
      supportPriority: 'Front-of-queue',
    },
    recommendationLabel: 'The highest-visibility path to meaningful introductions.',
    color: 'platinum',
  },
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { key: 'monthlyInterests', label: 'Monthly interests', outcomeLabel: 'Reach more matches', type: 'text' },
  { key: 'acceptedMatchMessaging', label: 'Direct messaging', outcomeLabel: 'Start conversations', type: 'boolean' },
  { key: 'advancedFilters', label: 'Advanced filters', outcomeLabel: 'Find the right match', type: 'boolean' },
  { key: 'priorityDiscovery', label: 'Priority discovery', outcomeLabel: 'Get found first', type: 'boolean' },
  { key: 'profileBoost', label: 'Profile boost', outcomeLabel: 'Stay visible', type: 'text' },
  { key: 'photoPrivacyControls', label: 'Photo privacy', outcomeLabel: 'Stay in control', type: 'boolean' },
  { key: 'verificationSupport', label: 'Verification support', outcomeLabel: 'Build trust faster', type: 'text' },
  { key: 'dedicatedProfileReview', label: 'Dedicated review', outcomeLabel: 'Best presentation', type: 'boolean' },
  { key: 'supportPriority', label: 'Support priority', outcomeLabel: 'Get help fast', type: 'text' },
];

const SUCCESS_STORIES = [
  {
    id: 'sydney',
    names: 'Priya & Arjun',
    location: 'Sydney, NSW',
    image: '/success-stories/couple-sydney.jpg',
    story: 'We connected through Vivah after Arjun upgraded to Gold. Within three weeks we were having genuine conversations — something that felt impossible on other platforms. We got engaged last December.',
    duration: 'Met in 6 weeks',
    tier: 'Gold member',
  },
  {
    id: 'melbourne',
    names: 'Kavya & Rahul',
    location: 'Melbourne, VIC',
    image: '/success-stories/couple-melbourne.jpg',
    story: 'The advanced filters were the game changer. I could find someone who shared my values, not just my city. Rahul\'s Premium profile showed up first because his profile was boosted — and the rest is history.',
    duration: 'Met in 5 weeks',
    tier: 'Premium member',
  },
  {
    id: 'brisbane',
    names: 'Ananya & Dev',
    location: 'Brisbane, QLD',
    image: '/success-stories/couple-brisbane.jpg',
    story: 'As a busy professional, I needed a platform that respected my time. Vivah\'s Platinum membership gave me exactly that — curated introductions and a team that helped me present my best self. Dev and I are planning our wedding now.',
    duration: 'Met in 4 weeks',
    tier: 'Platinum member',
  },
] as const;

const TRUST_INDICATORS = [
  { icon: ShieldCheck, label: 'Verified Profiles', sub: 'Every member reviewed' },
  { icon: Lock, label: 'Secure Payments', sub: 'Stripe-powered checkout' },
  { icon: Globe, label: 'Privacy Protected', sub: 'Your data stays yours' },
  { icon: Phone, label: 'Australian Support', sub: 'Local team, real humans' },
] as const;

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'PayPal'] as const;

const OUTCOME_BENEFITS = [
  {
    icon: <MessageCircle className="size-6" />,
    headline: 'Start meaningful conversations faster',
    body: 'Stop waiting and wondering. Premium members connect directly with serious verified members who are ready to engage.',
    stat: '3×',
    statLabel: 'more conversations started',
  },
  {
    icon: <Heart className="size-6" />,
    headline: 'Reach more compatible matches',
    body: 'Our matching engine surfaces profiles aligned with your values, lifestyle, and location — not just any profile.',
    stat: '50+',
    statLabel: 'curated matches per month',
  },
  {
    icon: <Star className="size-6" />,
    headline: 'Get noticed by serious members',
    body: 'Profile boosts and priority discovery put you in front of the most engaged members at the moments that matter.',
    stat: '5×',
    statLabel: 'more profile views',
  },
] as const;

const FAQ_ITEMS = [
  {
    id: 'cancel',
    question: 'Can I cancel anytime?',
    answer: 'Yes. You can manage your subscription and stop future renewals from your billing settings at any time. Your access stays active for the period you have already paid for — no surprise charges.',
  },
  {
    id: 'after-upgrade',
    question: 'What happens immediately after I upgrade?',
    answer: 'Your membership tools unlock immediately after payment is confirmed. That means messaging access, advanced filtering, and visibility upgrades are available straight away — no waiting period.',
  },
  {
    id: 'secure',
    question: 'Are payments secure?',
    answer: 'Yes. All checkout is handled through Stripe, one of the world\'s most trusted payment processors. Your card details are never stored by Vivah Australia — they stay within Stripe\'s secure environment.',
  },
  {
    id: 'refund',
    question: 'Can I request a refund?',
    answer: 'Refund requests are reviewed under the Vivah Australia refund policy. If you have concerns before upgrading, our member care team can walk you through what to expect before checkout.',
  },
  {
    id: 'guarantee',
    question: 'Does a paid plan guarantee a match?',
    answer: 'No plan can guarantee a match — and any platform that claims otherwise is misleading you. What premium membership does is significantly improve your visibility, connection tools, and support so meaningful introductions happen faster.',
  },
  {
    id: 'photos',
    question: 'Who can see my private photos?',
    answer: 'Your photo visibility is always controlled by you. Paid plans do not override your privacy settings. You decide exactly who can request access to your private gallery.',
  },
  {
    id: 'boost',
    question: 'How does a profile boost work?',
    answer: 'Profile boosts increase your placement in discovery during active browsing windows, putting you in front of more compatible members at the right time. They do not guarantee replies, but they significantly improve your chances of being seen.',
  },
  {
    id: 'vip',
    question: 'What is the VIP Matchmaking tier?',
    answer: 'The Platinum plan is our VIP tier, offering maximum visibility, 8 monthly profile boosts, dedicated profile review, fast-track verification support, and front-of-queue member care. It\'s designed for members who want the highest-touch experience.',
  },
] as const;

const RECOMMENDATION_QUESTIONS = [
  {
    key: 'searchPace',
    prompt: 'How actively are you searching?',
    options: [
      { label: '🌙 Just exploring for now', value: 'CASUAL' as const },
      { label: '🔥 Actively looking for a partner', value: 'ACTIVE' as const },
    ],
  },
  {
    key: 'wantsVisibility',
    prompt: 'Do you want more profiles to see you?',
    options: [
      { label: '✨ Yes, I want to be seen first', value: true },
      { label: '👁️ I\'ll reach out myself', value: false },
    ],
  },
  {
    key: 'wantsPrioritySupport',
    prompt: 'Would dedicated support help you?',
    options: [
      { label: '🤝 Yes, I\'d like guidance', value: true },
      { label: '👌 I prefer to search independently', value: false },
    ],
  },
  {
    key: 'needsAdvancedFilters',
    prompt: 'Do you need specific match criteria?',
    options: [
      { label: '🎯 Yes, filters are important to me', value: true },
      { label: '🌊 I\'m open to broader matches', value: false },
    ],
  },
] as const;

const DEFAULT_RECOMMENDATION_ANSWERS: RecommendationAnswers = {
  searchPace: 'ACTIVE',
  wantsVisibility: true,
  wantsPrioritySupport: false,
  needsAdvancedFilters: true,
};

// ─── Utility Functions ────────────────────────────────────────────────────────

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getBillingOptionForPlan(plan: Plan): BillingOption | 'FREE' {
  if (plan.code === 'FREE') return 'FREE';
  if (plan.code.includes('_QUARTERLY')) return 'QUARTERLY';
  if (plan.code.includes('_ANNUAL') || plan.interval === 'YEAR') return 'ANNUAL';
  return 'MONTHLY';
}

function getTierKey(plan: Plan): TierKey {
  if (plan.code === 'FREE') return 'FREE';
  const candidate = plan.code.split('_')[0];
  if (candidate === 'PREMIUM' || candidate === 'GOLD' || candidate === 'PLATINUM') return candidate;
  return 'PREMIUM';
}

function getPeriodLabel(option: BillingOption) {
  switch (option) {
    case 'MONTHLY': return 'month';
    case 'QUARTERLY': return 'quarter';
    case 'ANNUAL': return 'year';
  }
}

function computeSavingsLabel(
  plansByBilling: Partial<Record<BillingOption, Plan>>,
  option: BillingOption,
) {
  if (option === 'MONTHLY') return undefined;
  const monthlyPlan = plansByBilling.MONTHLY;
  const targetPlan = plansByBilling[option];
  if (!monthlyPlan || !targetPlan) return option === 'ANNUAL' ? 'Best value' : undefined;
  const months = BILLING_OPTION_MAP[option].months;
  const baseline = monthlyPlan.priceCents * months;
  const savings = baseline - targetPlan.priceCents;
  if (savings <= 0) return option === 'ANNUAL' ? 'Best value' : undefined;
  const percent = Math.round((savings / baseline) * 100);
  return `Save ${percent}%`;
}

function scoreTier(tierKey: Exclude<TierKey, 'FREE'>, answers: RecommendationAnswers) {
  let score = tierKey === 'PREMIUM' ? 2 : tierKey === 'GOLD' ? 3 : 4;
  if (answers.searchPace === 'CASUAL') {
    score += tierKey === 'PREMIUM' ? 3 : tierKey === 'GOLD' ? 1 : 0;
  } else {
    score += tierKey === 'GOLD' ? 3 : tierKey === 'PLATINUM' ? 2 : 1;
  }
  if (answers.wantsVisibility) {
    score += tierKey === 'PLATINUM' ? 4 : tierKey === 'GOLD' ? 3 : 1;
  } else {
    score += tierKey === 'PREMIUM' ? 2 : 0;
  }
  if (answers.wantsPrioritySupport) {
    score += tierKey === 'PLATINUM' ? 4 : tierKey === 'GOLD' ? 2 : 0;
  } else {
    score += tierKey === 'PREMIUM' ? 1 : 0;
  }
  if (answers.needsAdvancedFilters) {
    score += tierKey === 'PREMIUM' ? 2 : tierKey === 'GOLD' ? 2 : 1;
  }
  return score;
}

function getRecommendedTier(answers: RecommendationAnswers): Exclude<TierKey, 'FREE'> {
  const candidates: Array<Exclude<TierKey, 'FREE'>> = ['PREMIUM', 'GOLD', 'PLATINUM'];
  return candidates.reduce((best, candidate) =>
    scoreTier(candidate, answers) > scoreTier(best, answers) ? candidate : best,
  );
}

// ─── Small UI Components ──────────────────────────────────────────────────────

function CheckCell({ value, highlight }: { value: boolean; highlight?: boolean }) {
  return value ? (
    <Check className={cx('mx-auto size-4', highlight ? 'text-[#A10E4D]' : 'text-emerald-600')} />
  ) : (
    <X className="mx-auto size-4 text-[#B8B0A6]" />
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
} as const;

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
} as const;

const staggerChild = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
} as const;

// ─── Success Story Carousel ───────────────────────────────────────────────────

function SuccessStoryCarousel() {
  const [current, setCurrent] = useState(0);
  const total = SUCCESS_STORIES.length;

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + total) % total);
    track('membership_success_story_viewed', { direction: 'prev' });
  }, [total]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
    track('membership_success_story_viewed', { direction: 'next' });
  }, [total]);

  const story = SUCCESS_STORIES[current]!;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#A10E4D]/10 bg-white shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={story.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid lg:grid-cols-[1fr_1.2fr]"
        >
          {/* Image */}
          <div className="relative min-h-[300px] overflow-hidden">
            <Image
              src={story.image}
              alt={`${story.names} - Vivah Australia success story`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A12]/60 via-transparent to-transparent lg:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <Badge variant="premium">{story.tier}</Badge>
              <Badge variant="gold">{story.duration}</Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-[#D4A04C] text-[#D4A04C]" />
                ))}
              </div>
              <blockquote className="text-base leading-8 text-[#2F2F2F] italic">
                &ldquo;{story.story}&rdquo;
              </blockquote>
              <div className="mt-5">
                <p className="text-base font-bold text-[#A10E4D]">{story.names}</p>
                <p className="text-sm text-[#6B7280]">{story.location}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                aria-label="Previous story"
                onClick={prev}
                className="grid size-10 place-items-center rounded-full border border-[#A10E4D]/20 bg-white text-[#A10E4D] transition hover:bg-[#A10E4D] hover:text-white"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex gap-2">
                {SUCCESS_STORIES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Story ${i + 1}`}
                    onClick={() => {
                      setCurrent(i);
                      track('membership_success_story_viewed', { story_index: i });
                    }}
                    className={cx(
                      'h-2 rounded-full transition-all duration-300',
                      i === current ? 'w-8 bg-[#A10E4D]' : 'w-2 bg-[#A10E4D]/20',
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next story"
                onClick={next}
                className="grid size-10 place-items-center rounded-full border border-[#A10E4D]/20 bg-white text-[#A10E4D] transition hover:bg-[#A10E4D] hover:text-white"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Loss Aversion Banner ─────────────────────────────────────────────────────

function LossAversionBanner({ viewCount = 12 }: { viewCount?: number }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.4 }}
      className="relative overflow-hidden rounded-[20px] border border-[#D4A04C]/40 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF0F3_100%)] px-5 py-4"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 text-[#6B7280] hover:text-[#2F2F2F]"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-4 pr-8">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#A10E4D]/10">
          <Eye className="size-5 text-[#A10E4D]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#2F2F2F]">
            {viewCount} members viewed your profile this month
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Upgrade to Premium to see who they are and connect directly before they find someone else.
          </p>
          <PremiumButton
            href="#membership-plans"
            variant="gold"
            className="mt-3 h-9 text-xs"
          >
            View plans
            <ArrowRight className="size-3.5" />
          </PremiumButton>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

const TIER_GRADIENTS = {
  free: 'from-white to-[#FAFAFA]',
  premium: 'from-[#FFF0F3] to-white',
  gold: 'from-[#FFF8EC] to-white',
  platinum: 'from-[#F8F0FF] to-white',
} as const;

const TIER_ACCENT_COLORS = {
  free: '#6B7280',
  premium: '#A10E4D',
  gold: '#D4A04C',
  platinum: '#7C3AED',
} as const;

interface PlanCardProps {
  plan: DisplayPlan;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, isRecommended, isSelected, onSelect }: PlanCardProps) {
  const isFree = plan.tierKey === 'FREE';
  const isUnavailable = !isFree && !plan.isAvailableForBilling;
  const displayPrice = isUnavailable ? 'Coming soon' : formatMoney(plan.priceCents, plan.currency);
  const accentColor = TIER_ACCENT_COLORS[plan.color];

  return (
    <motion.article
      id={`membership-plan-${plan.tierKey}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cx(
        'relative flex flex-col rounded-[30px] border p-6 transition-shadow duration-300',
        'bg-gradient-to-b',
        TIER_GRADIENTS[plan.color],
        isRecommended || isSelected
          ? 'border-[#D4A04C] shadow-[0_22px_60px_rgba(212,175,55,0.20)]'
          : 'border-[#A10E4D]/12 shadow-[0_18px_50px_rgba(122,31,43,0.06)]',
      )}
    >
      {/* Recommended ring */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge variant="premium">⭐ Recommended for you</Badge>
        </div>
      )}

      {plan.color === 'platinum' && (
        <div className="absolute -top-3.5 right-4">
          <Badge variant="vip">👑 VIP</Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant={plan.color === 'free' ? 'outline' : plan.color === 'gold' ? 'gold' : plan.color === 'platinum' ? 'vip' : 'default'}>
              {plan.billingLabel}
            </Badge>
            {plan.savingsLabel && !isFree ? (
              <Badge variant="emerald">{plan.savingsLabel}</Badge>
            ) : null}
          </div>
          <h2 className="text-2xl font-bold text-[#2F2F2F]">{plan.tierName}</h2>
          <p className="mt-1 text-sm font-semibold" style={{ color: accentColor }}>
            {plan.outcomeHeadline}
          </p>
        </div>
        {!isFree ? (
          <div className="rounded-full p-2.5" style={{ background: `${accentColor}14` }}>
            {plan.color === 'platinum' ? (
              <Crown className="size-5" style={{ color: accentColor }} />
            ) : (
              <Sparkles className="size-5" style={{ color: accentColor }} />
            )}
          </div>
        ) : null}
      </div>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold text-[#2F2F2F] sm:text-5xl">
          {displayPrice}
        </span>
        {!isUnavailable && !isFree ? (
          <span className="text-xs font-semibold uppercase text-[#6B7280]">
            / {plan.periodLabel}
          </span>
        ) : null}
      </div>

      {isUnavailable && plan.availabilityNote ? (
        <p className="mt-3 rounded-2xl border border-[#D4A04C]/30 bg-[#FFF7EA] px-4 py-3 text-xs font-semibold leading-5 text-[#A10E4D]">
          {plan.availabilityNote}
        </p>
      ) : null}

      {/* Benefits */}
      <ul className="mt-5 space-y-3 flex-1">
        {plan.benefits.map((benefit) => (
          <li
            key={benefit.label}
            className="flex items-start gap-3"
          >
            <div
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
              style={{ background: `${accentColor}14`, color: accentColor }}
            >
              {benefit.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2F2F2F]">{benefit.label}</p>
              <p className="text-xs leading-5 text-[#6B7280]">{benefit.outcome}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-6">
        {isFree ? (
          <PremiumButton href="/register" variant="secondary" className="h-12 w-full">
            {plan.ctaLabel}
          </PremiumButton>
        ) : (
          <PremiumButton
            onClick={onSelect}
            variant={plan.color === 'gold' || plan.color === 'platinum' ? 'gold' : 'primary'}
            className="h-12 w-full"
            disabled={!plan.isAvailableForBilling}
          >
            {plan.isAvailableForBilling ? plan.ctaLabel : `${plan.billingLabel} coming soon`}
          </PremiumButton>
        )}
        <p className="mt-3 text-center text-xs font-medium leading-5 text-[#6B7280]">
          {plan.microcopy}
        </p>
      </div>
    </motion.article>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function PricingClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingOption>('MONTHLY');
  const [manualSelectedTier, setManualSelectedTier] = useState<Exclude<TierKey, 'FREE'> | null>(null);
  const [recommendationAnswers, setRecommendationAnswers] = useState<RecommendationAnswers>(DEFAULT_RECOMMENDATION_ANSWERS);
  const [openComparisonRow, setOpenComparisonRow] = useState<ComparisonRowKey>('monthlyInterests');
  const trustStripRef = useRef<HTMLDivElement>(null);
  const [trustStripSeen, setTrustStripSeen] = useState(false);

  // Coupon state
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponPending, setCouponPending] = useState(false);
  const [couponApplied, setCouponApplied] = useState<{ code: string; label: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Track page view
  useEffect(() => {
    track('membership_page_viewed');
  }, []);

  // Track trust strip view
  useEffect(() => {
    const el = trustStripRef.current;
    if (!el || trustStripSeen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          track('membership_trust_strip_viewed');
          setTrustStripSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trustStripSeen]);

  // Fetch plans
  useEffect(() => {
    void fetch(`${apiBaseUrl}/api/plans`)
      .then((response) => response.json())
      .then((data: { plans?: Plan[] }) => setPlans(data.plans ?? []))
      .catch(() => setPlans([]));
  }, []);

  const recommendedTier = useMemo(
    () => getRecommendedTier(recommendationAnswers),
    [recommendationAnswers],
  );

  const displayPlans = useMemo(() => {
    const plansByTier = new Map<TierKey, Partial<Record<BillingOption, Plan>>>();
    const freePlan = plans.find((plan) => plan.code === 'FREE');

    for (const plan of plans.filter((item) => item.code !== 'FREE')) {
      const tierKey = getTierKey(plan);
      const billingOption = getBillingOptionForPlan(plan);
      if (billingOption === 'FREE') continue;
      const current = plansByTier.get(tierKey) ?? {};
      current[billingOption] = plan;
      plansByTier.set(tierKey, current);
    }

    return TIER_ORDER.flatMap((tierKey) => {
      const content = TIER_CONTENT[tierKey];

      if (tierKey === 'FREE') {
        if (!freePlan) return [];
        const plan: DisplayPlan = {
          ...freePlan,
          tierKey,
          tierName: content.displayName,
          billingOption: 'FREE',
          billingLabel: 'Free',
          periodLabel: 'month',
          positioning: content.positioning,
          outcomeHeadline: content.outcomeHeadline,
          benefits: content.benefits,
          ctaLabel: content.ctaLabel,
          microcopy: content.microcopy,
          comparison: content.comparison,
          recommendationLabel: content.recommendationLabel,
          isAvailableForBilling: true,
          color: content.color,
        };
        return [plan];
      }

      const billingPlans = plansByTier.get(tierKey) ?? {};
      const selectedBillingPlan = billingPlans[selectedBilling];
      const fallbackPlan = billingPlans.MONTHLY ?? Object.values(billingPlans)[0];
      if (!fallbackPlan) return [];

      const savingsLabel =
        computeSavingsLabel(billingPlans, selectedBilling) ?? BILLING_OPTION_MAP[selectedBilling].badge;

      if (!selectedBillingPlan) {
        const unavailablePlan: DisplayPlan = {
          ...fallbackPlan,
          tierKey,
          tierName: content.displayName,
          billingOption: selectedBilling,
          billingLabel: BILLING_OPTION_MAP[selectedBilling].label,
          periodLabel: getPeriodLabel(selectedBilling),
          positioning: content.positioning,
          outcomeHeadline: content.outcomeHeadline,
          benefits: content.benefits,
          ctaLabel: content.ctaLabel,
          microcopy: content.microcopy,
          comparison: content.comparison,
          recommendationLabel: content.recommendationLabel,
          isAvailableForBilling: false,
          availabilityNote: `${BILLING_OPTION_MAP[selectedBilling].label} billing for ${content.displayName} is coming soon.`,
          color: content.color,
          ...(savingsLabel ? { savingsLabel } : {}),
        };
        return [unavailablePlan];
      }

      const availablePlan: DisplayPlan = {
        ...selectedBillingPlan,
        tierKey,
        tierName: content.displayName,
        billingOption: selectedBilling,
        billingLabel: BILLING_OPTION_MAP[selectedBilling].label,
        periodLabel: getPeriodLabel(selectedBilling),
        positioning: content.positioning,
        outcomeHeadline: content.outcomeHeadline,
        benefits: content.benefits,
        ctaLabel: content.ctaLabel,
        microcopy: content.microcopy,
        comparison: content.comparison,
        recommendationLabel: content.recommendationLabel,
        isAvailableForBilling: true,
        color: content.color,
        ...(savingsLabel ? { savingsLabel } : {}),
      };
      return [availablePlan];
    });
  }, [plans, selectedBilling]);

  const effectiveTier = manualSelectedTier ?? recommendedTier;
  const effectivePlan = displayPlans.find((plan) => plan.tierKey === effectiveTier) ?? null;

  function handleRecommendationAnswer<Key extends RecommendationAnswerKey>(
    key: Key,
    value: RecommendationAnswers[Key],
  ) {
    setRecommendationAnswers((current) => ({ ...current, [key]: value }));
    track('membership_recommendation_answered', { question: key, answer: String(value) });
  }

  function highlightRecommendedPlan() {
    setManualSelectedTier(null);
    document.getElementById(`membership-plan-${recommendedTier}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function openPaidPlan(plan: DisplayPlan) {
    if (plan.tierKey === 'FREE' || !plan.isAvailableForBilling) return;
    setManualSelectedTier(plan.tierKey);
    setSelectedPlan(plan);
    track('membership_checkout_started', {
      tier: plan.tierKey,
      billing: plan.billingOption,
      price_cents: plan.priceCents,
    });
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F] font-poppins">
      <PublicHeader />

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#A10E4D]/10">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,160,76,0.18),transparent_38%),radial-gradient(ellipse_at_top_right,rgba(161,14,77,0.14),transparent_35%),linear-gradient(180deg,#FFFFFF_0%,#FFF9F5_100%)]" />

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-[#D4A04C]/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-0 size-96 rounded-full bg-[#A10E4D]/6 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-4">
              <Sparkles className="size-3 text-[#D4A04C]" />
              Australia&apos;s Trusted Indian Matrimonial Platform
            </Badge>

            <h1 className="font-playfair text-4xl font-bold leading-tight text-[#A10E4D] sm:text-5xl lg:text-6xl">
              Find Your Life Partner{' '}
              <span className="relative">
                Faster
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M0 6 Q100 0 200 6" stroke="#D4A04C" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5E6470]">
              Join thousands of Australians using Vivah to build meaningful relationships with
              serious, verified members — faster than ever before.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="#membership-plans" variant="gold" className="min-w-[200px] h-13 text-base">
                Upgrade Membership
                <ArrowRight className="size-4" />
              </PremiumButton>
              <PremiumButton href="#success-stories" variant="secondary" className="min-w-[180px] h-13 text-base">
                See success stories
              </PremiumButton>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, label: 'Verified community' },
                { icon: Lock, label: 'Secure checkout' },
                { icon: Check, label: 'Cancel anytime' },
                { icon: Globe, label: 'Australian support' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#A10E4D]/12 bg-white/90 px-4 py-2 text-sm font-semibold text-[#2F2F2F] shadow-sm"
                >
                  <Icon className="size-3.5 text-[#D4A04C]" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero visual cluster */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid gap-4"
          >
            <LossAversionBanner viewCount={12} />

            <div className="relative overflow-hidden rounded-[34px] border border-[#D4A04C]/25 bg-[linear-gradient(135deg,#FFF7F2_0%,#FFF1F4_48%,#FFF8EC_100%)] p-4 shadow-[0_24px_60px_rgba(122,31,43,0.14)]">
              <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
                <div className="relative min-h-[340px] overflow-hidden rounded-[28px] bg-[#F8E8DE]">
                  <Image
                    src="/success-stories/couple-melbourne.jpg"
                    alt="Vivah Australia premium couple membership experience"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 420px"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,47,47,0.04)_0%,rgba(47,47,47,0.34)_100%)]" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-[#A10E4D] shadow-sm">
                    Best value for serious members
                  </div>
                  <div className="absolute inset-x-4 bottom-4 rounded-[22px] border border-white/30 bg-white/16 p-4 text-white backdrop-blur-md">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                      Premium confidence
                    </p>
                    <p className="mt-2 font-playfair text-2xl font-semibold leading-tight">
                      Better visibility, safer conversations, and more serious introductions
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white/92 p-5 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A04C]">
                      Why members upgrade
                    </p>
                    <div className="mt-4 grid gap-3">
                      {[
                        { icon: MessageCircle, title: 'Connect directly with verified members', body: 'Move from browsing to real conversations with people ready to engage.' },
                        { icon: TrendingUp, title: 'Reach more compatible matches', body: 'Use sharper filters and stronger discovery placement to save time.' },
                        { icon: Star, title: 'Get noticed faster', body: 'Priority discovery keeps your profile visible during high-intent browsing windows.' },
                      ].map((item) => (
                        <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-[#FFF9F5] p-4">
                          <div className="mt-0.5 grid size-8 place-items-center rounded-full bg-[#A10E4D]/10 text-[#A10E4D]">
                            <item.icon className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#2F2F2F]">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#6B7280]">{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#D4A04C]/20 bg-white/92 p-5 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-full bg-[#FFF8EC] text-[#D4A04C]">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2F2F2F]">Trusted by serious members across Australia</p>
                        <p className="mt-1 text-xs text-[#6B7280]">Secure billing, privacy-first controls, and verified profile signals.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex -space-x-2">
                      {[
                        '/success-stories/couple-sydney.jpg',
                        '/success-stories/couple-melbourne.jpg',
                        '/success-stories/couple-brisbane.jpg',
                      ].map((src, index) => (
                        <div key={src} className="relative size-11 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          <Image
                            src={src}
                            alt={`Vivah Australia member couple ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                      ))}
                      <div className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-[#FFF0F3] text-xs font-bold text-[#A10E4D] shadow-sm">
                        +50k
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 4: Trust Strip ─────────────────────────────────────────── */}
      <div ref={trustStripRef} className="border-b border-[#A10E4D]/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-4 sm:px-6 lg:px-8">
          {TRUST_INDICATORS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-[#FFF0F3]">
                <Icon className="size-4 text-[#A10E4D]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2F2F2F]">{label}</p>
                <p className="text-[11px] text-[#6B7280]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-14 pb-36 sm:px-6 lg:px-8">

        {/* ── Section 2: Outcome-Based Benefits ─────────────────────────── */}
        <motion.section
          id="membership-benefits"
          variants={stagger}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">Why upgrade</Badge>
            <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
              What changes when you become Premium
            </h2>
            <p className="mt-3 text-base text-[#5E6470] max-w-xl mx-auto">
              You&apos;re not buying features. You&apos;re buying outcomes — faster connections,
              better matches, and more meaningful conversations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {OUTCOME_BENEFITS.map((benefit) => (
              <motion.article
                key={benefit.headline}
                variants={staggerChild}
                className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_12px_40px_rgba(122,31,43,0.06)]"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#FFF0F3,#FFF9F5)] text-[#A10E4D]">
                  {benefit.icon}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#A10E4D]">{benefit.stat}</span>
                  <span className="text-sm font-semibold text-[#6B7280]">{benefit.statLabel}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-[#2F2F2F]">{benefit.headline}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5E6470]">{benefit.body}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* ── Section 3: Success Stories ─────────────────────────────────── */}
        <section id="success-stories">
          <div className="text-center mb-8">
            <Badge variant="gold" className="mb-3">
              <Heart className="size-3" />
              Real success stories
            </Badge>
            <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
              Connecting Hearts. Creating Futures.
            </h2>
            <p className="mt-3 text-base text-[#5E6470] max-w-xl mx-auto">
              Thousands of Australians have found their life partner through Vivah.
              Here are a few of their stories.
            </p>
          </div>
          <SuccessStoryCarousel />
        </section>

        {/* ── Section 5: Plan Comparison + Recommendation ────────────────── */}
        <section
          id="membership-plans"
          className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-8"
        >
          {/* Header */}
          <div className="flex flex-col gap-6 border-b border-[#A10E4D]/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-3">Choose your plan</Badge>
              <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
                Find the right membership for you
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#5E6470]">
                Every plan includes privacy controls and verified-member access.
                Upgrade for faster results, better visibility, and dedicated support.
              </p>
            </div>

            {/* Billing toggle */}
            <div
              className="inline-grid gap-2 rounded-[24px] border border-[#A10E4D]/12 bg-[#FFF9F5] p-2 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Billing duration"
            >
              {BILLING_OPTIONS.map((option) => {
                const isSelected = selectedBilling === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedBilling(option.value);
                      track('membership_billing_toggle', { billing: option.value });
                    }}
                    className={cx(
                      'min-w-[130px] rounded-[20px] px-4 py-3 text-left transition duration-200 focus:outline-none',
                      isSelected
                        ? 'bg-[#A10E4D] text-white shadow-[0_12px_30px_rgba(122,31,43,0.22)]'
                        : 'bg-white text-[#A10E4D] hover:bg-[#FFF7EA]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{option.label}</span>
                      {option.badge ? (
                        <span
                          className={cx(
                            'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                            isSelected ? 'bg-[#D4A04C] text-[#2F2F2F]' : 'bg-[#FFF2CD] text-[#A10E4D]',
                          )}
                        >
                          {option.badge}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {displayPlans.map((plan) => (
              <PlanCard
                key={`${plan.tierKey}-${selectedBilling}`}
                plan={plan}
                isRecommended={plan.tierKey === recommendedTier}
                isSelected={plan.tierKey === effectiveTier && !plan.tierKey.includes('FREE')}
                onSelect={() => openPaidPlan(plan)}
              />
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="mt-6 rounded-[24px] border border-dashed border-[#A10E4D]/20 bg-[#FFF9FB] p-5">
            <button
              type="button"
              onClick={() => setCouponOpen(o => !o)}
              className="flex w-full items-center justify-between text-sm font-bold text-[#A10E4D] hover:text-[#890B40] transition"
            >
              <span className="flex items-center gap-2">
                <Tag className="size-4" />
                Have a coupon code?
              </span>
              <ChevronDown className={cx('size-4 transition-transform', couponOpen ? 'rotate-180' : '')} />
            </button>

            <AnimatePresence>
              {couponOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {couponApplied ? (
                      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Check className="size-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-extrabold text-emerald-800">
                              {couponApplied.discountPercent}% off applied — {couponApplied.code}
                            </p>
                            <p className="text-xs text-emerald-600">{couponApplied.label}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCouponApplied(null); setCouponInput(''); setCouponError(''); }}
                          className="rounded-full p-1 hover:bg-emerald-100 transition"
                          aria-label="Remove coupon"
                        >
                          <X className="size-4 text-emerald-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          placeholder="Enter coupon code..."
                          className="h-11 flex-1 rounded-2xl border border-[#A10E4D]/20 bg-white px-4 font-mono text-sm font-bold uppercase tracking-widest text-neutral-800 outline-none focus:border-[#A10E4D] placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400"
                        />
                        <button
                          type="button"
                          disabled={couponPending || !couponInput.trim()}
                          onClick={async () => {
                            if (!couponInput.trim()) return;
                            setCouponPending(true);
                            setCouponError('');
                            const result = await validateCoupon(couponInput.trim(), effectivePlan?.code);
                            setCouponPending(false);
                            if (result.ok && result.data.discountPercent) {
                              setCouponApplied({
                                code: result.data.code ?? couponInput,
                                label: result.data.label ?? '',
                                discountPercent: result.data.discountPercent,
                              });
                              track('membership_coupon_applied', { code: couponInput });
                            } else {
                              setCouponError(result.data.message ?? 'Invalid coupon code.');
                            }
                          }}
                          className="h-11 rounded-2xl bg-[#A10E4D] hover:bg-[#890B40] px-5 text-sm font-bold text-white disabled:opacity-50 transition"
                        >
                          {couponPending ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <X className="size-3.5" />{couponError}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recommendation helper */}
          <div className="mt-10 rounded-[28px] border border-[#D4A04C]/25 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF9F5_100%)] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-lg">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">Not sure which plan?</p>
                <h3 className="mt-2 text-xl font-bold text-[#2F2F2F]">
                  Answer 4 quick questions — we&apos;ll recommend the right plan for you
                </h3>
                <p className="mt-1.5 text-sm text-[#6B7280]">
                  This stays entirely on your device. We just highlight the best plan based on your goals.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#D4A04C]/30 bg-white px-5 py-4 lg:min-w-[240px]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">Our recommendation</p>
                <p className="mt-2 text-2xl font-bold text-[#A10E4D]">
                  {TIER_CONTENT[recommendedTier].displayName}
                </p>
                <p className="mt-1.5 text-sm leading-5 text-[#6B7280]">
                  {TIER_CONTENT[recommendedTier].recommendationLabel}
                </p>
                <button
                  type="button"
                  onClick={highlightRecommendedPlan}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#A10E4D] hover:text-[#5F1621]"
                >
                  View this plan
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {RECOMMENDATION_QUESTIONS.map((question) => (
                <div key={question.key} className="rounded-2xl bg-white p-5 border border-[#A10E4D]/8">
                  <p className="text-sm font-semibold text-[#2F2F2F]">{question.prompt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((option) => {
                      const isSelected = recommendationAnswers[question.key] === option.value;
                      return (
                        <button
                          key={`${question.key}-${String(option.value)}`}
                          type="button"
                          onClick={() => handleRecommendationAnswer(question.key, option.value)}
                          className={cx(
                            'rounded-full border px-4 py-2 text-sm font-semibold transition duration-200',
                            isSelected
                              ? 'border-[#A10E4D] bg-[#A10E4D] text-white shadow-sm'
                              : 'border-[#A10E4D]/12 bg-[#FFF9F5] text-[#A10E4D] hover:bg-[#FFF7EA]',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 5b: Comparison Table ──────────────────────────────── */}
        <section
          id="membership-comparison"
          className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-8"
        >
          <div className="max-w-2xl mb-8">
            <Badge variant="outline" className="mb-3">Full comparison</Badge>
            <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
              Every plan, every outcome — side by side
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#5E6470]">
              See exactly what you get with each tier. The recommended column is highlighted.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[24px] border border-[#A10E4D]/10 lg:block">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#FFF9F5]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#6B7280]">What you can do</th>
                  {displayPlans.map((plan) => {
                    const isRec = plan.tierKey === recommendedTier;
                    return (
                      <th
                        key={`heading-${plan.tierKey}`}
                        className={cx(
                          'px-4 py-4 text-center text-sm font-bold',
                          isRec ? 'bg-[#FFF0F3] text-[#A10E4D]' : 'text-[#2F2F2F]',
                        )}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-base">{plan.tierName}</span>
                          {isRec ? (
                            <Badge variant="premium">Recommended</Badge>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, rowIndex) => (
                  <tr
                    key={row.key}
                    className={cx(
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#FFFCF8]',
                      'border-t border-[#A10E4D]/6',
                    )}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#2F2F2F]">{row.label}</p>
                      <p className="text-xs text-[#D4A04C] font-medium">{row.outcomeLabel}</p>
                    </td>
                    {displayPlans.map((plan) => {
                      const value = plan.comparison[row.key];
                      const isRec = plan.tierKey === recommendedTier;
                      return (
                        <td
                          key={`${row.key}-${plan.tierKey}`}
                          className={cx(
                            'px-4 py-4 text-center text-sm text-[#5E6470]',
                            isRec && 'bg-[#FFF0F3]/50',
                          )}
                        >
                          {row.type === 'boolean'
                            ? <CheckCell value={Boolean(value)} highlight={isRec} />
                            : <span className="font-medium">{value}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile accordion comparison */}
          <div className="space-y-3 lg:hidden">
            {COMPARISON_ROWS.map((row) => {
              const isOpen = openComparisonRow === row.key;
              return (
                <div key={row.key} className="overflow-hidden rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5]">
                  <button
                    type="button"
                    onClick={() => setOpenComparisonRow(isOpen ? 'monthlyInterests' : row.key)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <span className="text-sm font-semibold text-[#2F2F2F]">{row.label}</span>
                      <span className="block text-xs text-[#D4A04C] font-medium">{row.outcomeLabel}</span>
                    </div>
                    <ChevronDown className={cx('size-4 text-[#A10E4D] transition-transform duration-200', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-[#A10E4D]/10 bg-white px-5 py-4">
                      <div className="space-y-3">
                        {displayPlans.map((plan) => {
                          const value = plan.comparison[row.key];
                          const isRec = plan.tierKey === recommendedTier;
                          return (
                            <div
                              key={`${row.key}-${plan.tierKey}-mobile`}
                              className={cx('flex items-center justify-between rounded-2xl px-4 py-3', isRec ? 'bg-[#FFF0F3]' : 'bg-[#FFF9F5]')}
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#2F2F2F]">{plan.tierName}</p>
                                {isRec && <Badge variant="premium" className="mt-1">Recommended</Badge>}
                              </div>
                              <div className="text-sm font-medium text-[#5E6470]">
                                {row.type === 'boolean' ? <CheckCell value={Boolean(value)} highlight={isRec} /> : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 6: VIP Matchmaking ─────────────────────────────────── */}
        <motion.section {...fadeInUp} id="vip-matchmaking">
          <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#1A0A12_0%,#2F0B20_40%,#4A1535_70%,#D4A04C_100%)] p-8 shadow-[0_32px_80px_rgba(122,31,43,0.30)] sm:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <Badge variant="vip" className="mb-4">
                  <Crown className="size-3" />
                  VIP Matchmaking
                </Badge>
                <h2 className="font-playfair text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  The highest-visibility path to your life partner
                </h2>
                <p className="mt-4 text-lg leading-8 text-white/75">
                  Platinum membership is designed for members who want the highest-touch experience —
                  maximum visibility, curated introductions, and a dedicated team in your corner.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: TrendingUp, title: 'Priority visibility', body: 'Stay front-of-mind across all discovery surfaces' },
                    { icon: Users, title: 'Curated introductions', body: 'We surface the most compatible profiles for you' },
                    { icon: Phone, title: 'Concierge assistance', body: 'A dedicated team helps you present your best profile' },
                    { icon: Sparkles, title: '8 monthly boosts', body: 'Maximum visibility during peak browsing windows' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[#D4A04C]">
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/65">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PremiumButton
                    onClick={() => {
                      const platinumPlan = displayPlans.find((p) => p.tierKey === 'PLATINUM');
                      if (platinumPlan) openPaidPlan(platinumPlan);
                    }}
                    variant="gold"
                    className="h-13 text-base min-w-[200px]"
                  >
                    <Crown className="size-4" />
                    Go Platinum
                  </PremiumButton>
                  <PremiumButton href="#membership-comparison" variant="ghost" className="text-white hover:bg-white/10 h-13 text-base">
                    Compare all plans
                    <ArrowRight className="size-4" />
                  </PremiumButton>
                </div>
              </div>

              {/* Stats side */}
              <div className="grid gap-4">
                {[
                  { value: '200+', label: 'Compatible matches / month', icon: Users },
                  { value: '8×', label: 'Profile boosts every month', icon: TrendingUp },
                  { value: '1st', label: 'In discovery results', icon: Star },
                  { value: 'VIP', label: 'Front-of-queue support', icon: Crown },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 rounded-[20px] bg-white/8 px-5 py-4 backdrop-blur"
                  >
                    <div className="grid size-10 place-items-center rounded-full bg-[#D4A04C]/20 text-[#D4A04C]">
                      <stat.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-sm text-white/65">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeInUp}>
          <div className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <Badge variant="outline" className="mb-3">
                  Secure payments
                </Badge>
                <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
                  Checkout that feels as trustworthy as the platform
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5E6470]">
                  Membership payments stay encrypted through Stripe, your privacy controls remain yours,
                  and our Australian support team is here if you need help before or after upgrade.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method}
                      className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F]"
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: '30-day confidence', body: 'Refund requests are reviewed under our published policy.' },
                  { icon: Lock, title: 'Encrypted checkout', body: 'Card handling stays inside Stripe’s secure environment.' },
                  { icon: Users, title: 'Trusted by members', body: 'Serious members choose Vivah for safer, more respectful introductions.' },
                  { icon: Phone, title: 'Australian support', body: 'A local team can help with billing or membership questions.' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[#D4A04C]/18 bg-[linear-gradient(180deg,#FFFDF9_0%,#FFF8EC_100%)] p-4"
                  >
                    <div className="grid size-10 place-items-center rounded-full bg-white text-[#A10E4D] shadow-sm">
                      <item.icon className="size-4" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#2F2F2F]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6B7280]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Section 8: Conversion Psychology ──────────────────────────── */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Urgency */}
          <motion.div {...fadeInUp} className="rounded-[28px] border border-[#D4A04C]/25 bg-[linear-gradient(135deg,#FFF8EC,#FFFFFF)] p-6">
            <div className="grid size-10 place-items-center rounded-full bg-[#FFF2CD] text-[#D4A04C]">
              <Zap className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#2F2F2F]">Limited-time pricing</h3>
            <p className="mt-2 text-sm leading-6 text-[#5E6470]">
              Quarterly and annual plans offer significant savings compared to monthly billing.
              These rates are available while our launch promotion runs.
            </p>
            <PremiumButton
              onClick={() => setSelectedBilling('ANNUAL')}
              variant="gold"
              className="mt-4 h-9 w-full text-xs"
            >
              See annual savings
            </PremiumButton>
          </motion.div>

          {/* Social proof */}
          <motion.div {...fadeInUp} className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-6">
            <div className="grid size-10 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
              <Users className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#2F2F2F]">Members upgrading now</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { name: 'A member from Melbourne', plan: 'Gold', time: '2 min ago' },
                { name: 'A member from Sydney', plan: 'Premium', time: '8 min ago' },
                { name: 'A member from Brisbane', plan: 'Platinum', time: '14 min ago' },
              ].map((activity) => (
                <div key={activity.time} className="flex items-center gap-2 rounded-xl bg-[#FFF9F5] px-3 py-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-[#2F2F2F]">
                    <strong>{activity.name}</strong> → {activity.plan}
                  </span>
                  <span className="ml-auto text-[10px] text-[#6B7280]">{activity.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trust reinforcement */}
          <motion.div {...fadeInUp} className="rounded-[28px] border border-[#1F6F4A]/15 bg-[linear-gradient(135deg,#F0FBF6,#FFFFFF)] p-6">
            <div className="grid size-10 place-items-center rounded-full bg-[#F0FBF6] text-[#1F6F4A]">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#2F2F2F]">Your trust is protected</h3>
            <div className="mt-3 space-y-2">
              {[
                'Stripe-secure payment processing',
                'Cancel anytime, no questions asked',
                'Your privacy settings are never overridden',
                'Australian team, real human support',
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm text-[#2F2F2F]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  {point}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Section 7: FAQ ─────────────────────────────────────────────── */}
        <section
          id="membership-faq"
          className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-8"
        >
          <div className="max-w-2xl mb-8">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
              Questions before you upgrade
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#5E6470]">
              Everything you need to know about how membership works, billing, privacy, and refunds.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_0.75fr] lg:items-start">
            <FAQAccordion
              items={FAQ_ITEMS.map((item) => ({
                ...item,
              }))}
            />

            <div className="rounded-[28px] border border-[#D4A04C]/25 bg-[linear-gradient(180deg,#FFF8EC,#FFFFFF)] p-6">
              <Crown className="size-7 text-[#D4A04C]" />
              <h3 className="mt-4 text-xl font-bold text-[#2F2F2F]">Still have questions?</h3>
              <p className="mt-2 text-sm leading-6 text-[#5E6470]">
                Our Australian support team is here to help you choose the right plan
                and answer any questions before you commit.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <PremiumButton href="/help" variant="gold" className="w-full">
                  Visit Help Centre
                </PremiumButton>
                <PremiumButton href="/contact" variant="secondary" className="w-full">
                  Contact our team
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <motion.section {...fadeInUp} className="text-center">
          <div className="rounded-[32px] border border-[#A10E4D]/10 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFF9F5_50%,#FFF8EC_100%)] px-8 py-12 shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
            <Badge variant="gold" className="mb-4">
              <Heart className="size-3" />
              Connecting Hearts. Creating Futures.
            </Badge>
            <h2 className="font-playfair text-3xl font-bold text-[#A10E4D] sm:text-4xl">
              Your life partner is on Vivah
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5E6470] max-w-xl mx-auto">
              Thousands of serious, verified members are searching right now.
              Upgrade today and connect directly with the ones who are right for you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <PremiumButton href="#membership-plans" variant="gold" className="h-13 min-w-[220px] text-base">
                Upgrade Membership
                <ArrowRight className="size-4" />
              </PremiumButton>
              <PremiumButton href="/register" variant="secondary" className="h-13 min-w-[180px] text-base">
                Start free today
              </PremiumButton>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-[#6B7280]">
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" /> No credit card for free tier</span>
              <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-[#D4A04C]" /> Stripe-secure checkout</span>
              <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-[#A10E4D]" /> Cancel anytime</span>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Upgrade modal */}
      <UpgradeModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        {...(selectedPlan?.periodLabel ? { displayIntervalLabel: selectedPlan.periodLabel } : {})}
      />

      {/* ── Section 9: Mobile Sticky CTA ───────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#A10E4D]/10 bg-white/97 shadow-[0_-16px_40px_rgba(122,31,43,0.14)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              {effectivePlan ? `${effectivePlan.tierName} plan` : 'Upgrade Membership'}
            </p>
            <p className="truncate text-sm font-semibold text-[#2F2F2F]">
              {effectivePlan
                ? effectivePlan.isAvailableForBilling
                  ? `${formatMoney(effectivePlan.priceCents, effectivePlan.currency)} / ${effectivePlan.periodLabel}`
                  : `${effectivePlan.billingLabel} coming soon`
                : 'Start meaningful conversations faster'}
            </p>
          </div>

          <PremiumButton
            onClick={() => {
              if (effectivePlan?.isAvailableForBilling) {
                openPaidPlan(effectivePlan);
              } else {
                document.getElementById('membership-plans')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            variant="gold"
            className="h-12 min-w-[140px] shrink-0"
          >
            {effectivePlan?.isAvailableForBilling ? 'Upgrade now' : 'View plans'}
          </PremiumButton>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
