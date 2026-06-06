'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  ImageIcon,
  ImageOff,
  Lock,
  MapPin,
  MessageSquareText,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Video,
  X,
  Users,
  BookOpen,
  Briefcase,
  Copy,
  Check,
  Quote,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  LoadingState,
  MatchScoreBadge,
  PremiumButton,
  PremiumCard,
  PublicFooter,
  PublicHeader,
  SectionHeader,
  VerificationBadge,
} from '@/app/components';
import { useAuth } from '@/app/auth-context';
import ProfileActions from '../../member/profile-actions';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface PublicPhoto {
  id: string;
  assetUrl: string;
  isPrimary: boolean;
  category?: string;
}

interface PublicProfileResponse {
  profile?: ProfileDetail;
  matchScore?: number;
  matchReasons?: string[];
  isPaidMember?: boolean;
  isPremiumProfile?: boolean;
}

interface ProfileDetail {
  _id?: string;
  displayId: string;
  completionPercentage: number;
  photoUrl?: string;
  videoUrl?: string;
  publicGallery?: PublicPhoto[];
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

interface ViewerProfile {
  personal?: {
    firstName?: string;
    age?: number;
    gender?: string;
    maritalStatus?: string;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  religion?: {
    religion?: string;
    community?: string;
    motherTongue?: string;
  };
  education?: {
    highestQualification?: string;
  };
  employment?: {
    occupation?: string;
    industry?: string;
  };
  family?: {
    familyValues?: string;
    familyType?: string;
  };
  lifestyle?: {
    diet?: string;
    smoking?: string;
    drinking?: string;
    livingArrangement?: string;
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
  | {
      status: 'ready';
      profile: ProfileDetail;
      matchScore?: number | undefined;
      matchReasons?: string[] | undefined;
      isPremiumProfile?: boolean | undefined;
    };

type CompatibilityRow = {
  label: string;
  score: number;
  summary: string;
  accent: 'burgundy' | 'gold' | 'emerald';
  icon: ReactNode;
};

type InsightCard = {
  title: string;
  body: string;
};

type TimelineItem = {
  label: string;
  body: string;
  tone: 'trust' | 'activity' | 'gallery';
};

type MobileTabKey = 'overview' | 'photos' | 'compatibility' | 'about' | 'family' | 'lifestyle';

const MOBILE_SECTION_TABS: Array<{ key: MobileTabKey; label: string; sectionId: string }> = [
  { key: 'overview', label: 'Overview', sectionId: 'profile-overview' },
  { key: 'photos', label: 'Photos', sectionId: 'profile-photos' },
  { key: 'compatibility', label: 'Match', sectionId: 'profile-compatibility' },
  { key: 'about', label: 'About', sectionId: 'profile-about' },
  { key: 'family', label: 'Family', sectionId: 'profile-family' },
  { key: 'lifestyle', label: 'Life', sectionId: 'profile-lifestyle' },
];

const PROFILE_SECTION_TABS: Array<{ key: MobileTabKey; label: string; sectionId: string }> = [
  { key: 'overview', label: 'Overview', sectionId: 'profile-overview' },
  { key: 'compatibility', label: 'Compatibility', sectionId: 'profile-compatibility' },
  { key: 'photos', label: 'Photos & gallery', sectionId: 'profile-photos' },
  { key: 'about', label: 'About', sectionId: 'profile-about' },
  { key: 'family', label: 'Family', sectionId: 'profile-family' },
  { key: 'lifestyle', label: 'Lifestyle', sectionId: 'profile-lifestyle' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45, ease: 'easeOut' },
} as const;

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07 } },
};

const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalize(value?: string) {
  return value?.trim().toLowerCase();
}

function formatEnum(value?: string) {
  return value ? value.replaceAll('_', ' ') : undefined;
}

function joinList(value?: string[]) {
  return value?.length ? value.join(', ') : undefined;
}

function formatDate(value?: string) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRelativeDate(value?: string) {
  if (!value) {
    return 'Recently active';
  }

  const time = new Date(value).getTime();
  const diff = Date.now() - time;
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value) ?? 'Recently active';
}

function matchValue(
  left?: string | number | null,
  right?: string | number | null,
  options?: { exact?: number; mismatch?: number; fallback?: number },
) {
  const exact = options?.exact ?? 92;
  const mismatch = options?.mismatch ?? 48;
  const fallback = options?.fallback ?? 62;

  if (left === undefined || left === null || right === undefined || right === null) {
    return fallback;
  }

  return normalize(String(left)) === normalize(String(right)) ? exact : mismatch;
}

function matchArray(
  viewerValues?: string[],
  targetValue?: string,
  options?: { match?: number; fallback?: number; miss?: number },
) {
  const match = options?.match ?? 90;
  const fallback = options?.fallback ?? 60;
  const miss = options?.miss ?? 50;

  if (!viewerValues?.length || !targetValue) {
    return fallback;
  }

  return viewerValues.some((item) => normalize(item) === normalize(targetValue)) ? match : miss;
}

function averageScore(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildCompatibilityRows(
  viewerProfile: ViewerProfile | null,
  profile: ProfileDetail,
  matchScore?: number,
): CompatibilityRow[] {
  const fallbackBase = typeof matchScore === 'number' ? Math.max(55, Math.min(94, matchScore)) : 72;

  if (!viewerProfile) {
    return [
      {
        label: 'Lifestyle',
        score: Math.max(58, fallbackBase - 4),
        summary: 'Compatibility estimate improves once we can compare daily preferences.',
        accent: 'emerald',
        icon: <Sun className="size-4" />,
      },
      {
        label: 'Family values',
        score: fallbackBase,
        summary: 'Shared seriousness and family orientation are inferred from visible profile details.',
        accent: 'burgundy',
        icon: <Home className="size-4" />,
      },
      {
        label: 'Education',
        score: Math.min(96, fallbackBase + 2),
        summary: 'Education fit is estimated from visible academic and professional signals.',
        accent: 'gold',
        icon: <GraduationCap className="size-4" />,
      },
      {
        label: 'Career',
        score: Math.max(56, fallbackBase - 1),
        summary: 'Career alignment is based on the information this member has chosen to share.',
        accent: 'burgundy',
        icon: <Briefcase className="size-4" />,
      },
      {
        label: 'Location',
        score: Math.max(54, fallbackBase - 3),
        summary: 'Location fit becomes clearer after you compare city and relocation preferences.',
        accent: 'emerald',
        icon: <MapPin className="size-4" />,
      },
      {
        label: 'Community',
        score: Math.max(57, fallbackBase - 2),
        summary: 'Religion, community, and language preferences can strengthen this introduction.',
        accent: 'gold',
        icon: <Users className="size-4" />,
      },
    ];
  }

  const locationScore = averageScore([
    matchValue(viewerProfile.location?.city, profile.location?.city, { fallback: 66 }),
    matchValue(viewerProfile.location?.state, profile.location?.state, { exact: 86, mismatch: 58, fallback: 68 }),
    matchArray(viewerProfile.partnerPreference?.cities, profile.location?.city, { match: 92, fallback: 66, miss: 55 }),
  ]);

  const educationScore = averageScore([
    matchValue(viewerProfile.education?.highestQualification, profile.education?.highestQualification, {
      exact: 92,
      mismatch: 64,
      fallback: 72,
    }),
    matchArray(viewerProfile.partnerPreference?.educationLevels, profile.education?.highestQualification, {
      match: 94,
      fallback: 70,
      miss: 58,
    }),
  ]);

  const careerScore = averageScore([
    matchValue(viewerProfile.employment?.industry, profile.employment?.industry, {
      exact: 90,
      mismatch: 60,
      fallback: 70,
    }),
    matchValue(viewerProfile.employment?.occupation, profile.employment?.occupation, {
      exact: 86,
      mismatch: 62,
      fallback: 68,
    }),
  ]);

  const communityScore = averageScore([
    matchValue(viewerProfile.religion?.religion, profile.religion?.religion, {
      exact: 94,
      mismatch: 54,
      fallback: 72,
    }),
    matchValue(viewerProfile.religion?.community, profile.religion?.community, {
      exact: 90,
      mismatch: 58,
      fallback: 68,
    }),
    matchArray(viewerProfile.partnerPreference?.communities, profile.religion?.community, {
      match: 94,
      fallback: 68,
      miss: 56,
    }),
  ]);

  const familyScore = averageScore([
    matchValue(viewerProfile.family?.familyValues, profile.family?.familyValues, {
      exact: 90,
      mismatch: 60,
      fallback: 72,
    }),
    matchValue(viewerProfile.family?.familyType, profile.family?.familyType, {
      exact: 84,
      mismatch: 62,
      fallback: 70,
    }),
  ]);

  const lifestyleScore = averageScore([
    matchValue(viewerProfile.lifestyle?.diet, profile.lifestyle?.diet, {
      exact: 92,
      mismatch: 54,
      fallback: 72,
    }),
    matchValue(viewerProfile.lifestyle?.smoking, profile.lifestyle?.smoking, {
      exact: 96,
      mismatch: 48,
      fallback: 74,
    }),
    matchValue(viewerProfile.lifestyle?.drinking, profile.lifestyle?.drinking, {
      exact: 94,
      mismatch: 52,
      fallback: 72,
    }),
  ]);

  return [
    {
      label: 'Lifestyle',
      score: lifestyleScore,
      summary: 'Built from diet, smoking, drinking, and everyday living preferences.',
      accent: 'emerald',
      icon: <Sun className="size-4" />,
    },
    {
      label: 'Family values',
      score: familyScore,
      summary: 'Looks at how each of you describes family values and household style.',
      accent: 'burgundy',
      icon: <Home className="size-4" />,
    },
    {
      label: 'Education',
      score: educationScore,
      summary: 'Compares qualifications and whether this profile fits your education preferences.',
      accent: 'gold',
      icon: <GraduationCap className="size-4" />,
    },
    {
      label: 'Career',
      score: careerScore,
      summary: 'Based on occupation and industry overlap where information is available.',
      accent: 'burgundy',
      icon: <Briefcase className="size-4" />,
    },
    {
      label: 'Location',
      score: locationScore,
      summary: 'Reflects city and state alignment plus your stated location preferences.',
      accent: 'emerald',
      icon: <MapPin className="size-4" />,
    },
    {
      label: 'Community',
      score: communityScore,
      summary: 'Uses religion, community, and preference matches without forcing exact sameness.',
      accent: 'gold',
      icon: <Users className="size-4" />,
    },
  ];
}

function buildCompatibilityInsights(
  viewerProfile: ViewerProfile | null,
  profile: ProfileDetail,
): InsightCard[] {
  const insights: InsightCard[] = [];

  if (
    viewerProfile?.education?.highestQualification &&
    profile.education?.highestQualification &&
    normalize(viewerProfile.education.highestQualification) ===
      normalize(profile.education.highestQualification)
  ) {
    insights.push({
      title: 'Similar educational background',
      body: `You both describe your education as ${profile.education.highestQualification}, which can make life stage and ambition easier to read quickly.`,
    });
  }

  if (
    viewerProfile?.location?.city &&
    profile.location?.city &&
    normalize(viewerProfile.location.city) === normalize(profile.location.city)
  ) {
    insights.push({
      title: 'Shared local rhythm',
      body: `You are both connected to ${profile.location.city}, which can make introductions, meetings, and family coordination simpler.`,
    });
  }

  if (
    viewerProfile?.religion?.community &&
    profile.religion?.community &&
    normalize(viewerProfile.religion.community) === normalize(profile.religion.community)
  ) {
    insights.push({
      title: 'Community familiarity',
      body: `You both reference ${profile.religion.community}, which can create immediate cultural familiarity without forcing every preference to be identical.`,
    });
  }

  if (
    viewerProfile?.family?.familyValues &&
    profile.family?.familyValues &&
    normalize(viewerProfile.family.familyValues) === normalize(profile.family.familyValues)
  ) {
    insights.push({
      title: 'Aligned family values',
      body: `You both describe your family values as ${profile.family.familyValues}, which often shapes comfort, priorities, and long-term expectations.`,
    });
  }

  if (
    viewerProfile?.lifestyle?.smoking &&
    profile.lifestyle?.smoking &&
    normalize(viewerProfile.lifestyle.smoking) === normalize(profile.lifestyle.smoking)
  ) {
    insights.push({
      title: 'Compatible lifestyle expectations',
      body: 'Daily lifestyle choices appear to be easier to align, which helps early conversations feel more grounded and practical.',
    });
  }

  if (profile.verification?.level || profile.completionPercentage >= 80) {
    insights.push({
      title: 'Serious profile signals',
      body: 'This profile is relatively complete and carries trust signals that suggest thoughtful participation rather than casual browsing.',
    });
  }

  if (profile.about?.partnerExpectations) {
    insights.push({
      title: 'Clear long-term intention',
      body: 'They have shared partner expectations, which usually means they are thinking carefully about long-term compatibility and not just surface matching.',
    });
  }

  return insights.slice(0, 5);
}

function buildConversationStarters(profile: ProfileDetail): string[] {
  const starters: string[] = [];
  const hobbies = profile.about?.hobbies?.filter(Boolean) ?? [];
  const interests = profile.about?.interests?.filter(Boolean) ?? [];

  if (hobbies.length > 0) {
    starters.push(`Ask what they enjoy most about ${hobbies[0]} and how it fits into their weekly routine.`);
  }

  if (interests.length > 0) {
    starters.push(`Start with ${interests[0]} and ask how that interest became important to them.`);
  }

  if (profile.employment?.occupation) {
    starters.push(`Ask about their career journey in ${profile.employment.occupation} and what they find most meaningful about it.`);
  }

  if (profile.location?.city) {
    starters.push(`Ask what they love most about living in ${profile.location.city} and whether they imagine building long-term life there.`);
  }

  if (profile.family?.familyValues) {
    starters.push(`Ask what ${profile.family.familyValues.toLowerCase()} family values look like in everyday life for them.`);
  }

  if (profile.religion?.motherTongue || profile.religion?.community) {
    starters.push(`Ask about the traditions, language, or family customs they most want to carry forward into married life.`);
  }

  if (profile.about?.partnerExpectations) {
    starters.push('Ask which qualities matter most to them once conversations move beyond first impressions.');
  }

  return Array.from(new Set(starters)).slice(0, 5);
}

function buildTimeline(profile: ProfileDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  if (profile.createdAt) {
    items.push({
      label: 'Joined Vivah',
      body: `Profile joined the community on ${formatDate(profile.createdAt)}.`,
      tone: 'activity',
    });
  }

  if (profile.verification?.level) {
    items.push({
      label: 'Verification added',
      body: `${profile.verification.level.replaceAll('_', ' ')} trust status is visible on this profile.`,
      tone: 'trust',
    });
  }

  if ((profile.publicGallery?.length ?? 0) > 0) {
    items.push({
      label: 'Added public photos',
      body: `${profile.publicGallery?.length} approved photo${profile.publicGallery?.length === 1 ? '' : 's'} help the profile feel more current and personal.`,
      tone: 'gallery',
    });
  }

  if (profile.updatedAt) {
    items.push({
      label: 'Recently active',
      body: `Profile activity was refreshed around ${formatRelativeDate(profile.updatedAt)}.`,
      tone: 'activity',
    });
  }

  items.push({
    label: 'Completed profile',
    body: `${profile.completionPercentage}% of the profile has been filled out, giving you a clearer sense of who this person is.`,
    tone: 'trust',
  });

  return items.slice(0, 5);
}

function buildPartnerPreferenceGroups(profile: ProfileDetail) {
  return [
    {
      title: 'Looking for',
      chips: [
        profile.partnerPreference?.ageMin || profile.partnerPreference?.ageMax
          ? `Age ${profile.partnerPreference?.ageMin ?? 'Any'}–${profile.partnerPreference?.ageMax ?? 'Any'}`
          : undefined,
        ...(profile.partnerPreference?.communities ?? []).slice(0, 2).map((item) => `${item} community`),
        ...(profile.partnerPreference?.religions ?? []).slice(0, 2).map((item) => `${item} faith background`),
      ].filter((value): value is string => Boolean(value)),
    },
    {
      title: 'Lifestyle fit',
      chips: [
        profile.lifestyle?.smoking ? `${formatEnum(profile.lifestyle.smoking)} smoking preference` : undefined,
        profile.lifestyle?.drinking ? `${formatEnum(profile.lifestyle.drinking)} drinking preference` : undefined,
        profile.lifestyle?.diet ? `${formatEnum(profile.lifestyle.diet)} lifestyle` : undefined,
      ].filter((value): value is string => Boolean(value)),
    },
    {
      title: 'Practical preferences',
      chips: [
        ...(profile.partnerPreference?.cities ?? []).slice(0, 2).map((item) => `Open to ${item}`),
        ...(profile.partnerPreference?.countries ?? []).slice(0, 2).map((item) => `${item} based`),
        ...(profile.partnerPreference?.educationLevels ?? []).slice(0, 2).map((item) => `${item} educated`),
      ].filter((value): value is string => Boolean(value)),
    },
  ].filter((group) => group.chips.length > 0);
}

function buildPersonalityTraits(profile: ProfileDetail): string[] {
  const traits: string[] = [];

  const diet = profile.lifestyle?.diet?.toLowerCase();
  if (diet === 'vegetarian') traits.push('🌿 Vegetarian');
  else if (diet === 'vegan') traits.push('🥗 Vegan');
  else if (diet) traits.push(`🍽️ ${formatEnum(diet)}`);

  const smoking = profile.lifestyle?.smoking?.toLowerCase();
  if (smoking === 'non_smoker' || smoking === 'non-smoker' || smoking === 'never') traits.push('🚭 Non-smoker');
  else if (smoking === 'smoker') traits.push('🚬 Smoker');

  const drinking = profile.lifestyle?.drinking?.toLowerCase();
  if (drinking === 'non_drinker' || drinking === 'never' || drinking === 'no') traits.push('🍵 Non-drinker');

  const familyValues = profile.family?.familyValues?.toLowerCase();
  if (familyValues === 'traditional') traits.push('🏡 Traditional values');
  else if (familyValues === 'moderate') traits.push('⚖️ Moderate values');
  else if (familyValues === 'liberal') traits.push('🌍 Liberal mindset');

  if (profile.family?.familyType?.toLowerCase().includes('joint')) traits.push('👨‍👩‍👧‍👦 Joint family');
  if (profile.family?.familyType?.toLowerCase().includes('nuclear')) traits.push('🏠 Nuclear family');

  if (profile.religion?.languagesSpoken && profile.religion.languagesSpoken.length > 1) {
    traits.push(`💬 ${profile.religion.languagesSpoken.length} languages`);
  }

  if (profile.location?.visaStatus?.toLowerCase().includes('citizen')) traits.push('🇦🇺 Australian citizen');
  else if (profile.location?.visaStatus?.toLowerCase().includes('pr')) traits.push('🇦🇺 Permanent resident');

  return traits.slice(0, 6);
}

function buildInterestGroups(profile: ProfileDetail) {
  const all = [...(profile.about?.hobbies ?? []), ...(profile.about?.interests ?? [])].filter(Boolean);

  const cultureTerms = ['music', 'classical', 'bollywood', 'movies', 'art', 'culture', 'reading', 'books', 'writing', 'poetry', 'theatre', 'dance'];
  const outdoorTerms = ['hiking', 'travel', 'trekking', 'sports', 'cricket', 'football', 'gym', 'yoga', 'fitness', 'cycling', 'swimming', 'running'];
  const foodTerms = ['cooking', 'baking', 'food', 'restaurants', 'cuisine', 'chef'];
  const techTerms = ['technology', 'coding', 'programming', 'gaming', 'photography'];

  type GroupKey = 'Culture & Arts' | 'Outdoor & Sport' | 'Food & Lifestyle' | 'Tech & Creative' | 'Other Passions';
  const groups: Record<GroupKey, string[]> = {
    'Culture & Arts': [],
    'Outdoor & Sport': [],
    'Food & Lifestyle': [],
    'Tech & Creative': [],
    'Other Passions': [],
  };

  for (const item of all) {
    const lower = item.toLowerCase();
    if (cultureTerms.some((t) => lower.includes(t))) {
      groups['Culture & Arts'].push(item);
    } else if (outdoorTerms.some((t) => lower.includes(t))) {
      groups['Outdoor & Sport'].push(item);
    } else if (foodTerms.some((t) => lower.includes(t))) {
      groups['Food & Lifestyle'].push(item);
    } else if (techTerms.some((t) => lower.includes(t))) {
      groups['Tech & Creative'].push(item);
    } else {
      groups['Other Passions'].push(item);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Primitive UI Components ────────────────────────────────────────────────

function DetailField({ label, value }: Readonly<{ label: string; value?: ReactNode }>) {
  return (
    <div className="rounded-2xl bg-[#FFF9F5] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">{label}</p>
      <p className="mt-1 font-medium text-[#2F2F2F]">{value || 'Not shared'}</p>
    </div>
  );
}

function ToneBadge({
  children,
  tone = 'burgundy',
  size = 'sm',
}: Readonly<{ children: ReactNode; tone?: 'burgundy' | 'gold' | 'emerald'; size?: 'sm' | 'md' }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-bold font-poppins',
        size === 'sm' && 'px-3 py-1 text-xs',
        size === 'md' && 'px-4 py-1.5 text-sm',
        tone === 'burgundy' && 'bg-[#E74C7C]/12 text-[#A10E4D]',
        tone === 'gold' && 'bg-[#D4A04C]/12 text-[#9A6F1E]',
        tone === 'emerald' && 'bg-[#1F6F4A]/10 text-[#1F6F4A]',
      )}
    >
      {children}
    </span>
  );
}

function ProfileSurface({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <motion.section {...fadeInUp}>
      <PremiumCard
        className={cx(
          'rounded-[30px] border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(161,14,77,0.05)] sm:p-6',
          className,
        )}
      >
        {children}
      </PremiumCard>
    </motion.section>
  );
}

function StaticProfileLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F] font-poppins">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}

// ─── Compatibility Score Ring ───────────────────────────────────────────────

function ScoreRing({
  score,
  size = 88,
  strokeWidth = 8,
  color = '#A10E4D',
  label,
}: Readonly<{
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}>) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F3E8EF"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#2F2F2F] leading-none">{score}%</span>
        {label && <span className="mt-0.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  );
}

// ─── Photo Lightbox ─────────────────────────────────────────────────────────

function PhotoLightbox({
  open,
  onOpenChange,
  title,
  description,
  imageUrl,
}: Readonly<{
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description?: string;
  imageUrl: string | null;
}>) {
  if (!imageUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden bg-[#2F2F2F] p-0 text-white">
          <div className="relative aspect-[4/5] w-full bg-[#111111]">
            <Image src={imageUrl} alt={title} fill sizes="100vw" className="object-contain" />
          </div>
        <div className="p-5 text-left">
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-2 text-white/70">{description}</DialogDescription>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Gallery Section ────────────────────────────────────────────────────────

function GalleryExperienceSection({
  profile,
  profileId,
  token,
}: Readonly<{
  profile: ProfileDetail;
  profileId: string;
  token: string | null;
}>) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const gallery = profile.publicGallery ?? [];

  return (
    <ProfileSurface className="overflow-hidden">
      <SectionHeader
        eyebrow="Gallery"
        title="See the person before the biodata"
        subtitle="Photos help you build attraction and emotional context before you decide whether to reach out."
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {gallery.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setLightboxUrl(gallery[0]?.assetUrl ?? null)}
                className="group relative aspect-[4/4.8] overflow-hidden rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF0F3]"
              >
                <Image
                  src={gallery[0]!.assetUrl}
                  alt={`${profile.personal?.firstName ?? 'Vivah member'} profile photo`}
                  fill
                  sizes="(min-width: 1280px) 40vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#2F2F2F]/70 to-transparent px-5 py-4 text-left text-white">
                  <div>
                    <p className="text-sm font-semibold">Primary photo</p>
                    <p className="text-xs text-white/70">Tap to view full size</p>
                  </div>
                  <ToneBadge tone="gold">
                    <ImageIcon className="size-3.5" />
                    Gallery
                  </ToneBadge>
                </div>
              </button>

              {gallery.length > 1 ? (
                <div className="grid grid-cols-3 gap-3">
                  {gallery.slice(1, 4).map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxUrl(photo.assetUrl)}
                      className="group relative aspect-[4/4.6] overflow-hidden rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF0F3]"
                    >
                      <Image
                        src={photo.assetUrl}
                        alt={`Gallery photo ${index + 2}`}
                        fill
                        sizes="(min-width: 768px) 20vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid min-h-[340px] place-items-center rounded-[28px] border border-dashed border-[#D4A04C]/40 bg-[linear-gradient(135deg,#FFF9F5_0%,#FFF0F3_100%)] p-8 text-center">
              <div>
                <ImageOff className="mx-auto size-10 text-[#D4A04C]" />
                <p className="mt-4 text-lg font-semibold text-[#2F2F2F]">No public gallery yet</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
                  This member has not added public gallery photos yet, but you can still review
                  their trust signals, compatibility, and request access to private photos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              First impression
            </p>
            <p className="mt-3 text-lg font-semibold text-[#2F2F2F]">
              Gallery access works best once the basics already feel promising.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Use the compatibility and trust signals above to decide whether this feels like a
              serious introduction, then request more photos if you want to go deeper.
            </p>
          </div>

          <PrivateGalleryAccessCard
            profileId={profileId}
            profileName={profile.personal?.firstName ?? 'this member'}
            token={token}
            onPreviewPhoto={(url) => setLightboxUrl(url)}
          />
        </div>
      </div>

      <PhotoLightbox
        open={Boolean(lightboxUrl)}
        onOpenChange={(value) => {
          if (!value) {
            setLightboxUrl(null);
          }
        }}
        title={`${profile.personal?.firstName ?? 'Vivah member'} gallery photo`}
        description="Approved profile photo"
        imageUrl={lightboxUrl}
      />
    </ProfileSurface>
  );
}

// ─── Private Gallery Access Card ────────────────────────────────────────────

function PrivateGalleryAccessCard({
  profileId,
  profileName,
  token,
  onPreviewPhoto,
}: Readonly<{
  profileId: string;
  profileName: string;
  token: string | null;
  onPreviewPhoto: (url: string) => void;
}>) {
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

  async function reloadStatus() {
    if (!token) {
      setLoadingStatus(false);
      return;
    }

    setLoadingStatus(true);
    try {
      const res = await authFetch(`/api/me/photo-requests/status/${profileId}`);
      if (res.ok) {
        const data = (await res.json()) as PhotoStatusResponse;
        setRequestStatus(data);

        if (data.hasAccess) {
          setLoadingPhotos(true);
          const photosRes = await authFetch(`/api/profiles/${profileId}/private-gallery`);
          if (photosRes.ok) {
            const payload = (await photosRes.json()) as { photos: PrivatePhoto[] };
            setPhotos(payload.photos ?? []);
          }
          setLoadingPhotos(false);
        } else {
          setPhotos([]);
        }
      }
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    void reloadStatus();
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
      setFeedback(data.message ?? (res.ok ? 'Request sent.' : 'Failed to send request.'));
      if (res.ok) {
        setShowMessageBox(false);
        setMessage('');
        await reloadStatus();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleWithdraw() {
    if (!requestStatus?.requestId) {
      return;
    }

    setSending(true);
    try {
      const res = await authFetch(`/api/me/photo-requests/${requestStatus.requestId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedback('Request withdrawn.');
        await reloadStatus();
      }
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-[28px] border border-dashed border-[#D4A04C]/50 bg-white p-6 text-center">
        <Lock className="mx-auto size-8 text-[#D4A04C]" />
        <p className="mt-4 text-lg font-semibold text-[#2F2F2F]">Sign in for private photos</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Private gallery access is only available to signed-in members so photo sharing stays in
          the member community.
        </p>
      </div>
    );
  }

  if (loadingStatus) {
    return (
      <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[#6B7280]">Checking gallery access...</p>
      </div>
    );
  }

  const status = requestStatus?.status ?? 'NONE';

  if (requestStatus?.hasAccess) {
    return (
      <div className="rounded-[28px] border border-[#1F6F4A]/15 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone="emerald">
            <CheckCircle2 className="size-3.5" />
            Access granted
          </ToneBadge>
          {requestStatus.accessGrantedUntil ? (
            <span className="text-xs font-medium text-[#6B7280]">
              Until {formatDate(requestStatus.accessGrantedUntil)}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-[#6B7280]">
          You can now view the private gallery that {profileName} chose to share with you.
        </p>

        {loadingPhotos ? (
          <p className="mt-4 text-sm text-[#6B7280]">Loading private photos...</p>
        ) : photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {photos.slice(0, 4).map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onPreviewPhoto(photo.assetUrl)}
                className="relative overflow-hidden rounded-[20px] border border-[#A10E4D]/10"
              >
                <Image
                  src={photo.assetUrl}
                  alt="Private gallery photo"
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                  className="object-cover transition duration-300 hover:scale-105"
                />
                <span className="block aspect-[4/4.6]" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#D4A04C]/40 bg-[#FFF9F5] p-4 text-sm text-[#6B7280]">
            No private photos have been added yet.
          </div>
        )}
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="rounded-[28px] border border-[#D4A04C]/30 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF9F5_100%)] p-5 text-center">
        <Clock3 className="mx-auto size-8 text-[#D4A04C]" />
        <p className="mt-4 text-lg font-semibold text-[#2F2F2F]">Private photo request pending</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Your request is waiting for a response. We will surface the private gallery here if
          access is granted.
        </p>
        {feedback ? <p className="mt-3 text-sm font-semibold text-[#A10E4D]">{feedback}</p> : null}
        <div className="mt-4 flex justify-center">
          <PremiumButton variant="secondary" onClick={() => void handleWithdraw()} disabled={sending}>
            <X className="size-4" />
            Withdraw request
          </PremiumButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-dashed border-[#D4A04C]/50 bg-white p-5">
      <div className="text-center">
        <Lock className="mx-auto size-8 text-[#A10E4D]/50" />
        <p className="mt-4 text-lg font-semibold text-[#2F2F2F]">Private gallery</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Ask for access if you want to see more photos after the profile already feels promising.
        </p>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl bg-[#FFF0F3] px-4 py-3 text-center text-sm font-semibold text-[#A10E4D]">
          {feedback}
        </p>
      ) : null}

      {showMessageBox ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add a short note if you want to introduce yourself first..."
            maxLength={200}
            rows={3}
            className="w-full rounded-2xl border border-[#A10E4D]/20 bg-[#FFF9F5] px-4 py-3 text-sm text-[#2F2F2F] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumButton onClick={() => void handleSendRequest()} disabled={sending} className="w-full">
              <Send className="size-4" />
              {sending ? 'Sending...' : 'Send request'}
            </PremiumButton>
            <PremiumButton
              variant="secondary"
              onClick={() => {
                setShowMessageBox(false);
                setMessage('');
              }}
              className="w-full"
            >
              Cancel
            </PremiumButton>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-center">
          <PremiumButton onClick={() => setShowMessageBox(true)}>
            <Camera className="size-4" />
            Request private photos
          </PremiumButton>
        </div>
      )}
    </div>
  );
}

// ─── Conversation Starter Card ───────────────────────────────────────────────

function StarterCard({
  starter,
  index,
}: Readonly<{ starter: string; index: number }>) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(starter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      className="group relative rounded-[26px] border border-[#A10E4D]/10 bg-white p-5 cursor-pointer transition-shadow hover:shadow-[0_8px_30px_rgba(161,14,77,0.10)] hover:border-[#A10E4D]/20"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={handleCopy}
    >
      <div className="flex items-start justify-between gap-3">
        <ToneBadge tone="burgundy">
          <MessageSquareText className="size-3.5" />
          Prompt {index + 1}
        </ToneBadge>
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy prompt'}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1.5 bg-[#FFF0F3] text-[#A10E4D] hover:bg-[#A10E4D] hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#2F2F2F]">{starter}</p>
      <p className="mt-3 text-[11px] font-semibold text-[#D4A04C] opacity-0 group-hover:opacity-100 transition-opacity">
        ✦ Click to copy
      </p>
    </motion.div>
  );
}

// ─── Audio/Video Intro Placeholder ──────────────────────────────────────────

function IntroMediaPlaceholder({ firstName, videoUrl }: Readonly<{ firstName?: string; videoUrl?: string }>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[26px] border border-dashed border-[#D4A04C]/40 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF9F5_100%)] p-5 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#D4A04C]/10">
          <Mic className="size-6 text-[#D4A04C]" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#2F2F2F]">Voice Introduction</p>
        <p className="mt-2 text-xs leading-5 text-[#6B7280]">
          {firstName ? `${firstName} hasn't recorded` : "Member hasn't recorded"} a voice intro yet.
        </p>
        <span className="mt-3 inline-block rounded-full bg-[#D4A04C]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9A6F1E]">
          Coming soon
        </span>
      </div>
      {videoUrl ? (
        <div className="rounded-[26px] border border-[#A10E4D]/10 bg-white p-4 shadow-[0_12px_30px_rgba(161,14,77,0.05)] overflow-hidden flex flex-col items-start">
          <p className="text-sm font-semibold text-[#2F2F2F] mb-3">Video Introduction</p>
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video rounded-2xl border border-[#A10E4D]/10 bg-black"
          />
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-[#A10E4D]/20 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFFFFF_100%)] p-5 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#A10E4D]/8">
            <Video className="size-6 text-[#A10E4D]" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#2F2F2F]">Video Introduction</p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            Short video intros help build confidence before reaching out.
          </p>
          <span className="mt-3 inline-block rounded-full bg-[#A10E4D]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#A10E4D]">
            Coming soon
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Why This Match Section ──────────────────────────────────────────────────

function WhyThisMatchPanel({
  matchReasons,
  insights,
  firstName,
}: Readonly<{
  matchReasons?: string[];
  insights: InsightCard[];
  firstName?: string;
}>) {
  const reasons = matchReasons && matchReasons.length > 0 ? matchReasons : insights.slice(0, 3).map((i) => i.title);

  if (reasons.length === 0) return null;

  const icons = [
    <HeartHandshake key="0" className="size-5 text-[#A10E4D]" />,
    <Sparkles key="1" className="size-5 text-[#D4A04C]" />,
    <CheckCircle2 key="2" className="size-5 text-[#1F6F4A]" />,
    <Star key="3" className="size-5 text-[#A10E4D]" />,
  ];

  return (
    <motion.div
      {...fadeInUp}
      className="rounded-[30px] border border-[#D4A04C]/25 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF0F3_60%,#FFFFFF_100%)] p-6 sm:p-7"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-2xl bg-[#A10E4D]/8 p-3">
          <Quote className="size-6 text-[#A10E4D]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">Why we recommended this match</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2F2F2F]">
            {firstName ? `Why ${firstName} could be your match` : 'Why this could be your match'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#6B7280]">
            These signals are based on your profile, preferences, and what this member has shared.
          </p>
        </div>
      </div>

      <motion.ul
        className="mt-6 grid gap-3 sm:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {reasons.slice(0, 3).map((reason, i) => (
          <motion.li
            key={reason}
            variants={staggerChild}
            className="flex items-start gap-3 rounded-[22px] bg-white/80 p-4 shadow-[0_2px_12px_rgba(161,14,77,0.06)]"
          >
            <div className="shrink-0 rounded-xl bg-[#FFF9F5] p-2">
              {icons[i % icons.length]}
            </div>
            <p className="text-sm font-semibold text-[#2F2F2F] leading-snug">{reason}</p>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

// ─── Family & Future Goals Section ──────────────────────────────────────────

function FamilyFutureSection({ profile }: Readonly<{ profile: ProfileDetail }>) {
  const hasContent = profile.family?.familyValues || profile.family?.familyType || profile.about?.partnerExpectations;

  const narrativeParts: string[] = [];
  const firstName = profile.personal?.firstName;

  if (profile.family?.familyValues) {
    narrativeParts.push(`${firstName ?? 'They'} describe their family orientation as ${profile.family.familyValues.toLowerCase()}`);
  }
  if (profile.family?.familyType) {
    narrativeParts.push(`preferring a ${profile.family.familyType.toLowerCase().replace('_', ' ')} family setup`);
  }
  if (profile.location?.city || profile.location?.state) {
    narrativeParts.push(`and are based in ${profile.location.city ?? profile.location.state}`);
  }

  const narrative = narrativeParts.join(', ') + (narrativeParts.length > 0 ? '.' : '');

  return (
    <ProfileSurface>
      <div id="profile-family" className="scroll-mt-36">
        <SectionHeader
          eyebrow="Family & future"
          title="The life they are building"
          subtitle="Understanding someone's family background and long-term vision helps you imagine the life you could build together."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {hasContent ? (
            <div className="rounded-[28px] border-l-4 border-[#A10E4D] bg-[#FFF9F5] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Their family story
              </p>
              {narrative && (
                <p className="mt-4 text-base leading-8 text-[#2F2F2F] font-medium italic">
                  "{narrative}"
                </p>
              )}
              {profile.about?.partnerExpectations && (
                <>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">In their words</p>
                  <p className="mt-2 text-sm leading-7 text-[#2F2F2F]">
                    {profile.about.partnerExpectations}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#D4A04C]/40 bg-[#FFF9F5] p-5 text-sm leading-6 text-[#6B7280]">
              Family and future goals have not been shared in detail yet.
            </div>
          )}

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">Family background</p>
              <div className="mt-4 grid gap-3">
                <DetailField label="Family values" value={profile.family?.familyValues} />
                <DetailField label="Family type" value={profile.family?.familyType} />
                <DetailField label="Father's occupation" value={profile.family?.fatherOccupation} />
                <DetailField label="Mother's occupation" value={profile.family?.motherOccupation} />
              </div>
            </div>

            {/* Partner preference chips */}
            {(profile.partnerPreference?.ageMin || profile.partnerPreference?.ageMax || (profile.partnerPreference?.communities?.length ?? 0) > 0) && (
              <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                  What they imagine
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.partnerPreference?.ageMin || profile.partnerPreference?.ageMax ? (
                    <ToneBadge tone="burgundy">
                      <Heart className="size-3.5" />
                      Age {profile.partnerPreference?.ageMin ?? '?'}–{profile.partnerPreference?.ageMax ?? '?'}
                    </ToneBadge>
                  ) : null}
                  {(profile.partnerPreference?.communities ?? []).slice(0, 2).map((c) => (
                    <ToneBadge key={c} tone="gold">
                      <Users className="size-3.5" />
                      {c} community
                    </ToneBadge>
                  ))}
                  {(profile.partnerPreference?.educationLevels ?? []).slice(0, 2).map((e) => (
                    <ToneBadge key={e} tone="emerald">
                      <BookOpen className="size-3.5" />
                      {e}
                    </ToneBadge>
                  ))}
                  {(profile.partnerPreference?.cities ?? []).slice(0, 2).map((city) => (
                    <ToneBadge key={city} tone="emerald">
                      <MapPin className="size-3.5" />
                      Open to {city}
                    </ToneBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProfileSurface>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function ProfileDetailClient({ profileId }: Readonly<{ profileId: string }>) {
  const { initialized, refreshAccessToken, token } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    let active = true;

    async function fetchJson<T>(path: string, accessToken: string | null) {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.status === 401 && accessToken) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return fetchJson<T>(path, refreshedToken);
        }
      }

      return response;
    }

    async function load() {
      setState({ status: 'loading' });

      const profileResponse = await fetchJson<PublicProfileResponse>(`/api/profiles/${profileId}`, token);

      if (!active) {
        return;
      }

      if (profileResponse.status === 401) {
        setState({ status: 'restricted' });
        return;
      }

      if (profileResponse.status === 404) {
        setState({ status: 'not-found' });
        return;
      }

      if (!profileResponse.ok) {
        setState({ status: 'error', message: 'Unable to load this profile right now.' });
        return;
      }

      const profileData = (await profileResponse.json()) as PublicProfileResponse;
      if (!profileData.profile) {
        setState({ status: 'not-found' });
        return;
      }

      setState({
        status: 'ready',
        profile: profileData.profile,
        matchScore: profileData.matchScore,
        matchReasons: profileData.matchReasons,
        isPremiumProfile: profileData.isPremiumProfile,
      });

      if (token) {
        const viewerResponse = await fetchJson<{ profile?: ViewerProfile }>('/api/me/profile', token);
        if (active && viewerResponse.ok) {
          const viewerData = (await viewerResponse.json()) as { profile?: ViewerProfile };
          setViewerProfile(viewerData.profile ?? null);
        }
      } else if (active) {
        setViewerProfile(null);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [initialized, profileId, refreshAccessToken, token]);

  if (state.status === 'loading') {
    return (
      <StaticProfileLayout>
        <div className="mx-auto max-w-3xl">
          <LoadingState label="Loading profile" />
        </div>
      </StaticProfileLayout>
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

  return (
    <ProfileDetailView
      profile={state.profile}
      profileId={profileId}
      token={token}
      viewerProfile={viewerProfile}
      matchScore={state.matchScore}
      matchReasons={state.matchReasons}
      isPremiumProfile={state.isPremiumProfile}
    />
  );
}

// ─── Profile Detail View ─────────────────────────────────────────────────────

function ProfileDetailView({
  profile,
  profileId,
  token,
  viewerProfile,
  matchScore,
  matchReasons,
  isPremiumProfile,
}: Readonly<{
  profile: ProfileDetail;
  profileId: string;
  token: string | null;
  viewerProfile: ViewerProfile | null;
  matchScore?: number | undefined;
  matchReasons?: string[] | undefined;
  isPremiumProfile?: boolean | undefined;
}>) {
  const actionProfileId = profile._id ?? profileId;
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabKey>('overview');

  const fullName =
    [profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
    'Vivah member';
  const firstName = profile.personal?.firstName;

  const heroSummary = [
    profile.personal?.age ? `${profile.personal.age} years` : undefined,
    profile.location?.city,
    profile.employment?.occupation,
  ]
    .filter(Boolean)
    .join(' · ');

  const compatibilityRows = useMemo(
    () => buildCompatibilityRows(viewerProfile, profile, matchScore),
    [viewerProfile, profile, matchScore],
  );
  const insights = useMemo(
    () => buildCompatibilityInsights(viewerProfile, profile),
    [viewerProfile, profile],
  );
  const starters = useMemo(() => buildConversationStarters(profile), [profile]);
  const timeline = useMemo(() => buildTimeline(profile), [profile]);
  const partnerPreferenceGroups = useMemo(() => buildPartnerPreferenceGroups(profile), [profile]);
  const personalityTraits = useMemo(() => buildPersonalityTraits(profile), [profile]);
  const interestGroups = useMemo(() => buildInterestGroups(profile), [profile]);
  const primaryPhotoUrl = profile.photoUrl ?? profile.publicGallery?.[0]?.assetUrl ?? null;
  const lastActiveLabel = formatRelativeDate(profile.updatedAt);
  const membershipLabel = isPremiumProfile ? 'Premium member' : 'Vivah member';
  const overallScore = typeof matchScore === 'number' ? matchScore : Math.round(
    compatibilityRows.reduce((s, r) => s + r.score, 0) / compatibilityRows.length
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    function handleScroll() {
      const current = MOBILE_SECTION_TABS.find((tab) => {
        const element = document.getElementById(tab.sectionId);
        if (!element) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.top <= 190 && rect.bottom > 190;
      });

      if (current) {
        setActiveMobileTab(current.key);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const activeTabEl = document.querySelector(`[data-state="active"]`);
          if (activeTabEl) {
            activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }, 100);
      }
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <StaticProfileLayout>
      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="grid gap-6">

          <motion.div
            {...fadeInUp}
            className="rounded-[26px] border border-[#A10E4D]/10 bg-white/90 px-5 py-4 shadow-[0_14px_32px_rgba(122,31,43,0.06)] backdrop-blur"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                <a
                  href="/member/matches"
                  className="inline-flex items-center gap-2 rounded-full border border-[#A10E4D]/10 bg-[#FFF9F5] px-3 py-1.5 font-medium text-[#7A1E3A] transition hover:border-[#A10E4D]/20 hover:bg-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to matches
                </a>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF9F5] px-3 py-1.5 font-medium text-[#2F2F2F]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4A04C]">
                    Profile ID
                  </span>
                  {profile.displayId}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge tone="emerald">
                  <ShieldCheck className="size-3.5" />
                  Trust score {overallScore}/100
                </ToneBadge>
                <ToneBadge tone="gold">
                  <Clock3 className="size-3.5" />
                  {lastActiveLabel}
                </ToneBadge>
              </div>
            </div>
          </motion.div>

          {/* ── Section 1: Cinematic Hero ────────────────────────────────── */}
          <motion.section
            id="profile-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <PremiumCard className="overflow-hidden rounded-[34px] border border-[#A10E4D]/10 bg-white p-0 shadow-[0_28px_80px_rgba(122,31,43,0.12)]">
              <div className="grid xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">

                {/* Photo Panel */}
                <div className="relative min-h-[440px] overflow-hidden bg-[linear-gradient(145deg,#A10E4D_0%,#6B0C32_45%,#D4A04C_100%)]">
                  {primaryPhotoUrl ? (
                    <Image
                      src={primaryPhotoUrl}
                      alt={`${fullName} primary profile photo`}
                      fill
                      sizes="(min-width: 1280px) 35vw, 100vw"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-white">
                      <div className="grid size-40 place-items-center rounded-full border border-white/20 bg-white/10 text-6xl font-semibold shadow-2xl backdrop-blur">
                        {(profile.personal?.firstName ?? 'V').slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A12]/80 via-transparent to-transparent" />

                  {/* Bottom overlay badges */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                        'bg-white/15 backdrop-blur text-white border border-white/20'
                      )}>
                        <Sparkles className="size-3.5" />
                        {membershipLabel}
                      </span>
                      <span className={cx(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                        'bg-[#1F6F4A]/80 backdrop-blur text-white border border-[#1F6F4A]/30'
                      )}>
                        <ShieldCheck className="size-3.5" />
                        {profile.verification?.level?.replaceAll('_', ' ') ?? 'Verified'}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold">{fullName}</p>
                    <p className="text-sm text-white/75">{heroSummary}</p>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="relative p-6 sm:p-8">
                  {/* Decorative blur orb */}
                  <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[#D4A04C]/8 blur-3xl pointer-events-none" />

                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A04C]">
                      Profile {profile.displayId}
                    </p>

                    <h1 className="mt-3 font-playfair text-3xl font-semibold leading-tight text-[#2F2F2F] sm:text-4xl">
                      {fullName}
                    </h1>

                    <p className="mt-3 text-base leading-7 text-[#6B7280]">
                      {heroSummary || 'Premium matrimonial profile — Australia'}
                    </p>

                    {/* Quick trust row */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <VerificationBadge level={profile.verification?.level} />
                      {typeof matchScore === 'number' ? <MatchScoreBadge score={matchScore} /> : null}
                      <ToneBadge tone="burgundy">
                        <Clock3 className="size-3.5" />
                        {lastActiveLabel}
                      </ToneBadge>
                    </div>

                    {/* Match score ring + completion */}
                    <div className="mt-6 flex items-center gap-6">
                      <ScoreRing
                        score={overallScore}
                        size={96}
                        strokeWidth={9}
                        color="#A10E4D"
                        label="Match"
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4A04C]">
                          Profile completion
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-[#2F2F2F]">
                          {profile.completionPercentage}%
                        </p>
                        <Progress className="mt-2" value={profile.completionPercentage} />
                        <p className="mt-1.5 text-xs text-[#6B7280]">
                          More complete profiles build trust faster
                        </p>
                      </div>
                    </div>

                    {/* Match reason tags */}
                    {matchReasons?.length ? (
                      <div className="mt-6 grid gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                          Why you match
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchReasons.slice(0, 4).map((reason) => (
                            <ToneBadge key={reason} tone="emerald">
                              <HeartHandshake className="size-3.5" />
                              {reason}
                            </ToneBadge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Personality trait pills */}
                    {personalityTraits.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">At a glance</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {personalityTraits.map((trait) => (
                            <span
                              key={trait}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9F5] px-3 py-1.5 text-xs font-semibold text-[#2F2F2F] border border-[#A10E4D]/8"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hero CTAs */}
                    <div className="mt-6 hidden sm:flex flex-wrap gap-3">
                      <ProfileActions profileId={actionProfileId} compact />
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.section>

          <div className="sticky top-20 z-20 hidden md:block">
            <Tabs
              value={activeMobileTab}
              onValueChange={(value) => {
                const next = PROFILE_SECTION_TABS.find((tab) => tab.key === value);
                if (next) {
                  setActiveMobileTab(next.key);
                  scrollToSection(next.sectionId);
                }
              }}
            >
              <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-[24px] border border-[#A10E4D]/10 bg-white/95 px-2 py-2 shadow-[0_14px_30px_rgba(122,31,43,0.10)] backdrop-blur">
                {PROFILE_SECTION_TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* ── Mobile Sticky Tabs ───────────────────────────────────────── */}
          <div className="sticky top-20 z-20 -mx-4 px-4 md:hidden">
            <Tabs
              value={activeMobileTab}
              onValueChange={(value) => {
                const next = MOBILE_SECTION_TABS.find((tab) => tab.key === value);
                if (next) {
                  setActiveMobileTab(next.key);
                  scrollToSection(next.sectionId);
                }
              }}
            >
              <TabsList className="w-full bg-white/95 shadow-[0_14px_30px_rgba(122,31,43,0.10)] backdrop-blur overflow-x-auto">
                {MOBILE_SECTION_TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* ── Section 2: Why This Match ────────────────────────────────── */}
          <WhyThisMatchPanel
            insights={insights}
            {...(matchReasons !== undefined ? { matchReasons } : {})}
            {...(firstName !== undefined ? { firstName } : {})}
          />

          {/* ── Section 3: Compatibility Dashboard ──────────────────────── */}
          <ProfileSurface className="overflow-hidden">
            <div id="profile-compatibility" className="scroll-mt-36">
              <SectionHeader
                eyebrow="Compatibility overview"
                title="See the match beyond a single score"
                subtitle="These signals combine lifestyle, values, education, career, location, and community fit using the information both profiles have shared."
              />

              {/* Overall aggregate ring */}
              <div className="mt-6 flex items-center gap-5 rounded-[24px] bg-[linear-gradient(135deg,#FFF0F3_0%,#FFF9F5_100%)] border border-[#A10E4D]/10 p-5">
                <ScoreRing score={overallScore} size={80} strokeWidth={8} color="#A10E4D" label="Overall" />
                <div>
                  <p className="text-lg font-semibold text-[#2F2F2F]">
                    {overallScore >= 80
                      ? 'Strong compatibility across most dimensions'
                      : overallScore >= 65
                      ? 'Good potential with some complementary differences'
                      : 'Interesting profile — some areas to explore together'}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Based on {compatibilityRows.length} dimensions of your profiles
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {compatibilityRows.map((row) => (
                  <motion.div
                    key={row.label}
                    className="rounded-[26px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-4"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Mini score ring */}
                      <ScoreRing
                        score={row.score}
                        size={52}
                        strokeWidth={5}
                        color={
                          row.accent === 'burgundy' ? '#A10E4D' :
                          row.accent === 'gold' ? '#D4A04C' : '#1F6F4A'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {row.icon}
                          <p className="text-sm font-semibold text-[#2F2F2F]">{row.label}</p>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">{row.summary}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ProfileSurface>

          {/* ── Section 4: Gallery ───────────────────────────────────────── */}
          <div id="profile-photos" className="scroll-mt-36">
            <GalleryExperienceSection profile={profile} profileId={actionProfileId} token={token} />
          </div>

          {/* ── Section 5: Why You May Connect (Insights) ───────────────── */}
          <ProfileSurface>
            <SectionHeader
              eyebrow="Connection insights"
              title="The emotional reasons this introduction may feel natural"
              subtitle="These insight cards focus on what could help the conversation move from polite interest to genuine curiosity."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <motion.div
                    key={insight.title}
                    className="rounded-[26px] border border-[#D4A04C]/25 bg-[linear-gradient(180deg,#FFF8EC_0%,#FFFFFF_100%)] p-5"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToneBadge tone="gold">
                      <Sparkles className="size-3.5" />
                      Potential fit
                    </ToneBadge>
                    <h3 className="mt-4 text-base font-semibold text-[#2F2F2F]">{insight.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6B7280]">{insight.body}</p>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3 rounded-[26px] border border-dashed border-[#D4A04C]/50 bg-[#FFF9F5] p-6 text-sm leading-6 text-[#6B7280]">
                  We need a little more shared profile information before we can surface stronger
                  connection insights here.
                </div>
              )}
            </div>
          </ProfileSurface>

          {/* ── Section 6: About & Personality ──────────────────────────── */}
          <ProfileSurface>
            <div id="profile-about" className="scroll-mt-36">
              <SectionHeader
                eyebrow="About"
                title="Get a clearer sense of who they are"
                subtitle="Personality, lifestyle, and intentions should feel easier to grasp before you dive into structured biodata."
              />

              {/* About me pull-quote */}
              {profile.about?.aboutMe && (
                <div className="mt-6 rounded-[28px] border-l-4 border-[#D4A04C] bg-[linear-gradient(135deg,#FFF8EC_0%,#FFFFFF_100%)] p-6">
                  <Quote className="size-6 text-[#D4A04C] mb-3 opacity-60" />
                  <p className="text-base leading-8 text-[#2F2F2F] font-medium italic">
                    "{profile.about.aboutMe}"
                  </p>
                </div>
              )}

              {/* Interest groups */}
              {interestGroups.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {interestGroups.map((group) => (
                    <div key={group.label} className="rounded-[24px] border border-[#A10E4D]/10 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                        {group.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <ToneBadge key={item} tone="emerald">
                            <Sparkles className="size-3" />
                            {item}
                          </ToneBadge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !(profile.about?.hobbies?.length || profile.about?.interests?.length) ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-[#D4A04C]/40 bg-[#FFF9F5] p-4 text-sm text-[#6B7280]">
                  No hobbies or interests shared yet.
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-2">
                  {[...(profile.about?.hobbies ?? []), ...(profile.about?.interests ?? [])]
                    .filter(Boolean)
                    .slice(0, 10)
                    .map((item) => (
                      <ToneBadge key={item} tone="emerald">
                        <Sparkles className="size-3.5" />
                        {item}
                      </ToneBadge>
                    ))}
                </div>
              )}

              {/* Quick facts */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField label="Religion" value={profile.religion?.religion} />
                <DetailField label="Community" value={profile.religion?.community} />
                <DetailField label="Mother tongue" value={profile.religion?.motherTongue} />
                <DetailField label="Based in" value={profile.location?.city ?? profile.location?.state} />
              </div>

              {/* Audio/Video intro placeholder */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C] mb-4">
                  Voice & video introduction
                </p>
                <IntroMediaPlaceholder {...(firstName !== undefined ? { firstName } : {})} {...(profile.videoUrl !== undefined ? { videoUrl: profile.videoUrl } : {})} />
              </div>
            </div>
          </ProfileSurface>

          {/* ── Section 7: Conversation Starters ────────────────────────── */}
          {starters.length > 0 && (
            <ProfileSurface>
              <SectionHeader
                eyebrow="Conversation starters"
                title="If you want to message, start somewhere human"
                subtitle="These prompts are generated from real profile details to make the first message feel more thoughtful and less generic. Click any card to copy."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {starters.map((starter, index) => (
                  <StarterCard key={starter} starter={starter} index={index} />
                ))}
              </div>
            </ProfileSurface>
          )}

          {/* ── Section 8: Family & Future Goals ────────────────────────── */}
          <FamilyFutureSection profile={profile} />

          {/* ── Section 9: Partner Preferences ─────────────────────────── */}
          <ProfileSurface>
            <SectionHeader
              eyebrow="Partner expectations"
              title="What they are hoping to build"
              subtitle="This section turns abstract preference text into clearer, easier-to-scan signals."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {partnerPreferenceGroups.length > 0 ? (
                partnerPreferenceGroups.map((group) => (
                  <div key={group.title} className="rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                      {group.title}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.chips.map((chip) => (
                        <ToneBadge key={chip} tone="burgundy">
                          <Heart className="size-3.5" />
                          {chip}
                        </ToneBadge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="lg:col-span-3 rounded-[28px] border border-dashed border-[#D4A04C]/50 bg-[#FFF9F5] p-5 text-sm leading-6 text-[#6B7280]">
                  Partner expectations have not been structured in detail yet.
                </div>
              )}
            </div>

            {profile.about?.partnerExpectations && (
              <div className="mt-5 rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                  In their own words
                </p>
                <p className="mt-3 text-sm leading-7 text-[#2F2F2F]">
                  {profile.about.partnerExpectations}
                </p>
              </div>
            )}
          </ProfileSurface>

          {/* ── Section 10: Lifestyle & Education Biodata ───────────────── */}
          <ProfileSurface>
            <div id="profile-lifestyle" className="scroll-mt-36">
              <SectionHeader
                eyebrow="Lifestyle & background"
                title="The details that complete the picture"
                subtitle="Once the emotional and compatibility layers feel strong, these details help you decide whether the profile fits your longer-term reality."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sun className="size-4 text-[#D4A04C]" />
                    <p className="text-sm font-semibold text-[#2F2F2F]">Lifestyle</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField label="Diet" value={formatEnum(profile.lifestyle?.diet)} />
                    <DetailField label="Smoking" value={formatEnum(profile.lifestyle?.smoking)} />
                    <DetailField label="Drinking" value={formatEnum(profile.lifestyle?.drinking)} />
                    <DetailField label="Living arrangement" value={formatEnum(profile.lifestyle?.livingArrangement)} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="size-4 text-[#D4A04C]" />
                    <p className="text-sm font-semibold text-[#2F2F2F]">Education & career</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField label="Education" value={profile.education?.highestQualification} />
                    <DetailField label="Occupation" value={profile.employment?.occupation} />
                    <DetailField label="Industry" value={profile.employment?.industry} />
                    <DetailField label="Employer" value={profile.employment?.employerName} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="size-4 text-[#D4A04C]" />
                    <p className="text-sm font-semibold text-[#2F2F2F]">Personal details</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField label="Gender" value={formatEnum(profile.personal?.gender)} />
                    <DetailField label="Marital status" value={formatEnum(profile.personal?.maritalStatus)} />
                    <DetailField
                      label="Height"
                      value={profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined}
                    />
                    <DetailField label="Languages" value={joinList(profile.religion?.languagesSpoken)} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="size-4 text-[#D4A04C]" />
                    <p className="text-sm font-semibold text-[#2F2F2F]">Location</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField label="City" value={profile.location?.city} />
                    <DetailField label="State" value={profile.location?.state} />
                    <DetailField label="Country" value={profile.location?.country} />
                    <DetailField label="Visa status" value={profile.location?.visaStatus} />
                  </div>
                </div>
              </div>
            </div>
          </ProfileSurface>

          {/* ── Section 11: Profile Activity Timeline ───────────────────── */}
          <ProfileSurface>
            <SectionHeader
              eyebrow="Profile activity"
              title="Signals that make the profile feel alive"
              subtitle="Activity and trust events help you judge whether this introduction feels current, thoughtful, and serious."
            />

            <div className="mt-6 relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-[#A10E4D]/10 hidden sm:block" />

              <div className="grid gap-3">
                {timeline.map((item, index) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div
                      className={cx(
                        'relative z-10 mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full',
                        item.tone === 'trust' && 'bg-[#FFF0F3] text-[#A10E4D]',
                        item.tone === 'activity' && 'bg-[#F0FBF6] text-[#1F6F4A]',
                        item.tone === 'gallery' && 'bg-[#FFF8EC] text-[#8B6714]',
                      )}
                    >
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 rounded-[22px] border border-[#A10E4D]/8 bg-[#FFF9F5] p-4">
                      <p className="text-sm font-semibold text-[#2F2F2F]">{item.label}</p>
                      <p className="mt-1.5 text-sm leading-6 text-[#6B7280]">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ProfileSurface>
        </div>

        {/* ── Sidebar (desktop) ────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 grid gap-4">

            {/* Connect card */}
            <ProfileSurface className="p-0">
              <div className="rounded-[30px] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9F5_100%)] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                  Connect safely
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#2F2F2F] font-playfair">
                  {firstName ? `Is ${firstName} your match?` : 'Could this be your match?'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6B7280]">
                  Express interest, message, save, or report — all from this page.
                </p>

                {/* Trust row */}
                <div className="mt-5 rounded-[24px] border border-[#A10E4D]/10 bg-white p-4 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">Trust snapshot</p>
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-full bg-[#F0FBF6]">
                      <ShieldCheck className="size-4 text-[#1F6F4A]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#2F2F2F]">
                        {profile.verification?.level?.replaceAll('_', ' ') ?? 'Verified member'}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">Identity verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-full bg-[#FFF8EC]">
                      <Clock3 className="size-4 text-[#9A6F1E]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#2F2F2F]">{lastActiveLabel}</p>
                      <p className="text-[10px] text-[#6B7280]">Last seen active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-full bg-[#FFF0F3]">
                      <Star className="size-4 text-[#A10E4D]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#2F2F2F]">{membershipLabel}</p>
                      <p className="text-[10px] text-[#6B7280]">{profile.completionPercentage}% profile complete</p>
                    </div>
                  </div>
                </div>

                {/* Overall score mini */}
                <div className="mt-4 flex items-center gap-4 rounded-[22px] bg-[linear-gradient(135deg,#FFF0F3,#FFF9F5)] p-4 border border-[#A10E4D]/8">
                  <ScoreRing score={overallScore} size={56} strokeWidth={5} color="#A10E4D" />
                  <div>
                    <p className="text-sm font-semibold text-[#2F2F2F]">
                      {overallScore}% compatible
                    </p>
                    <p className="text-xs text-[#6B7280]">Across {compatibilityRows.length} dimensions</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <ProfileActions profileId={actionProfileId} />
                  <PremiumButton href="/member/messages" variant="secondary" className="w-full">
                    <MessageSquareText className="size-4" />
                    Send a message
                  </PremiumButton>
                </div>
              </div>
            </ProfileSurface>

            {/* Quick about card */}
            {heroSummary && (
              <ProfileSurface>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">Quick details</p>
                <div className="mt-4 grid gap-2.5">
                  {profile.personal?.age && (
                    <div className="flex items-center gap-2.5 text-sm text-[#2F2F2F]">
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
                        <Heart className="size-3" />
                      </span>
                      {profile.personal.age} years old
                    </div>
                  )}
                  {profile.location?.city && (
                    <div className="flex items-center gap-2.5 text-sm text-[#2F2F2F]">
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
                        <MapPin className="size-3" />
                      </span>
                      {profile.location.city}{profile.location.state ? `, ${profile.location.state}` : ''}
                    </div>
                  )}
                  {profile.employment?.occupation && (
                    <div className="flex items-center gap-2.5 text-sm text-[#2F2F2F]">
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
                        <Briefcase className="size-3" />
                      </span>
                      {profile.employment.occupation}
                    </div>
                  )}
                  {profile.education?.highestQualification && (
                    <div className="flex items-center gap-2.5 text-sm text-[#2F2F2F]">
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
                        <GraduationCap className="size-3" />
                      </span>
                      {profile.education.highestQualification}
                    </div>
                  )}
                  {profile.religion?.religion && (
                    <div className="flex items-center gap-2.5 text-sm text-[#2F2F2F]">
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFF0F3] text-[#A10E4D]">
                        <Star className="size-3" />
                      </span>
                      {profile.religion.religion}{profile.religion.community ? ` · ${profile.religion.community}` : ''}
                    </div>
                  )}
                </div>
              </ProfileSurface>
            )}
          </div>
        </aside>

        {/* ── Mobile Sticky Action Bar ─────────────────────────────────── */}
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[#A10E4D]/10 bg-white/95 shadow-[0_-14px_40px_rgba(122,31,43,0.12)] backdrop-blur lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
          <div className="mx-auto max-w-5xl px-4 py-3">
            {/* Mini profile info */}
            <div className="flex items-center gap-3 mb-2.5">
              {primaryPhotoUrl ? (
                <div className="relative size-9 overflow-hidden rounded-full border-2 border-[#A10E4D]/20 shrink-0">
                  <Image src={primaryPhotoUrl} alt={fullName} fill className="object-cover" sizes="36px" />
                </div>
              ) : (
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#A10E4D] text-white text-sm font-bold">
                  {(firstName ?? 'V').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#2F2F2F]">{fullName}</p>
                <p className="text-xs text-[#6B7280]">{overallScore}% match · {lastActiveLabel}</p>
              </div>
              <ToneBadge tone="emerald" size="sm">
                <ShieldCheck className="size-3" />
                Verified
              </ToneBadge>
            </div>
            <div className="grid gap-2">
              <ProfileActions profileId={actionProfileId} compact />
              <PremiumButton href="/member/messages" variant="secondary" className="w-full">
                <MessageSquareText className="size-4" />
                Message
              </PremiumButton>
            </div>
          </div>
        </div>
      </article>
    </StaticProfileLayout>
  );
}

// ─── Restricted Profile Page ─────────────────────────────────────────────────

function RestrictedProfilePage({ profileId }: Readonly<{ profileId: string }>) {
  return (
    <StaticProfileLayout>
      <motion.section {...fadeInUp} className="mx-auto max-w-4xl">
        <PremiumCard className="overflow-hidden rounded-[32px] border border-[#A10E4D]/10 p-0">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="grid min-h-[280px] place-items-center bg-[linear-gradient(145deg,#A10E4D_0%,#6B0C32_50%,#D4A04C_100%)] p-8 text-white">
              <div className="max-w-xs text-center">
                <Lock className="mx-auto size-12" />
                <p className="mt-4 text-xl font-semibold">Members only</p>
                <p className="mt-2 text-sm text-white/80">
                  Sign in to view compatibility, trust signals, and photo access.
                </p>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">
                Private profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#2F2F2F]">
                Sign in to view this member
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#6B7280]">
                This Vivah Australia profile is visible to signed-in members so personal details,
                trust signals, and gallery controls stay inside the member community.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PremiumButton href="/register">Create free profile</PremiumButton>
                <PremiumButton href={`/login?next=/profiles/${profileId}`} variant="secondary">
                  Log in
                </PremiumButton>
              </div>
            </div>
          </div>
        </PremiumCard>
      </motion.section>
    </StaticProfileLayout>
  );
}

// ─── Profile Message ─────────────────────────────────────────────────────────

function ProfileMessage({ message, title }: Readonly<{ message: string; title: string }>) {
  return (
    <StaticProfileLayout>
      <motion.section {...fadeInUp} className="mx-auto max-w-3xl">
        <PremiumCard className="rounded-[32px] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2F2F2F]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#6B7280]">{message}</p>
        </PremiumCard>
      </motion.section>
    </StaticProfileLayout>
  );
}
