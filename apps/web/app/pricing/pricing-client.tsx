'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { FAQAccordion, PremiumButton, PublicFooter, PublicHeader } from '@/app/components';
import UpgradeModal from '../member/upgrade-modal';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

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
  type: 'boolean' | 'text';
}

type ComparisonValue = string | boolean;

interface TierContent {
  tierKey: TierKey;
  displayName: string;
  positioning: string;
  benefits: string[];
  ctaLabel: string;
  microcopy: string;
  comparison: Record<ComparisonRowKey, ComparisonValue>;
  recommendationLabel: string;
}

interface DisplayPlan extends Plan {
  tierKey: TierKey;
  tierName: string;
  billingOption: BillingOption | 'FREE';
  billingLabel: string;
  periodLabel: string;
  positioning: string;
  benefits: string[];
  ctaLabel: string;
  microcopy: string;
  comparison: Record<ComparisonRowKey, ComparisonValue>;
  recommendationLabel: string;
  isAvailableForBilling: boolean;
  availabilityNote?: string;
  savingsLabel?: string;
}

const BILLING_OPTIONS: BillingOptionMeta[] = [
  { value: 'MONTHLY', label: 'Monthly', months: 1 },
  { value: 'QUARTERLY', label: 'Quarterly', months: 3, badge: 'Save on 3 months' },
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
    positioning: 'Start browsing',
    benefits: [
      'Create a polished profile and begin exploring introductions at your own pace',
      'Receive interests and decide who feels aligned before upgrading',
      'Use photo privacy controls to manage first impressions carefully',
      'Get familiar with the platform before committing to premium visibility',
    ],
    ctaLabel: 'Create free profile',
    microcopy: 'A calm way to start before you invest in direct contact tools.',
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
    recommendationLabel: 'A light starting point if you are only exploring for now.',
  },
  PREMIUM: {
    tierKey: 'PREMIUM',
    displayName: 'Premium',
    positioning: 'Best for serious members',
    benefits: [
      'Contact up to 50 compatible matches monthly once you are ready to engage',
      'Filter by community, lifestyle, education, career and location',
      'Message accepted matches without leaving the platform too early',
      'Build momentum with stronger discovery tools for intentional searching',
      'Stay in control with photo privacy and trusted profile features',
    ],
    ctaLabel: 'Unlock Premium',
    microcopy: 'Best when you want direct progress without jumping to high-visibility extras.',
    comparison: {
      monthlyInterests: '50 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: false,
      profileBoost: '1 boost / month',
      photoPrivacyControls: true,
      verificationSupport: 'Standard review support',
      dedicatedProfileReview: false,
      supportPriority: 'Member care support',
    },
    recommendationLabel: 'A strong fit for focused members who want contact access and better filtering.',
  },
  GOLD: {
    tierKey: 'GOLD',
    displayName: 'Gold',
    positioning: 'Best for faster responses',
    benefits: [
      'Contact up to 120 compatible matches monthly during active search periods',
      'Appear higher in discovery during peak browsing windows',
      'Use broader filters to surface aligned members faster across Australia',
      'Get more profile boost support when you want better response momentum',
      'Receive faster trust and verification guidance for a stronger profile presence',
    ],
    ctaLabel: 'Choose Gold',
    microcopy: 'Ideal if response speed and stronger discovery matter more than a basic upgrade.',
    comparison: {
      monthlyInterests: '120 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: true,
      profileBoost: '4 boosts / month',
      photoPrivacyControls: true,
      verificationSupport: 'Priority verification support',
      dedicatedProfileReview: false,
      supportPriority: 'Priority member care',
    },
    recommendationLabel: 'Great for active members who want visibility and quicker conversation momentum.',
  },
  PLATINUM: {
    tierKey: 'PLATINUM',
    displayName: 'Platinum',
    positioning: 'Maximum visibility + support',
    benefits: [
      'Stay front-of-mind with the strongest discovery presence available on the platform',
      'Reach more compatible members while maintaining privacy-first contact controls',
      'Use premium boost access to stay visible during the most valuable search windows',
      'Receive dedicated review support for a polished, trusted profile',
      'Get the fastest member-care attention when you need help progressing confidently',
    ],
    ctaLabel: 'Go Platinum',
    microcopy: 'Built for members who want the highest visibility with hands-on premium support.',
    comparison: {
      monthlyInterests: '200 interests / month',
      acceptedMatchMessaging: true,
      advancedFilters: true,
      priorityDiscovery: true,
      profileBoost: '8 boosts / month',
      photoPrivacyControls: true,
      verificationSupport: 'Fast-track verification support',
      dedicatedProfileReview: true,
      supportPriority: 'Front-of-queue support',
    },
    recommendationLabel: 'Best when visibility, support, and profile polish all matter at once.',
  },
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { key: 'monthlyInterests', label: 'Monthly interests', type: 'text' },
  { key: 'acceptedMatchMessaging', label: 'Accepted-match messaging', type: 'boolean' },
  { key: 'advancedFilters', label: 'Advanced filters', type: 'boolean' },
  { key: 'priorityDiscovery', label: 'Priority discovery', type: 'boolean' },
  { key: 'profileBoost', label: 'Profile boost', type: 'text' },
  { key: 'photoPrivacyControls', label: 'Photo privacy controls', type: 'boolean' },
  { key: 'verificationSupport', label: 'Verification support', type: 'text' },
  { key: 'dedicatedProfileReview', label: 'Dedicated profile review', type: 'boolean' },
  { key: 'supportPriority', label: 'Support priority', type: 'text' },
];

const FAQ_ITEMS = [
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. You can manage your subscription and stop future renewals from your billing settings. Access stays active for the period you have already paid for.',
  },
  {
    question: 'What happens after I upgrade?',
    answer:
      'Once payment is confirmed, your membership tools unlock immediately for the selected plan, including messaging access, filtering, and visibility upgrades tied to that tier.',
  },
  {
    question: 'Are payments secure?',
    answer:
      'Yes. Checkout runs through Stripe-secure payment processing, so sensitive card handling stays within Stripe rather than being stored directly by the app.',
  },
  {
    question: 'Can I request a refund?',
    answer:
      'Refund requests are reviewed under the Vivah Australia refund policy. If you need help, member care can guide you to the right policy and next steps.',
  },
  {
    question: 'Do paid plans guarantee a match?',
    answer:
      'No. Paid plans improve contact access, visibility, filtering, and support, but meaningful outcomes still depend on compatibility, timing, and mutual interest.',
  },
  {
    question: 'Who can see my private photos?',
    answer:
      'Your photo visibility follows your profile privacy settings and any sharing choices you make. Paid plans do not override your privacy controls.',
  },
  {
    question: 'How does profile boost work?',
    answer:
      'Profile boosts are designed to increase discovery visibility during active browsing windows. They can improve exposure, but they do not promise replies or a match.',
  },
] as const;

const SOCIAL_PROOF = [
  {
    quote: 'Upgrading helped us focus on serious conversations instead of repeating the same introductions.',
    attribution: 'Member family, Melbourne',
  },
  {
    quote: 'Priority visibility made it easier to connect with compatible families who were ready to respond.',
    attribution: 'Verified member, Sydney',
  },
  {
    quote: 'The filters gave me a calmer shortlist and saved time on conversations that were never going to align.',
    attribution: 'Professional member, Brisbane',
  },
] as const;

const RECOMMENDATION_QUESTIONS = [
  {
    key: 'searchPace',
    prompt: 'Are you casually browsing or actively searching?',
    options: [
      { label: 'Casually browsing', value: 'CASUAL' as const },
      { label: 'Actively searching', value: 'ACTIVE' as const },
    ],
  },
  {
    key: 'wantsVisibility',
    prompt: 'Do you want more visibility?',
    options: [
      { label: 'Yes, more visibility', value: true },
      { label: 'No, not a priority', value: false },
    ],
  },
  {
    key: 'wantsPrioritySupport',
    prompt: 'Do you want priority support?',
    options: [
      { label: 'Yes, I want priority support', value: true },
      { label: 'No, standard support is fine', value: false },
    ],
  },
  {
    key: 'needsAdvancedFilters',
    prompt: 'Do you need advanced filters?',
    options: [
      { label: 'Yes, filters matter', value: true },
      { label: 'No, basic browsing is enough', value: false },
    ],
  },
] as const;

const DEFAULT_RECOMMENDATION_ANSWERS: RecommendationAnswers = {
  searchPace: 'ACTIVE',
  wantsVisibility: true,
  wantsPrioritySupport: false,
  needsAdvancedFilters: true,
};

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
  if (plan.code === 'FREE') {
    return 'FREE';
  }

  if (plan.code.includes('_QUARTERLY')) {
    return 'QUARTERLY';
  }

  if (plan.code.includes('_ANNUAL') || plan.interval === 'YEAR') {
    return 'ANNUAL';
  }

  return 'MONTHLY';
}

function getTierKey(plan: Plan): TierKey {
  if (plan.code === 'FREE') {
    return 'FREE';
  }

  const candidate = plan.code.split('_')[0];
  if (candidate === 'PREMIUM' || candidate === 'GOLD' || candidate === 'PLATINUM') {
    return candidate;
  }

  return 'PREMIUM';
}

function getPeriodLabel(option: BillingOption) {
  switch (option) {
    case 'MONTHLY':
      return 'month';
    case 'QUARTERLY':
      return 'quarter';
    case 'ANNUAL':
      return 'year';
  }
}

function computeSavingsLabel(
  plansByBilling: Partial<Record<BillingOption, Plan>>,
  option: BillingOption,
) {
  if (option === 'MONTHLY') {
    return undefined;
  }

  const monthlyPlan = plansByBilling.MONTHLY;
  const targetPlan = plansByBilling[option];
  if (!monthlyPlan || !targetPlan) {
    return option === 'ANNUAL' ? 'Best value' : undefined;
  }

  const months = BILLING_OPTION_MAP[option].months;
  const baseline = monthlyPlan.priceCents * months;
  const savings = baseline - targetPlan.priceCents;
  if (savings <= 0) {
    return option === 'ANNUAL' ? 'Best value' : undefined;
  }

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

function renderBooleanCell(value: boolean, highlight = false) {
  return value ? (
    <Check className={cx('mx-auto size-4', highlight ? 'text-[#A10E4D]' : 'text-emerald-600')} />
  ) : (
    <X className="mx-auto size-4 text-[#B8B0A6]" />
  );
}

export default function PricingClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingOption>('MONTHLY');
  const [manualSelectedTier, setManualSelectedTier] = useState<Exclude<TierKey, 'FREE'> | null>(
    null,
  );
  const [recommendationAnswers, setRecommendationAnswers] = useState<RecommendationAnswers>(
    DEFAULT_RECOMMENDATION_ANSWERS,
  );
  const [openComparisonRow, setOpenComparisonRow] = useState<ComparisonRowKey>('monthlyInterests');

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
      if (billingOption === 'FREE') {
        continue;
      }

      const current = plansByTier.get(tierKey) ?? {};
      current[billingOption] = plan;
      plansByTier.set(tierKey, current);
    }

    return TIER_ORDER.flatMap((tierKey) => {
      const content = TIER_CONTENT[tierKey];

      if (tierKey === 'FREE') {
        if (!freePlan) {
          return [];
        }

        const plan: DisplayPlan = {
          ...freePlan,
          tierKey,
          tierName: content.displayName,
          billingOption: 'FREE',
          billingLabel: 'Free',
          periodLabel: 'month',
          positioning: content.positioning,
          benefits: content.benefits,
          ctaLabel: content.ctaLabel,
          microcopy: content.microcopy,
          comparison: content.comparison,
          recommendationLabel: content.recommendationLabel,
          isAvailableForBilling: true,
        };

        return [plan];
      }

      const billingPlans = plansByTier.get(tierKey) ?? {};
      const selectedBillingPlan = billingPlans[selectedBilling];
      const fallbackPlan = billingPlans.MONTHLY ?? Object.values(billingPlans)[0];
      if (!fallbackPlan) {
        return [];
      }

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
          benefits: content.benefits,
          ctaLabel: content.ctaLabel,
          microcopy: content.microcopy,
          comparison: content.comparison,
          recommendationLabel: content.recommendationLabel,
          isAvailableForBilling: false,
          availabilityNote: `${BILLING_OPTION_MAP[selectedBilling].label} billing for ${content.displayName} is coming soon.`,
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
        benefits: content.benefits,
        ctaLabel: content.ctaLabel,
        microcopy: content.microcopy,
        comparison: content.comparison,
        recommendationLabel: content.recommendationLabel,
        isAvailableForBilling: true,
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
  }

  function highlightRecommendedPlan() {
    setManualSelectedTier(null);
    document.getElementById(`membership-plan-${recommendedTier}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function openPaidPlan(plan: DisplayPlan) {
    if (plan.tierKey === 'FREE' || !plan.isAvailableForBilling) {
      return;
    }

    setManualSelectedTier(plan.tierKey);
    setSelectedPlan(plan);
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F]">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-[#A10E4D]/10 bg-[#FFF9F5]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(122,31,43,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(252,250,247,0.96))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#D4A04C]/40 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#A10E4D] shadow-sm">
              <Sparkles className="size-3.5 text-[#D4A04C]" />
              Premium Matchmaking Access
            </p>
            <h1 className="mt-6 text-4xl font-serif font-bold leading-tight text-[#A10E4D] sm:text-5xl lg:text-6xl">
              Upgrade your search with verified contact access and priority visibility
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#5E6470] sm:text-lg">
              Built for serious Indian and South Asian matchmaking in Australia, Vivah membership
              unlocks deeper discovery, higher trust signals, and faster pathways to genuine
              introductions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="#membership-plans" variant="gold" className="min-w-[170px]">
                View plans
              </PremiumButton>
              <PremiumButton
                href="#membership-comparison"
                variant="secondary"
                className="min-w-[170px]"
              >
                Compare benefits
              </PremiumButton>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { label: 'Secure checkout', icon: Lock },
                { label: 'Cancel anytime', icon: Check },
                { label: 'Verified community', icon: ShieldCheck },
                { label: 'Privacy-first', icon: Sparkles },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#A10E4D]/10 bg-white/90 px-4 py-2 text-sm font-semibold text-[#A10E4D] shadow-sm"
                >
                  <Icon className="size-4 text-[#D4A04C]" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] border border-[#D4A04C]/30 bg-white/90 p-6 shadow-[0_24px_60px_rgba(122,31,43,0.12)] backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A04C]">
                Why members upgrade
              </p>
              <div className="mt-5 grid gap-4">
                {[
                  {
                    title: 'Verified contact pathways',
                    body: 'Move beyond passive browsing with stronger tools for serious introductions.',
                  },
                  {
                    title: 'Priority visibility in search',
                    body: 'Stand out earlier when compatible members are actively exploring matches.',
                  },
                  {
                    title: 'Designed for Australia-based matchmaking',
                    body: 'Support serious cross-city, community-aware, privacy-conscious connections.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-[#A10E4D] p-1.5 text-white">
                        <Check className="size-3.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#2F2F2F]">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-[#6B7280]">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 pb-32 sm:px-6 lg:px-8">
        <section
          id="membership-benefits"
          className="grid gap-4 rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] md:grid-cols-3"
        >
          {[
            {
              title: 'Deeper discovery',
              body: 'Upgrade into richer search and visibility tools built for intentional matchmaking.',
            },
            {
              title: 'Stronger trust signals',
              body: 'Navigate a privacy-first, verified community with more confidence at every step.',
            },
            {
              title: 'Faster connection momentum',
              body: 'Use premium access to reduce friction once mutual interest starts to build.',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl bg-[#FFF9F5] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Benefit
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[#A10E4D]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#5E6470]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Help me choose
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
                Get a recommendation based on how you want to search
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#5E6470]">
                This quick guide stays entirely client-side. It simply helps us highlight the plan
                that best matches your current intent.
              </p>
            </div>

            <div className="rounded-3xl border border-[#D4A04C]/30 bg-[#FFF9EC] px-5 py-4 text-sm text-[#A10E4D] shadow-sm lg:max-w-sm">
              <p className="font-bold uppercase tracking-[0.16em] text-[#D4A04C]">Recommended now</p>
              <p className="mt-2 text-xl font-semibold text-[#A10E4D]">
                {TIER_CONTENT[recommendedTier].displayName}
              </p>
              <p className="mt-2 leading-6 text-[#6B7280]">
                {TIER_CONTENT[recommendedTier].recommendationLabel}
              </p>
              <button
                type="button"
                onClick={highlightRecommendedPlan}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#A10E4D] hover:text-[#5F1621]"
              >
                Highlight this plan
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {RECOMMENDATION_QUESTIONS.map((question) => (
              <div key={question.key} className="rounded-3xl bg-[#FFF9F5] p-5">
                <p className="text-sm font-semibold text-[#2F2F2F]">{question.prompt}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {question.options.map((option) => {
                    const currentValue = recommendationAnswers[question.key];
                    const isSelected = currentValue === option.value;
                    return (
                      <button
                        key={`${question.key}-${String(option.value)}`}
                        type="button"
                        onClick={() =>
                          handleRecommendationAnswer(
                            question.key,
                            option.value,
                          )
                        }
                        className={cx(
                          'rounded-full border px-4 py-2 text-sm font-semibold transition duration-200',
                          isSelected
                            ? 'border-[#A10E4D] bg-[#A10E4D] text-white shadow-sm'
                            : 'border-[#A10E4D]/10 bg-white text-[#A10E4D] hover:bg-[#FFF7EA]',
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
        </section>

        <section
          id="membership-plans"
          className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]"
        >
          <div className="flex flex-col gap-5 border-b border-[#A10E4D]/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Billing duration
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
                Choose the membership cadence that fits your search
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#5E6470]">
                Switch between monthly, quarterly, and annual billing without duplicating the
                pricing layout. Real plan codes still power checkout.
              </p>
            </div>

            <div
              className="inline-grid gap-3 rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-2 md:grid-cols-3"
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
                    onClick={() => setSelectedBilling(option.value)}
                    className={cx(
                      'min-w-[150px] rounded-3xl px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#A10E4D]/30',
                      isSelected
                        ? 'bg-[#A10E4D] text-white shadow-[0_16px_40px_rgba(122,31,43,0.22)]'
                        : 'bg-white text-[#A10E4D] hover:bg-[#FFF7EA]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold">{option.label}</span>
                      {option.badge ? (
                        <span
                          className={cx(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                            isSelected
                              ? 'bg-[#D4A04C] text-[#2F2F2F]'
                              : 'bg-[#FFF2CD] text-[#A10E4D]',
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

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {displayPlans.map((plan) => {
              const isFree = plan.tierKey === 'FREE';
              const isRecommended = plan.tierKey === recommendedTier;
              const isSelected = !isFree && plan.tierKey === effectiveTier;
              const isUnavailable = !isFree && !plan.isAvailableForBilling;
              const displayPrice = isUnavailable ? 'Coming soon' : formatMoney(plan.priceCents, plan.currency);

              return (
                <article
                  key={`${plan.tierKey}-${selectedBilling}`}
                  id={`membership-plan-${plan.tierKey}`}
                  className={cx(
                    'relative flex min-h-[560px] flex-col justify-between rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] transition duration-300 hover:-translate-y-1',
                    isRecommended || isSelected
                      ? 'border-[#D4A04C] bg-[linear-gradient(180deg,#fffdf7_0%,#fff8ec_100%)] shadow-[0_22px_60px_rgba(212,175,55,0.16)]'
                      : 'border-[#A10E4D]/10 bg-white',
                    isUnavailable && 'bg-[#FFFCF5]',
                  )}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FFF0F3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A10E4D]">
                        {plan.billingLabel}
                      </span>
                      {plan.savingsLabel && !isFree ? (
                        <span className="rounded-full bg-[#FFF2CD] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A10E4D]">
                          {plan.savingsLabel}
                        </span>
                      ) : null}
                      {isRecommended ? (
                        <span className="rounded-full bg-[#A10E4D] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                          Recommended
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-[#2F2F2F]">{plan.tierName}</h2>
                        <p className="mt-2 text-sm font-semibold text-[#A10E4D]">
                          {plan.positioning}
                        </p>
                      </div>
                      {!isFree ? (
                        <div className="rounded-full bg-[#FFF2CD] p-2.5 text-[#D4A04C]">
                          <Crown className="size-5" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-[#F3EEE7] p-2.5 text-[#A10E4D]">
                          <Sparkles className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-[#2F2F2F] sm:text-5xl">
                        {displayPrice}
                      </span>
                      {!isUnavailable ? (
                        <span className="text-xs font-semibold uppercase text-[#6B7280]">
                          / {plan.periodLabel}
                        </span>
                      ) : null}
                    </div>

                    {isUnavailable && plan.availabilityNote ? (
                      <p className="mt-4 rounded-2xl border border-[#D4A04C]/30 bg-[#FFF7EA] px-4 py-3 text-xs font-semibold leading-5 text-[#A10E4D]">
                        {plan.availabilityNote}
                      </p>
                    ) : null}

                    <ul className="mt-6 space-y-3">
                      {plan.benefits.map((benefit) => (
                        <li
                          key={`${plan.tierKey}-${benefit}`}
                          className="flex gap-3 text-sm font-medium leading-6 text-[#3D352D]"
                        >
                          <Check className="mt-1 size-4 flex-none text-emerald-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    {isFree ? (
                      <PremiumButton href="/register" variant="secondary" className="h-12 w-full">
                        {plan.ctaLabel}
                      </PremiumButton>
                    ) : (
                      <PremiumButton
                        onClick={() => openPaidPlan(plan)}
                        variant={plan.tierKey === 'GOLD' || plan.tierKey === 'PLATINUM' ? 'gold' : 'primary'}
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
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="membership-comparison"
          className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Compare benefits
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
              See how each plan supports a more intentional search
            </h2>
          </div>

          <div className="mt-8 hidden overflow-hidden rounded-[28px] border border-[#A10E4D]/10 lg:block">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#FFF9F5]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#A10E4D]">Feature</th>
                  {displayPlans.map((plan) => {
                    const isRecommended = plan.tierKey === recommendedTier;
                    return (
                      <th
                        key={`heading-${plan.tierKey}`}
                        className={cx(
                          'px-4 py-4 text-center text-sm font-bold',
                          isRecommended ? 'bg-[#FFF7EA] text-[#A10E4D]' : 'text-[#2F2F2F]',
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{plan.tierName}</span>
                          {isRecommended ? (
                            <span className="rounded-full bg-[#A10E4D] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
                              Recommended
                            </span>
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
                      'border-t border-[#A10E4D]/8',
                    )}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-[#2F2F2F]">{row.label}</td>
                    {displayPlans.map((plan) => {
                      const value = plan.comparison[row.key];
                      const isRecommended = plan.tierKey === recommendedTier;
                      return (
                        <td
                          key={`${row.key}-${plan.tierKey}`}
                          className={cx(
                            'px-4 py-4 text-center text-sm text-[#5E6470]',
                            isRecommended && 'bg-[#FFF7EA]',
                          )}
                        >
                          {row.type === 'boolean'
                            ? renderBooleanCell(Boolean(value), isRecommended)
                            : value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 space-y-3 lg:hidden">
            {COMPARISON_ROWS.map((row) => {
              const isOpen = openComparisonRow === row.key;
              return (
                <div
                  key={row.key}
                  className="overflow-hidden rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenComparisonRow(isOpen ? 'monthlyInterests' : row.key)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-[#2F2F2F]">{row.label}</span>
                    <ChevronDown
                      className={cx(
                        'size-4 text-[#A10E4D] transition-transform duration-200',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-[#A10E4D]/10 bg-white px-5 py-4">
                      <div className="space-y-3">
                        {displayPlans.map((plan) => {
                          const value = plan.comparison[row.key];
                          const isRecommended = plan.tierKey === recommendedTier;
                          return (
                            <div
                              key={`${row.key}-${plan.tierKey}-mobile`}
                              className={cx(
                                'flex items-center justify-between rounded-2xl px-4 py-3',
                                isRecommended ? 'bg-[#FFF7EA]' : 'bg-[#FFF9F5]',
                              )}
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#2F2F2F]">
                                  {plan.tierName}
                                </p>
                                {isRecommended ? (
                                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A10E4D]">
                                    Recommended
                                  </p>
                                ) : null}
                              </div>
                              <div className="text-sm font-medium text-[#5E6470]">
                                {row.type === 'boolean'
                                  ? renderBooleanCell(Boolean(value), isRecommended)
                                  : value}
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

        <section className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Trust and safety
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
                Premium access with clear billing and privacy-first controls
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Stripe-secure checkout',
                  'Cancel anytime',
                  'Privacy-first contact controls',
                  'Verified profile ecosystem',
                  'Australian community focus',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F]"
                  >
                    <ShieldCheck className="size-4 text-[#D4A04C]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#D4A04C]/25 bg-[#FFF8EC] p-6">
              <p className="text-sm leading-7 text-[#5E6470]">
                Need clarity before you pay? Review how billing, support, and refunds work before
                checkout so your upgrade feels fully informed.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <PremiumButton href="/help" variant="secondary">
                  Visit Help Centre
                </PremiumButton>
                <PremiumButton href="/refund-policy" variant="gold">
                  Review refund policy
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Social proof
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
              Members upgrade when they want more clarity and steadier momentum
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SOCIAL_PROOF.map((item) => (
                <article
                  key={item.attribution}
                  className="rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-5"
                >
                  <Star className="size-5 text-[#D4A04C]" />
                  <p className="mt-4 text-sm leading-7 text-[#5E6470]">&quot;{item.quote}&quot;</p>
                  <p className="mt-4 text-sm font-bold text-[#A10E4D]">{item.attribution}</p>
                </article>
              ))}
            </div>

            <article className="rounded-[30px] border border-[#D4A04C]/25 bg-[linear-gradient(180deg,#fffdf7_0%,#fff4dc_100%)] p-6 shadow-[0_18px_40px_rgba(212,175,55,0.12)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                A calmer premium path
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[#A10E4D]">
                Built for quality conversations rather than endless volume
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#5E6470]">
                Members usually upgrade when they want better control over who they contact, how
                visible they are, and how quickly they can move from browsing to meaningful
                introductions.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Direct contact tools for more intentional next steps',
                  'Higher discovery placement when timing matters',
                  'Support that feels guided rather than rushed',
                ].map((point) => (
                  <div key={point} className="flex gap-3 text-sm font-medium text-[#3D352D]">
                    <Check className="mt-1 size-4 flex-none text-emerald-600" />
                    {point}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A04C]">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#A10E4D] sm:text-3xl">
              Common questions before you upgrade
            </h2>
          </div>
          <div className="mt-8">
            <FAQAccordion items={[...FAQ_ITEMS]} />
          </div>
        </section>
      </main>

      <UpgradeModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        {...(selectedPlan?.periodLabel ? { displayIntervalLabel: selectedPlan.periodLabel } : {})}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#A10E4D]/10 bg-white/95 px-4 py-3 shadow-[0_-16px_40px_rgba(122,31,43,0.14)] backdrop-blur md:hidden">
        <div
          className="mx-auto flex max-w-7xl items-center gap-3 rounded-[24px] border border-[#D4A04C]/30 bg-[#FFF8EC] p-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              Selected plan
            </p>
            <p className="truncate text-sm font-semibold text-[#A10E4D]">
              {effectivePlan?.tierName ?? TIER_CONTENT[recommendedTier].displayName}
            </p>
            <p className="text-xs text-[#6B7280]">
              {effectivePlan
                ? effectivePlan.isAvailableForBilling
                  ? `${formatMoney(effectivePlan.priceCents, effectivePlan.currency)} / ${effectivePlan.periodLabel}`
                  : `${effectivePlan.billingLabel} coming soon`
                : 'Select a plan to continue'}
            </p>
          </div>

          <PremiumButton
            onClick={() => {
              if (effectivePlan && effectivePlan.isAvailableForBilling) {
                openPaidPlan(effectivePlan);
              }
            }}
            variant="gold"
            className="h-12 min-w-[132px]"
            disabled={!effectivePlan || !effectivePlan.isAvailableForBilling}
          >
            Continue
          </PremiumButton>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
