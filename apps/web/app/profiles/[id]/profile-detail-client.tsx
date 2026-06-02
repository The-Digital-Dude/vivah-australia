'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  ImageIcon,
  ImageOff,
  Lock,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
  X,
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
  { key: 'compatibility', label: 'Compatibility', sectionId: 'profile-compatibility' },
  { key: 'about', label: 'About', sectionId: 'profile-about' },
  { key: 'family', label: 'Family', sectionId: 'profile-family' },
  { key: 'lifestyle', label: 'Lifestyle', sectionId: 'profile-lifestyle' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, ease: 'easeOut' },
} as const;

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
      },
      {
        label: 'Family values',
        score: fallbackBase,
        summary: 'Shared seriousness and family orientation are inferred from visible profile details.',
        accent: 'burgundy',
      },
      {
        label: 'Education',
        score: Math.min(96, fallbackBase + 2),
        summary: 'Education fit is estimated from visible academic and professional signals.',
        accent: 'gold',
      },
      {
        label: 'Career',
        score: Math.max(56, fallbackBase - 1),
        summary: 'Career alignment is based on the information this member has chosen to share.',
        accent: 'burgundy',
      },
      {
        label: 'Location',
        score: Math.max(54, fallbackBase - 3),
        summary: 'Location fit becomes clearer after you compare city and relocation preferences.',
        accent: 'emerald',
      },
      {
        label: 'Community preferences',
        score: Math.max(57, fallbackBase - 2),
        summary: 'Religion, community, and language preferences can strengthen this introduction.',
        accent: 'gold',
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
    },
    {
      label: 'Family values',
      score: familyScore,
      summary: 'Looks at how each of you describes family values and household style.',
      accent: 'burgundy',
    },
    {
      label: 'Education',
      score: educationScore,
      summary: 'Compares qualifications and whether this profile fits your education preferences.',
      accent: 'gold',
    },
    {
      label: 'Career',
      score: careerScore,
      summary: 'Based on occupation and industry overlap where information is available.',
      accent: 'burgundy',
    },
    {
      label: 'Location',
      score: locationScore,
      summary: 'Reflects city and state alignment plus your stated location preferences.',
      accent: 'emerald',
    },
    {
      label: 'Community preferences',
      score: communityScore,
      summary: 'Uses religion, community, and preference matches without forcing exact sameness.',
      accent: 'gold',
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
          ? `Age ${profile.partnerPreference?.ageMin ?? 'Any'}-${profile.partnerPreference?.ageMax ?? 'Any'}`
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

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function DetailField({ label, value }: Readonly<{ label: string; value?: ReactNode }>) {
  return (
    <div className="rounded-2xl bg-[#FCFAF7] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">{label}</p>
      <p className="mt-1 font-medium text-[#1A1A1A]">{value || 'Not shared'}</p>
    </div>
  );
}

function ToneBadge({
  children,
  tone = 'burgundy',
}: Readonly<{ children: ReactNode; tone?: 'burgundy' | 'gold' | 'emerald' }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
        tone === 'burgundy' && 'bg-[#F8E8E8] text-[#7A1F2B]',
        tone === 'gold' && 'bg-[#FFF8EC] text-[#8B6714]',
        tone === 'emerald' && 'bg-[#F0FBF6] text-[#1F6F4A]',
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
          'rounded-[30px] border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-6',
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
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}

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
        <DialogContent className="overflow-hidden bg-[#1A1A1A] p-0 text-white">
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
                className="group relative aspect-[4/4.8] overflow-hidden rounded-[28px] border border-[#7A1F2B]/10 bg-[#F8E8E8]"
              >
                <Image
                  src={gallery[0]!.assetUrl}
                  alt={`${profile.personal?.firstName ?? 'Vivah member'} profile photo`}
                  fill
                  sizes="(min-width: 1280px) 40vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#1A1A1A]/70 to-transparent px-5 py-4 text-left text-white">
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
                      className="group relative aspect-[4/4.6] overflow-hidden rounded-[22px] border border-[#7A1F2B]/10 bg-[#F8E8E8]"
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
            <div className="grid min-h-[340px] place-items-center rounded-[28px] border border-dashed border-[#D4AF37]/40 bg-[linear-gradient(135deg,#FCFAF7_0%,#F8E8E8_100%)] p-8 text-center">
              <div>
                <ImageOff className="mx-auto size-10 text-[#D4AF37]" />
                <p className="mt-4 text-lg font-semibold text-[#1A1A1A]">No public gallery yet</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
                  This member has not added public gallery photos yet, but you can still review
                  their trust signals, compatibility, and request access to private photos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
              First impression
            </p>
            <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">
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
      <div className="rounded-[28px] border border-dashed border-[#D4AF37]/50 bg-white p-6 text-center">
        <Lock className="mx-auto size-8 text-[#D4AF37]" />
        <p className="mt-4 text-lg font-semibold text-[#1A1A1A]">Sign in for private photos</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Private gallery access is only available to signed-in members so photo sharing stays in
          the member community.
        </p>
      </div>
    );
  }

  if (loadingStatus) {
    return (
      <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-6 text-center">
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
                className="relative overflow-hidden rounded-[20px] border border-[#7A1F2B]/10"
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
          <div className="mt-4 rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#FCFAF7] p-4 text-sm text-[#6B7280]">
            No private photos have been added yet.
          </div>
        )}
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="rounded-[28px] border border-[#D4AF37]/30 bg-[linear-gradient(135deg,#FFF8EC_0%,#FCFAF7_100%)] p-5 text-center">
        <Clock3 className="mx-auto size-8 text-[#D4AF37]" />
        <p className="mt-4 text-lg font-semibold text-[#1A1A1A]">Private photo request pending</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Your request is waiting for a response. We will surface the private gallery here if
          access is granted.
        </p>
        {feedback ? <p className="mt-3 text-sm font-semibold text-[#7A1F2B]">{feedback}</p> : null}
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
    <div className="rounded-[28px] border border-dashed border-[#D4AF37]/50 bg-white p-5">
      <div className="text-center">
        <Lock className="mx-auto size-8 text-[#7A1F2B]/50" />
        <p className="mt-4 text-lg font-semibold text-[#1A1A1A]">Private gallery</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Ask for access if you want to see more photos after the profile already feels promising.
        </p>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl bg-[#F8E8E8] px-4 py-3 text-center text-sm font-semibold text-[#7A1F2B]">
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
            className="w-full rounded-2xl border border-[#7A1F2B]/20 bg-[#FCFAF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
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
  const heroSummary = [
    profile.personal?.age ? `${profile.personal.age}` : undefined,
    profile.location?.city,
    profile.employment?.occupation,
  ]
    .filter(Boolean)
    .join(' • ');
  const trustIndicators = [
    {
      label:
        profile.verification?.level && profile.verification.level !== 'BASIC'
          ? 'Identity verified'
          : 'Verified member',
      tone: 'emerald' as const,
    },
    {
      label: 'Active recently',
      tone: 'burgundy' as const,
    },
    {
      label: isPremiumProfile ? 'Premium member' : 'Vivah member',
      tone: 'gold' as const,
    },
  ];
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
  const primaryPhotoUrl = profile.photoUrl ?? profile.publicGallery?.[0]?.assetUrl ?? null;
  const lastActiveLabel = formatRelativeDate(profile.updatedAt);
  const membershipLabel = isPremiumProfile ? 'Premium member' : 'Vivah member';
  const compatibilityHeadline =
    typeof matchScore === 'number'
      ? `${matchScore}% overall compatibility`
      : 'Compatibility becomes clearer as profile signals line up';

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
        // Scroll the active tab button into view inside the scrollable tab list container
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
          <motion.section
            id="profile-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <PremiumCard className="overflow-hidden rounded-[34px] border border-[#7A1F2B]/10 bg-white p-0 shadow-[0_24px_70px_rgba(122,31,43,0.10)]">
              <div className="grid gap-0 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
                <div className="relative min-h-[420px] overflow-hidden bg-[linear-gradient(145deg,#7A1F2B_0%,#651925_45%,#D4AF37_100%)]">
                  {primaryPhotoUrl ? (
                    <Image
                      src={primaryPhotoUrl}
                      alt={`${fullName} primary profile photo`}
                      fill
                      sizes="(min-width: 1280px) 35vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-white">
                      <div className="grid size-40 place-items-center rounded-full border border-white/20 bg-white/10 text-6xl font-semibold shadow-2xl backdrop-blur">
                        {(profile.personal?.firstName ?? 'V').slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/80 via-[#1A1A1A]/20 to-transparent p-5 text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <ToneBadge tone="gold">
                        <Sparkles className="size-3.5" />
                        {membershipLabel}
                      </ToneBadge>
                      <ToneBadge tone="emerald">
                        <ShieldCheck className="size-3.5" />
                        {profile.verification?.level?.replaceAll('_', ' ') ?? 'Verification pending'}
                      </ToneBadge>
                    </div>
                  </div>
                </div>

                <div className="relative p-5 sm:p-6 lg:p-8">
                  <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                      Profile {profile.displayId}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#1A1A1A] sm:text-4xl">
                      {fullName}
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-[#6B7280] sm:text-base">
                      {heroSummary || 'Premium matrimonial profile in Australia'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <VerificationBadge level={profile.verification?.level} />
                      {typeof matchScore === 'number' ? <MatchScoreBadge score={matchScore} /> : null}
                      <ToneBadge tone="burgundy">
                        <Clock3 className="size-3.5" />
                        {lastActiveLabel}
                      </ToneBadge>
                      <ToneBadge tone="gold">
                        <Star className="size-3.5" />
                        {profile.completionPercentage}% complete
                      </ToneBadge>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {trustIndicators.map((indicator) => (
                        <div
                          key={indicator.label}
                          className="rounded-[24px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4"
                        >
                          <ToneBadge tone={indicator.tone}>
                            <CheckCircle2 className="size-3.5" />
                            Trust signal
                          </ToneBadge>
                          <p className="mt-3 text-sm font-semibold text-[#1A1A1A]">{indicator.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-[#7A1F2B]/10 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                          Match score
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">
                          {typeof matchScore === 'number' ? `${matchScore}%` : 'Available to members'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                          {compatibilityHeadline}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-[#7A1F2B]/10 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                          Profile completion
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-2xl font-semibold text-[#1A1A1A]">
                            {profile.completionPercentage}%
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            More complete profiles feel easier to trust
                          </p>
                        </div>
                        <Progress className="mt-4" value={profile.completionPercentage} />
                      </div>
                    </div>

                    {matchReasons?.length ? (
                      <div className="mt-6 grid gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                          Quick compatibility highlights
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
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.section>

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
              <TabsList className="w-full bg-white/95 shadow-[0_14px_30px_rgba(122,31,43,0.10)] backdrop-blur">
                {MOBILE_SECTION_TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ProfileSurface className="overflow-hidden" >
            <div id="profile-compatibility" className="scroll-mt-36">
              <SectionHeader
                eyebrow="Compatibility overview"
                title="See the match beyond a single score"
                subtitle="These signals combine lifestyle, values, education, career, location, and community fit using the information both profiles have shared."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {compatibilityRows.map((row) => (
                  <motion.div
                    key={row.label}
                    className="rounded-[26px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A1A]">{row.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6B7280]">{row.summary}</p>
                      </div>
                      <ToneBadge tone={row.accent}>{row.score}%</ToneBadge>
                    </div>
                    <Progress
                      className="mt-4"
                      value={row.score}
                      indicatorClassName={cx(
                        row.accent === 'burgundy' && 'bg-[#7A1F2B]',
                        row.accent === 'gold' && 'bg-[#D4AF37]',
                        row.accent === 'emerald' && 'bg-[#1F6F4A]',
                      )}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </ProfileSurface>

          <div id="profile-photos" className="scroll-mt-36">
            <GalleryExperienceSection profile={profile} profileId={actionProfileId} token={token} />
          </div>

          <ProfileSurface>
            <SectionHeader
              eyebrow="Why you may connect"
              title="The emotional reasons this introduction may feel natural"
              subtitle="These insight cards focus on what could help the conversation move from polite interest to genuine curiosity."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <motion.div
                    key={insight.title}
                    className="rounded-[26px] border border-[#D4AF37]/25 bg-[linear-gradient(180deg,#FFF8EC_0%,#FFFFFF_100%)] p-5"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToneBadge tone="gold">
                      <CheckCircle2 className="size-3.5" />
                      Potential fit
                    </ToneBadge>
                    <h3 className="mt-4 text-lg font-semibold text-[#1A1A1A]">{insight.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6B7280]">{insight.body}</p>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3 rounded-[26px] border border-dashed border-[#D4AF37]/50 bg-[#FCFAF7] p-6 text-sm leading-6 text-[#6B7280]">
                  We need a little more shared profile information before we can surface stronger
                  connection insights here.
                </div>
              )}
            </div>
          </ProfileSurface>

          <ProfileSurface>
            <SectionHeader
              eyebrow="Conversation starters"
              title="If you want to message, start somewhere human"
              subtitle="These prompts are generated from real profile details to make the first message feel more thoughtful and less generic."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {starters.map((starter, index) => (
                <motion.div
                  key={starter}
                  className="rounded-[26px] border border-[#7A1F2B]/10 bg-white p-5"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ToneBadge tone="burgundy">
                    <MessageSquareText className="size-3.5" />
                    Prompt {index + 1}
                  </ToneBadge>
                  <p className="mt-4 text-sm leading-7 text-[#1A1A1A]">{starter}</p>
                </motion.div>
              ))}
            </div>
          </ProfileSurface>

          <ProfileSurface>
            <div id="profile-about" className="scroll-mt-36">
              <SectionHeader
                eyebrow="About"
                title="Get a clearer sense of who they are"
                subtitle="Personality, lifestyle, and intentions should feel easier to grasp before you dive into structured biodata."
              />

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-5">
                  <p className="text-sm leading-8 text-[#1A1A1A]">
                    {profile.about?.aboutMe ?? 'This member has not added a profile summary yet.'}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                      Interests
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...(profile.about?.hobbies ?? []), ...(profile.about?.interests ?? [])]
                        .filter(Boolean)
                        .slice(0, 8)
                        .map((item) => (
                          <ToneBadge key={item} tone="emerald">
                            <Sparkles className="size-3.5" />
                            {item}
                          </ToneBadge>
                        ))}
                      {!(profile.about?.hobbies?.length || profile.about?.interests?.length) ? (
                        <p className="text-sm text-[#6B7280]">No hobbies or interests shared yet.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                      At a glance
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DetailField label="Religion" value={profile.religion?.religion} />
                      <DetailField label="Community" value={profile.religion?.community} />
                      <DetailField label="Mother tongue" value={profile.religion?.motherTongue} />
                      <DetailField label="Living in" value={profile.location?.city ?? profile.location?.state} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ProfileSurface>

          <ProfileSurface>
            <SectionHeader
              eyebrow="Partner expectations"
              title="What they are hoping to build"
              subtitle="This section turns abstract preference text into clearer, easier-to-scan signals."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {partnerPreferenceGroups.length > 0 ? (
                partnerPreferenceGroups.map((group) => (
                  <div key={group.title} className="rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                      {group.title}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.chips.map((chip) => (
                        <ToneBadge key={chip} tone="burgundy">
                          <UserRoundCheck className="size-3.5" />
                          {chip}
                        </ToneBadge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="lg:col-span-3 rounded-[28px] border border-dashed border-[#D4AF37]/50 bg-[#FCFAF7] p-5 text-sm leading-6 text-[#6B7280]">
                  Partner expectations have not been structured in detail yet.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                In their own words
              </p>
              <p className="mt-3 text-sm leading-7 text-[#1A1A1A]">
                {profile.about?.partnerExpectations ?? 'Partner expectations have not been shared yet.'}
              </p>
            </div>
          </ProfileSurface>

          <ProfileSurface>
            <SectionHeader
              eyebrow="Profile activity"
              title="Signals that make the profile feel alive"
              subtitle="Activity and trust events help you judge whether this introduction feels current, thoughtful, and serious."
            />

            <div className="mt-6 grid gap-4">
              {timeline.map((item, index) => (
                <div key={item.label} className="rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cx(
                        'mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full',
                        item.tone === 'trust' && 'bg-[#F8E8E8] text-[#7A1F2B]',
                        item.tone === 'activity' && 'bg-[#F0FBF6] text-[#1F6F4A]',
                        item.tone === 'gallery' && 'bg-[#FFF8EC] text-[#8B6714]',
                      )}
                    >
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[#6B7280]">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ProfileSurface>

          <ProfileSurface>
            <div id="profile-family" className="scroll-mt-36">
              <SectionHeader
                eyebrow="Family and life context"
                title="The biodata matters, but it should arrive after the connection cues"
                subtitle="Once the emotional and compatibility layers feel strong, these details help you decide whether the profile fits your longer-term reality."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Family details</p>
                  <div className="mt-4 grid gap-3">
                    <DetailField label="Family values" value={profile.family?.familyValues} />
                    <DetailField label="Family type" value={profile.family?.familyType} />
                    <DetailField label="Father occupation" value={profile.family?.fatherOccupation} />
                    <DetailField label="Mother occupation" value={profile.family?.motherOccupation} />
                  </div>
                </div>

                <div id="profile-lifestyle" className="scroll-mt-36 rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Lifestyle</p>
                  <div className="mt-4 grid gap-3">
                    <DetailField label="Diet" value={formatEnum(profile.lifestyle?.diet)} />
                    <DetailField label="Smoking" value={formatEnum(profile.lifestyle?.smoking)} />
                    <DetailField label="Drinking" value={formatEnum(profile.lifestyle?.drinking)} />
                    <DetailField
                      label="Living arrangement"
                      value={formatEnum(profile.lifestyle?.livingArrangement)}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Education and career</p>
                  <div className="mt-4 grid gap-3">
                    <DetailField label="Education" value={profile.education?.highestQualification} />
                    <DetailField label="Occupation" value={profile.employment?.occupation} />
                    <DetailField label="Industry" value={profile.employment?.industry} />
                    <DetailField label="Employer" value={profile.employment?.employerName} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Detailed information</p>
                  <div className="mt-4 grid gap-3">
                    <DetailField label="Gender" value={formatEnum(profile.personal?.gender)} />
                    <DetailField label="Marital status" value={formatEnum(profile.personal?.maritalStatus)} />
                    <DetailField
                      label="Height"
                      value={profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined}
                    />
                    <DetailField label="Languages" value={joinList(profile.religion?.languagesSpoken)} />
                    <DetailField label="Country" value={profile.location?.country} />
                    <DetailField label="Visa status" value={profile.location?.visaStatus} />
                  </div>
                </div>
              </div>
            </div>
          </ProfileSurface>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 grid gap-4">
            <ProfileSurface className="p-0">
              <div className="rounded-[30px] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFAF7_100%)] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                  Connect safely
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#1A1A1A]">
                  Interested in knowing {profile.personal?.firstName ?? 'them'} better?
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6B7280]">
                  Use interest, messaging, save, report, block, or ignore without leaving the page.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[24px] border border-[#7A1F2B]/10 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                      Trust snapshot
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <VerificationBadge level={profile.verification?.level} />
                      <ToneBadge tone="burgundy">{lastActiveLabel}</ToneBadge>
                      <ToneBadge tone="gold">{membershipLabel}</ToneBadge>
                    </div>
                  </div>

                  <ProfileActions profileId={actionProfileId} />

                  <PremiumButton href="/member/messages" variant="secondary" className="w-full">
                    <MessageSquareText className="size-4" />
                    Message
                  </PremiumButton>
                </div>
              </div>
            </ProfileSurface>
          </div>
        </aside>

        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[#7A1F2B]/10 bg-white/95 p-3 shadow-[0_-14px_40px_rgba(122,31,43,0.12)] backdrop-blur lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <div className="mx-auto grid max-w-5xl gap-2">
            <ProfileActions profileId={actionProfileId} compact />
            <PremiumButton href="/member/messages" variant="secondary" className="w-full">
              <MessageSquareText className="size-4" />
              Message
            </PremiumButton>
          </div>
        </div>
      </article>
    </StaticProfileLayout>
  );
}

function RestrictedProfilePage({ profileId }: Readonly<{ profileId: string }>) {
  return (
    <StaticProfileLayout>
      <motion.section {...fadeInUp} className="mx-auto max-w-4xl">
        <PremiumCard className="overflow-hidden rounded-[32px] border border-[#7A1F2B]/10 p-0">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="grid min-h-[280px] place-items-center bg-[linear-gradient(145deg,#7A1F2B_0%,#651925_50%,#D4AF37_100%)] p-8 text-white">
              <div className="max-w-xs text-center">
                <Lock className="mx-auto size-12" />
                <p className="mt-4 text-xl font-semibold">Members only</p>
                <p className="mt-2 text-sm text-white/80">
                  Sign in to view compatibility, trust signals, and photo access.
                </p>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Private profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#1A1A1A]">
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

function ProfileMessage({ message, title }: Readonly<{ message: string; title: string }>) {
  return (
    <StaticProfileLayout>
      <motion.section {...fadeInUp} className="mx-auto max-w-3xl">
        <PremiumCard className="rounded-[32px] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#1A1A1A]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#6B7280]">{message}</p>
        </PremiumCard>
      </motion.section>
    </StaticProfileLayout>
  );
}
