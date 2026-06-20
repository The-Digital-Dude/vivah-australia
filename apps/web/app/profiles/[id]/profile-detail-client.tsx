'use client';

import Image from 'next/image';
import Link from 'next/link';
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
  ImageIcon,
  ImageOff,
  Lock,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  X,
  Users,
  BookOpen,
  Briefcase,
  Quote,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/app/components/ui/dialog';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  LoadingState,
  PremiumButton,
  PremiumCard,
  PublicFooter,
  PublicHeader,
} from '@/app/components';
import { useAuth } from '@/app/auth-context';
import ProfileActions from '../../member/profile-actions';
import {
  buildCompatibilityRows,
  getCompatibilityHeadline,
  splitCompatibilityRows,
} from './profile-compatibility';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000').trim();

interface PublicPhoto {
  id: string;
  assetUrl: string;
  thumbnailUrl?: string;
  videoPosterUrl?: string;
  isPrimary: boolean;
  category?: string;
}

interface PublicProfileResponse {
  profile?: ProfileDetail;
  matchScore?: number;
  matchReasons?: string[];
  isPaidMember?: boolean;
  isPremiumProfile?: boolean;
  responsivenessLabel?: string;
}

interface ProfileDetail {
  _id?: string;
  displayId: string;
  completionPercentage: number;
  photoUrl?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
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
    fatherDetails?: string;
    motherDetails?: string;
    siblingDetails?: string;
  };
  lifestyle?: {
    dietaryPreferences?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
    fitnessInterests?: string[];
    religiousPractices?: string;
  };
  compatibility?: {
    relationshipPace?: string;
    familyInvolvement?: string;
    relocationOpenness?: string;
    communicationStyle?: string;
    qualityTimeStyle?: string;
    conflictApproach?: string;
    valuesPrompt?: string;
    relationshipVision?: string;
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
  _id?: string;
  displayId?: string;
  slug?: string;
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
    dietaryPreferences?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
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
  thumbnailUrl?: string;
  videoPosterUrl?: string;
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
      responsivenessLabel?: string | undefined;
    };

type MobileTabKey = 'overview' | 'photos' | 'about' | 'family' | 'lifestyle';

const MOBILE_SECTION_TABS: Array<{ key: MobileTabKey; label: string; sectionId: string }> = [
  { key: 'overview', label: 'Overview', sectionId: 'profile-overview' },
  { key: 'photos', label: 'Photos', sectionId: 'profile-photos' },
  { key: 'about', label: 'About', sectionId: 'profile-about' },
  { key: 'family', label: 'Family', sectionId: 'profile-family' },
  { key: 'lifestyle', label: 'Life', sectionId: 'profile-lifestyle' },
];

const PROFILE_SECTION_TABS: Array<{ key: MobileTabKey; label: string; sectionId: string }> = [
  { key: 'overview', label: 'Overview', sectionId: 'profile-overview' },
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
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

function buildPersonalityTraits(profile: ProfileDetail): string[] {
  const traits: string[] = [];

  const diet = profile.lifestyle?.dietaryPreferences?.toLowerCase();
  if (diet === 'vegetarian') traits.push('🌿 Vegetarian');
  else if (diet === 'vegan') traits.push('🥗 Vegan');
  else if (diet) traits.push(`🍽️ ${formatEnum(diet)}`);

  const smoking = profile.lifestyle?.smokingHabits?.toLowerCase();
  if (smoking === 'non_smoker' || smoking === 'non-smoker' || smoking === 'never')
    traits.push('🚭 Non-smoker');
  else if (smoking === 'smoker') traits.push('🚬 Smoker');

  const drinking = profile.lifestyle?.drinkingHabits?.toLowerCase();
  if (drinking === 'non_drinker' || drinking === 'never' || drinking === 'no')
    traits.push('🍵 Non-drinker');

  const familyValues = profile.family?.familyValues?.toLowerCase();
  if (familyValues === 'traditional') traits.push('🏡 Traditional values');
  else if (familyValues === 'moderate') traits.push('⚖️ Moderate values');
  else if (familyValues === 'liberal') traits.push('🌍 Liberal mindset');

  if (profile.family?.familyType?.toLowerCase().includes('joint')) traits.push('👨‍👩‍👧‍👦 Joint family');
  if (profile.family?.familyType?.toLowerCase().includes('nuclear'))
    traits.push('🏠 Nuclear family');

  if (profile.religion?.languagesSpoken && profile.religion.languagesSpoken.length > 1) {
    traits.push(`💬 ${profile.religion.languagesSpoken.length} languages`);
  }

  if (profile.location?.visaStatus?.toLowerCase().includes('citizen'))
    traits.push('🇦🇺 Australian citizen');
  else if (profile.location?.visaStatus?.toLowerCase().includes('pr'))
    traits.push('🇦🇺 Permanent resident');

  return traits.slice(0, 6);
}

function buildInterestGroups(profile: ProfileDetail) {
  const all = [...(profile.about?.hobbies ?? []), ...(profile.about?.interests ?? [])].filter(
    Boolean,
  );

  const cultureTerms = [
    'music',
    'classical',
    'bollywood',
    'movies',
    'art',
    'culture',
    'reading',
    'books',
    'writing',
    'poetry',
    'theatre',
    'dance',
  ];
  const outdoorTerms = [
    'hiking',
    'travel',
    'trekking',
    'sports',
    'cricket',
    'football',
    'gym',
    'yoga',
    'fitness',
    'cycling',
    'swimming',
    'running',
  ];
  const foodTerms = ['cooking', 'baking', 'food', 'restaurants', 'cuisine', 'chef'];
  const techTerms = ['technology', 'coding', 'programming', 'gaming', 'photography'];

  type GroupKey =
    | 'Culture & Arts'
    | 'Outdoor & Sport'
    | 'Food & Lifestyle'
    | 'Tech & Creative'
    | 'Other Passions';
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
    <div className="rounded-lg bg-brand-ivory px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-brand-charcoal">{value || 'Not shared'}</p>
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
        tone === 'burgundy' && 'bg-brand-maroon/12 text-brand-maroon',
        tone === 'gold' && 'bg-brand-gold/12 text-brand-gold',
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
          'rounded-[30px] border border-brand-maroon/10 bg-white p-5 shadow-[0_18px_50px_rgba(161,14,77,0.05)] sm:p-6',
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
    <div className="min-h-screen bg-brand-ivory text-brand-charcoal font-poppins">
      <div className="print:hidden">
        <PublicHeader />
      </div>
      <main className="mx-auto container px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:m-0">
        {children}
      </main>
      <div className="print:hidden">
        <PublicFooter />
      </div>
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
        <span className="text-base font-bold text-brand-charcoal leading-none">{score}%</span>
        {label && (
          <span className="mt-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </span>
        )}
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
      <DialogContent className="overflow-hidden bg-brand-charcoal p-0 text-white">
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
      <h2 className="text-sm font-bold text-brand-charcoal">Gallery</h2>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {gallery.length > 0 ? (
            <>
              <motion.button
                type="button"
                onClick={() => setLightboxUrl(gallery[0]?.assetUrl ?? null)}
                className="group relative aspect-[4/4.8] overflow-hidden rounded-[28px] border border-brand-maroon/10 bg-[#FFF0F3]"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={gallery[0]!.thumbnailUrl ?? gallery[0]!.assetUrl}
                  alt={`${profile.personal?.firstName ?? 'Vivah member'} profile photo`}
                  fill
                  sizes="(min-width: 1280px) 40vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-brand-charcoal/70 to-transparent px-5 py-4 text-left text-white">
                  <div>
                    <p className="text-sm font-semibold">Primary photo</p>
                    <p className="text-xs text-white/70">Tap to view full size</p>
                  </div>
                  <ToneBadge tone="gold">
                    <ImageIcon className="size-3.5" />
                    Gallery
                  </ToneBadge>
                </div>
              </motion.button>

              {gallery.length > 1 ? (
                <div className="grid grid-cols-3 gap-3">
                  {gallery.slice(1, 4).map((photo, index) => (
                    <motion.button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxUrl(photo.assetUrl)}
                      className="group relative aspect-[4/4.6] overflow-hidden rounded-[22px] border border-brand-maroon/10 bg-[#FFF0F3]"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Image
                        src={photo.thumbnailUrl ?? photo.assetUrl}
                        alt={`Gallery photo ${index + 2}`}
                        fill
                        sizes="(min-width: 768px) 20vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </motion.button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid min-h-[340px] place-items-center rounded-[28px] border border-dashed border-brand-gold/40 bg-[linear-gradient(135deg,#FFF9F5_0%,#FFF0F3_100%)] p-8 text-center">
              <div>
                <ImageOff className="mx-auto size-10 text-brand-gold" />
                <p className="mt-4 text-lg font-semibold text-brand-charcoal">
                  No public gallery yet
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  This member has not added public gallery photos yet, but you can still review
                  their trust signals, compatibility, and request access to private photos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <motion.div
            className="rounded-[28px] border border-brand-maroon/10 bg-brand-ivory p-5"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
              First impression
            </p>
            <p className="mt-3 text-lg font-semibold text-brand-charcoal">
              Gallery access works best once the basics already feel promising.
            </p>
            <p className="mt-3 text-sm leading-7 text-gray-500">
              Use the compatibility and trust signals above to decide whether this feels like a
              serious introduction, then request more photos if you want to go deeper.
            </p>
          </motion.div>

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
    const isCookieBased = token === 'cookie-based';
    return fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: isCookieBased ? 'include' : 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(!isCookieBased && token ? { Authorization: `Bearer ${token}` } : {}),
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
      <div className="rounded-[28px] border border-dashed border-brand-gold/50 bg-white p-6 text-center">
        <Lock className="mx-auto size-8 text-brand-gold" />
        <p className="mt-4 text-lg font-semibold text-brand-charcoal">Sign in for private photos</p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Private gallery access is only available to signed-in members so photo sharing stays in
          the member community.
        </p>
      </div>
    );
  }

  if (loadingStatus) {
    return (
      <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-gray-500">Checking gallery access...</p>
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
            <span className="text-xs font-medium text-gray-500">
              Until {formatDate(requestStatus.accessGrantedUntil)}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          You can now view the private gallery that {profileName} chose to share with you.
        </p>

        {loadingPhotos ? (
          <p className="mt-4 text-sm text-gray-500">Loading private photos...</p>
        ) : photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {photos.slice(0, 4).map((photo) => (
              <motion.button
                key={photo.id}
                type="button"
                onClick={() => onPreviewPhoto(photo.assetUrl)}
                className="relative overflow-hidden rounded-[20px] border border-brand-maroon/10"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18 }}
              >
                <Image
                  src={photo.thumbnailUrl ?? photo.videoPosterUrl ?? photo.assetUrl}
                  alt="Private gallery photo"
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                  className="object-cover transition duration-300 hover:scale-105"
                  onContextMenu={(event) => event.preventDefault()}
                />
                <span className="block aspect-[4/4.6]" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-full bg-brand-charcoal/70 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  Private
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-brand-gold/40 bg-brand-ivory p-4 text-sm text-gray-500">
            No private photos have been added yet.
          </div>
        )}
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="rounded-[28px] border border-brand-gold/30 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFF9F5_100%)] p-5 text-center">
        <Clock3 className="mx-auto size-8 text-brand-gold" />
        <p className="mt-4 text-lg font-semibold text-brand-charcoal">
          Private photo request pending
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Your request is waiting for a response. We will surface the private gallery here if access
          is granted.
        </p>
        {feedback ? (
          <p className="mt-3 text-sm font-semibold text-brand-maroon">{feedback}</p>
        ) : null}
        <div className="mt-4 flex justify-center">
          <PremiumButton
            variant="secondary"
            onClick={() => void handleWithdraw()}
            disabled={sending}
          >
            <X className="size-4" />
            Withdraw request
          </PremiumButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-dashed border-brand-gold/50 bg-white p-5">
      <div className="text-center">
        <Lock className="mx-auto size-8 text-brand-maroon/50" />
        <p className="mt-4 text-lg font-semibold text-brand-charcoal">Private gallery</p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Ask for access if you want to see more photos after the profile already feels promising.
        </p>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl bg-[#FFF0F3] px-4 py-3 text-center text-sm font-semibold text-brand-maroon">
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
            className="w-full rounded-2xl border border-brand-maroon/20 bg-brand-ivory px-4 py-3 text-sm text-brand-charcoal outline-none transition focus:border-brand-maroon focus:ring-4 focus:ring-[#FFF0F3]"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumButton
              onClick={() => void handleSendRequest()}
              disabled={sending}
              className="w-full"
            >
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

// ─── Audio/Video Intro Placeholder ──────────────────────────────────────────

function IntroMediaPlaceholder({
  videoUrl,
  posterUrl,
}: Readonly<{ firstName?: string; videoUrl?: string; posterUrl?: string }>) {
  if (!videoUrl) return null;
  return (
    <div className="rounded-[26px] border border-brand-maroon/10 bg-white p-4 shadow-[0_12px_30px_rgba(161,14,77,0.05)] overflow-hidden flex flex-col items-start">
      <p className="text-sm font-semibold text-brand-charcoal mb-3">Video Introduction</p>
      <video
        src={videoUrl}
        poster={posterUrl}
        controls
        className="w-full aspect-video rounded-2xl border border-brand-maroon/10 bg-black"
      />
    </div>
  );
}

// ─── Family & Future Goals Section ──────────────────────────────────────────

function FamilyFutureSection({ profile }: Readonly<{ profile: ProfileDetail }>) {
  const hasContent =
    profile.family?.familyValues ||
    profile.family?.familyType ||
    profile.about?.partnerExpectations;

  const narrativeParts: string[] = [];
  const firstName = profile.personal?.firstName;

  if (profile.family?.familyValues) {
    narrativeParts.push(
      `${firstName ?? 'They'} describe their family orientation as ${profile.family.familyValues.toLowerCase()}`,
    );
  }
  if (profile.family?.familyType) {
    narrativeParts.push(
      `preferring a ${profile.family.familyType.toLowerCase().replace('_', ' ')} family setup`,
    );
  }
  if (profile.location?.city || profile.location?.state) {
    narrativeParts.push(`and are based in ${profile.location.city ?? profile.location.state}`);
  }

  const narrative = narrativeParts.join(', ') + (narrativeParts.length > 0 ? '.' : '');

  return (
    <ProfileSurface>
      <div id="profile-family" className="scroll-mt-36">
        <h2 className="text-sm font-bold text-brand-charcoal">Family &amp; future</h2>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {hasContent ? (
            <div className="rounded-[28px] border-l-4 border-brand-maroon bg-brand-ivory p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                Their family story
              </p>
              {narrative && (
                <p className="mt-4 text-base leading-8 text-brand-charcoal font-medium italic">
                  "{narrative}"
                </p>
              )}
              {profile.about?.partnerExpectations && (
                <>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                    In their words
                  </p>
                  <p className="mt-2 text-sm leading-7 text-brand-charcoal">
                    {profile.about.partnerExpectations}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-brand-gold/40 bg-brand-ivory p-5 text-sm leading-6 text-gray-500">
              Family and future goals have not been shared in detail yet.
            </div>
          )}

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                Family background
              </p>
              <div className="mt-4 grid gap-3">
                <DetailField label="Family values" value={profile.family?.familyValues} />
                <DetailField label="Family type" value={profile.family?.familyType} />
                {profile.family?.fatherDetails && (
                  <DetailField label="Father's background" value={profile.family.fatherDetails} />
                )}
                {profile.family?.motherDetails && (
                  <DetailField label="Mother's background" value={profile.family.motherDetails} />
                )}
                {profile.family?.siblingDetails && (
                  <DetailField label="Siblings" value={profile.family.siblingDetails} />
                )}
              </div>
            </div>

            {/* Partner preference chips */}
            {(profile.partnerPreference?.ageMin ||
              profile.partnerPreference?.ageMax ||
              (profile.partnerPreference?.communities?.length ?? 0) > 0) && (
              <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                  What they imagine
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.partnerPreference?.ageMin || profile.partnerPreference?.ageMax ? (
                    <ToneBadge tone="burgundy">
                      <Heart className="size-3.5" />
                      Age {profile.partnerPreference?.ageMin ?? '?'}–
                      {profile.partnerPreference?.ageMax ?? '?'}
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
      const isCookieBased = accessToken === 'cookie-based';
      const response = await fetch(`${apiBaseUrl}${path}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: accessToken && !isCookieBased ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.status === 401 && accessToken && !isCookieBased) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return fetchJson<T>(path, refreshedToken);
        }
      }

      return response;
    }

    async function load() {
      setState({ status: 'loading' });

      const profileResponse = await fetchJson<PublicProfileResponse>(
        `/api/profiles/${profileId}`,
        token,
      );

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
        responsivenessLabel: profileData.responsivenessLabel,
      });

      if (token) {
        const viewerResponse = await fetchJson<{ profile?: ViewerProfile }>(
          '/api/me/profile',
          token,
        );
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
      responsivenessLabel={state.responsivenessLabel}
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
  responsivenessLabel,
}: Readonly<{
  profile: ProfileDetail;
  profileId: string;
  token: string | null;
  viewerProfile: ViewerProfile | null;
  matchScore?: number | undefined;
  matchReasons?: string[] | undefined;
  isPremiumProfile?: boolean | undefined;
  responsivenessLabel?: string | undefined;
}>) {
  const actionProfileId = profile._id ?? profileId;
  const isSelfView = !!(
    viewerProfile &&
    ((viewerProfile._id && viewerProfile._id === profile._id) ||
      (viewerProfile.displayId && viewerProfile.displayId === profile.displayId) ||
      (viewerProfile.slug && viewerProfile.slug === profileId))
  );
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabKey>('overview');
  const [biodataLoading, setBiodataLoading] = useState(false);
  const [biodataError, setBiodataError] = useState<string | null>(null);

  async function handleDownloadBiodata() {
    if (!token) {
      setBiodataError('Sign in to download a biodata.');
      return;
    }
    setBiodataLoading(true);
    setBiodataError(null);
    try {
      const isCookieBased = token === 'cookie-based';
      const res = await fetch(`${apiBaseUrl}/api/profiles/${actionProfileId}/biodata.pdf`, {
        credentials: 'include',
        headers: token && !isCookieBased ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setBiodataError(text || 'Failed to generate biodata. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biodata-${firstName?.toLowerCase() ?? profile.displayId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setBiodataError('Unable to download biodata right now. Please try again.');
    } finally {
      setBiodataLoading(false);
    }
  }

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
  const compatibilityHighlights = useMemo(
    () => splitCompatibilityRows(compatibilityRows),
    [compatibilityRows],
  );
  const personalityTraits = useMemo(() => buildPersonalityTraits(profile), [profile]);
  const interestGroups = useMemo(() => buildInterestGroups(profile), [profile]);
  const primaryPhotoUrl = profile.photoUrl ?? profile.publicGallery?.[0]?.assetUrl ?? null;
  const membershipLabel = isPremiumProfile ? 'Premium member' : 'Vivah member';
  const overallScore =
    typeof matchScore === 'number'
      ? matchScore
      : Math.round(compatibilityRows.reduce((s, r) => s + r.score, 0) / compatibilityRows.length);
  const compatibilityHeadline = getCompatibilityHeadline(overallScore);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const current = MOBILE_SECTION_TABS.find((tab) => {
            const element = document.getElementById(tab.sectionId);
            if (!element) {
              return false;
            }

            const rect = element.getBoundingClientRect();
            return rect.top <= 190 && rect.bottom > 190;
          });

          if (current) {
            setActiveMobileTab((prev) => {
              if (prev !== current.key) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                  const activeTabEl = document.querySelector(`[data-state="active"]`);
                  if (activeTabEl) {
                    activeTabEl.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'center',
                    });
                  }
                }, 100);
                return current.key;
              }
              return prev;
            });
          }
          ticking = false;
        });
        ticking = true;
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
      <article className="grid gap-6 pb-28 lg:pb-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="grid gap-6">
          <motion.div
            {...fadeInUp}
            className="rounded-[26px] border border-brand-maroon/10 bg-white/90 px-5 py-4 shadow-[0_14px_32px_rgba(122,31,43,0.06)] backdrop-blur"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <a
                  href="/member/matches"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-maroon/10 bg-brand-ivory px-3 py-1.5 font-medium text-brand-maroon transition hover:border-brand-maroon/20 hover:bg-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to matches
                </a>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-ivory px-3 py-1.5 font-medium text-brand-charcoal">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold">
                    Profile ID
                  </span>
                  {profile.displayId}
                </span>
              </div>
            </div>
          </motion.div>

          {isSelfView && (
            <div className="flex items-center justify-between rounded-xl border border-[#A10E4D]/20 bg-[#FFF0F3] px-4 py-2.5">
              <p className="text-xs font-semibold text-[#A10E4D]">
                This is how your profile appears to others
              </p>
              <Link
                href="/member/profile/edit"
                className="text-xs font-bold text-[#A10E4D] underline"
              >
                Edit profile
              </Link>
            </div>
          )}

          {/* ── Section 1: Cinematic Hero ────────────────────────────────── */}
          <motion.section
            id="profile-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <PremiumCard className="overflow-hidden rounded-[34px] border border-brand-maroon/10 bg-white p-0 shadow-[0_28px_80px_rgba(122,31,43,0.12)]">
              <div className="grid xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
                {/* Photo Panel */}
                <div className="relative rounded-[28px] min-h-[320px] overflow-hidden bg-[linear-gradient(145deg,#A10E4D_0%,#6B0C32_45%,#D4A04C_100%)]">
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
                      <span
                        className={cx(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                          'bg-white/15 backdrop-blur text-white border border-white/20',
                        )}
                      >
                        <Sparkles className="size-3.5" />
                        {membershipLabel}
                      </span>
                      <span
                        className={cx(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                          'bg-[#1F6F4A]/80 backdrop-blur text-white border border-[#1F6F4A]/30',
                        )}
                      >
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
                  <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-brand-gold/8 blur-3xl pointer-events-none" />

                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">
                      Profile {profile.displayId}
                    </p>

                    <h1 className="mt-3 font-playfair text-3xl font-semibold leading-tight text-brand-charcoal sm:text-4xl">
                      {fullName}
                    </h1>

                    <p className="mt-3 text-base leading-7 text-gray-500">
                      {heroSummary || 'Premium matrimonial profile — Australia'}
                    </p>

                    {/* Match score ring + completion */}
                    <div className="mt-6">
                      <div className="rounded-[28px] border border-brand-maroon/10 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFF9F5_100%)] px-5 py-4">
                        <div className="flex items-center gap-4">
                          <ScoreRing
                            score={overallScore}
                            size={96}
                            strokeWidth={9}
                            color="#A10E4D"
                            label="Match"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold">
                              Compatibility score
                            </p>
                            <p className="mt-1 text-base font-semibold text-brand-charcoal">
                              {compatibilityHeadline}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-gray-500">
                              Built from the same profile signals used in match ranking, including
                              lifestyle, family values, education, career, location, and community
                              fit.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                          Strongest alignment
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {compatibilityHighlights.strongest.map((row) => (
                            <ToneBadge key={`strong-${row.label}`} tone="emerald">
                              {row.icon}
                              {row.label} {row.score}%
                            </ToneBadge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-[#D4A04C]/30 bg-[#FFF8EC] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8B6714]">
                          Worth discussing early
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {compatibilityHighlights.discuss.map((row) => (
                            <ToneBadge key={`discuss-${row.label}`} tone="gold">
                              {row.icon}
                              {row.label} {row.score}%
                            </ToneBadge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Match reason tags */}
                    {matchReasons?.length ? (
                      <div className="mt-6 grid gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                          Why you match
                        </p>
                        <p className="text-xs text-gray-500">
                          These reasons come directly from the ranking rules used for your match
                          score.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchReasons.slice(0, 3).map((reason) => (
                            <ToneBadge key={reason} tone="emerald">
                              <HeartHandshake className="size-3.5" />
                              {reason}
                            </ToneBadge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {responsivenessLabel ? (
                      <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                          Response style
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <ToneBadge tone="emerald" size="md">
                            <CheckCircle2 className="size-4" />
                            {responsivenessLabel}
                          </ToneBadge>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-emerald-800/80">
                          Based on how consistently this member replies to introductions they
                          receive.
                        </p>
                      </div>
                    ) : null}

                    {/* Personality trait pills */}
                    {personalityTraits.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                          At a glance
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {personalityTraits.slice(0, 3).map((trait) => (
                            <span
                              key={trait}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-ivory px-3 py-1.5 text-xs font-semibold text-brand-charcoal border border-brand-maroon/8"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hero CTAs */}
                    <div className="mt-6 hidden sm:flex items-end gap-2">
                      <div className="rounded-[28px] border border-brand-maroon/10 bg-white px-5 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold">
                          Profile completion
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-brand-charcoal">
                          {profile.completionPercentage}%
                        </p>
                        <Progress className="mt-2" value={profile.completionPercentage} />
                        <p className="mt-1.5 text-xs text-gray-500">
                          More complete profiles build trust faster
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        {isSelfView && (
                          <Link
                            href="/member/profile/edit"
                            className="inline-flex items-center gap-2 rounded-full bg-[#A10E4D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#890B40]"
                          >
                            Edit your profile
                          </Link>
                        )}
                        <button
                          onClick={() => void handleDownloadBiodata()}
                          disabled={biodataLoading}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-[#A10E4D] transition hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Camera className="size-4" />
                          {biodataLoading ? 'Generating...' : 'Download Biodata'}
                        </button>
                      </div>
                      {biodataError && (
                        <p className="rounded-xl bg-white/15 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-sm">
                          {biodataError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.section>

          <ProfileSurface>
            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                    Compatibility breakdown
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-brand-charcoal">
                    See what is driving this match
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    This is a profile-comparison estimate across six areas. It is meant to start
                    better conversations, not make the decision for you.
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full border border-brand-maroon/10 bg-brand-ivory px-4 py-2 text-sm font-semibold text-brand-charcoal">
                  <ScoreRing score={overallScore} size={54} strokeWidth={4} color="#A10E4D" />
                  <span>{overallScore}% overall fit</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {compatibilityRows.map((row) => (
                  <div
                    key={row.label}
                    className={cx(
                      'rounded-[24px] border p-4 shadow-[0_10px_30px_rgba(161,14,77,0.04)]',
                      row.accent === 'emerald' && 'border-emerald-200 bg-emerald-50/60',
                      row.accent === 'gold' && 'border-[#E8CF92] bg-[#FFF8EC]',
                      row.accent === 'burgundy' && 'border-brand-maroon/12 bg-[#FFF6F8]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cx(
                            'grid size-9 place-items-center rounded-full',
                            row.accent === 'emerald' && 'bg-emerald-100 text-emerald-700',
                            row.accent === 'gold' && 'bg-[#FFF2CD] text-[#8B6714]',
                            row.accent === 'burgundy' && 'bg-[#FFF0F3] text-brand-maroon',
                          )}
                        >
                          {row.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-charcoal">{row.label}</p>
                          <p className="text-xs text-gray-500">{row.score}% alignment</p>
                        </div>
                      </div>
                    </div>
                    {/* <p className="mt-3 text-sm leading-6 text-gray-600">{row.summary}</p> */}
                  </div>
                ))}
              </div>
            </div>
          </ProfileSurface>

          <div className="sticky top-4 z-20 hidden md:block print:hidden">
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
              <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.18 }}>
                <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-[24px] border border-brand-maroon/10 bg-white/95 px-2 py-2 shadow-[0_14px_30px_rgba(122,31,43,0.10)] backdrop-blur">
                  {PROFILE_SECTION_TABS.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>
            </Tabs>
          </div>

          {/* ── Mobile Sticky Tabs ───────────────────────────────────────── */}
          <div className="sticky top-20 z-20 -mx-4 px-4 md:hidden print:hidden">
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
              <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.18 }}>
                <TabsList className="w-full bg-white/95 shadow-[0_14px_30px_rgba(122,31,43,0.10)] backdrop-blur overflow-x-auto">
                  {MOBILE_SECTION_TABS.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>
            </Tabs>
          </div>

          {/* ── Section 2: Gallery ───────────────────────────────────────── */}
          <div id="profile-photos" className="scroll-mt-36">
            <GalleryExperienceSection profile={profile} profileId={actionProfileId} token={token} />
          </div>

          {/* ── Section 4: About & Personality ──────────────────────────── */}
          <ProfileSurface>
            <div id="profile-about" className="scroll-mt-36">
              <h2 className="text-sm font-bold text-brand-charcoal">About</h2>

              {/* About me pull-quote */}
              {profile.about?.aboutMe && (
                <div className="mt-6 rounded-[28px] border-l-4 border-brand-gold bg-[linear-gradient(135deg,#FFF8EC_0%,#FFFFFF_100%)] p-6">
                  <Quote className="size-6 text-brand-gold mb-3 opacity-60" />
                  <p className="text-base leading-8 text-brand-charcoal font-medium italic">
                    "{profile.about.aboutMe}"
                  </p>
                </div>
              )}

              {/* Interest groups */}
              {interestGroups.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {interestGroups.map((group) => (
                    <div
                      key={group.label}
                      className="rounded-[24px] border border-brand-maroon/10 bg-white p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                        {group.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.items.map((item, i) => (
                          <ToneBadge key={`${item}-${i}`} tone="emerald">
                            <Sparkles className="size-3" />
                            {item}
                          </ToneBadge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !(profile.about?.hobbies?.length || profile.about?.interests?.length) ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-brand-gold/40 bg-brand-ivory p-4 text-sm text-gray-500">
                  No hobbies or interests shared yet.
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-2">
                  {Array.from(
                    new Set([
                      ...(profile.about?.hobbies ?? []),
                      ...(profile.about?.interests ?? []),
                    ]),
                  )
                    .filter(Boolean)
                    .slice(0, 10)
                    .map((item, i) => (
                      <ToneBadge key={`${item}-${i}`} tone="emerald">
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
                <DetailField
                  label="Based in"
                  value={profile.location?.city ?? profile.location?.state}
                />
              </div>

              {(profile.compatibility?.valuesPrompt ||
                profile.compatibility?.relationshipVision ||
                profile.compatibility?.relationshipPace ||
                profile.compatibility?.familyInvolvement) && (
                <div className="mt-6 rounded-[24px] border border-brand-maroon/10 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                    Compatibility cues
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailField
                      label="Relationship pace"
                      value={formatEnum(profile.compatibility?.relationshipPace)}
                    />
                    <DetailField
                      label="Family involvement"
                      value={formatEnum(profile.compatibility?.familyInvolvement)}
                    />
                    <DetailField
                      label="Communication style"
                      value={formatEnum(profile.compatibility?.communicationStyle)}
                    />
                    <DetailField
                      label="Conflict approach"
                      value={formatEnum(profile.compatibility?.conflictApproach)}
                    />
                  </div>
                  {profile.compatibility?.valuesPrompt ? (
                    <p className="mt-4 text-sm leading-7 text-brand-charcoal">
                      <span className="font-semibold">Values:</span>{' '}
                      {profile.compatibility.valuesPrompt}
                    </p>
                  ) : null}
                  {profile.compatibility?.relationshipVision ? (
                    <p className="mt-3 text-sm leading-7 text-brand-charcoal">
                      <span className="font-semibold">Relationship vision:</span>{' '}
                      {profile.compatibility.relationshipVision}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Video intro — only if recorded */}
              {profile.videoUrl && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold mb-4">
                    Video introduction
                  </p>
                  <IntroMediaPlaceholder
                    videoUrl={profile.videoUrl}
                    {...(profile.videoPosterUrl ? { posterUrl: profile.videoPosterUrl } : {})}
                  />
                </div>
              )}
            </div>
          </ProfileSurface>

          {/* ── Section 5: Family & Future Goals ────────────────────────── */}
          <FamilyFutureSection profile={profile} />

          {/* ── Section 6: Lifestyle & Education Biodata ───────────────── */}
          <ProfileSurface>
            <div id="profile-lifestyle" className="scroll-mt-36">
              <h2 className="text-sm font-bold text-brand-charcoal">Lifestyle &amp; background</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sun className="size-4 text-brand-gold" />
                    <p className="text-sm font-semibold text-brand-charcoal">Lifestyle</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField
                      label="Diet"
                      value={formatEnum(profile.lifestyle?.dietaryPreferences)}
                    />
                    <DetailField
                      label="Smoking"
                      value={formatEnum(profile.lifestyle?.smokingHabits)}
                    />
                    <DetailField
                      label="Drinking"
                      value={formatEnum(profile.lifestyle?.drinkingHabits)}
                    />
                    {profile.lifestyle?.religiousPractices && (
                      <DetailField
                        label="Religious practices"
                        value={formatEnum(profile.lifestyle.religiousPractices)}
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="size-4 text-brand-gold" />
                    <p className="text-sm font-semibold text-brand-charcoal">Education & career</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField
                      label="Education"
                      value={profile.education?.highestQualification}
                    />
                    <DetailField label="Occupation" value={profile.employment?.occupation} />
                    <DetailField label="Industry" value={profile.employment?.industry} />
                    <DetailField label="Employer" value={profile.employment?.employerName} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="size-4 text-brand-gold" />
                    <p className="text-sm font-semibold text-brand-charcoal">Personal details</p>
                  </div>
                  <div className="grid gap-3">
                    <DetailField label="Gender" value={formatEnum(profile.personal?.gender)} />
                    <DetailField
                      label="Marital status"
                      value={formatEnum(profile.personal?.maritalStatus)}
                    />
                    <DetailField
                      label="Height"
                      value={
                        profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined
                      }
                    />
                    <DetailField
                      label="Languages"
                      value={joinList(profile.religion?.languagesSpoken)}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-brand-maroon/10 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="size-4 text-brand-gold" />
                    <p className="text-sm font-semibold text-brand-charcoal">Location</p>
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
        </div>

        {/* ── Sidebar (desktop) ────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div
            className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            <ProfileSurface className="p-0">
              <div className="rounded-[30px] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9F5_100%)] p-5 space-y-4">
                {/* Self-view banner */}
                {isSelfView && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                      Your public profile
                    </p>
                    <p className="mt-1.5 text-sm text-gray-500">
                      Keep your profile complete to attract better matches.
                    </p>
                  </div>
                )}

                {/* Compatibility score */}
                <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#FFF0F3,#FFF9F5)] border border-brand-maroon/8 px-4 py-3">
                  <ScoreRing score={overallScore} size={48} strokeWidth={4} color="#A10E4D" />
                  <div>
                    <p className="text-sm font-semibold text-brand-charcoal">
                      {overallScore}% compatible
                    </p>
                    <p className="text-xs text-gray-500">
                      Best alignment:{' '}
                      {compatibilityHighlights.strongest
                        .map((row) => row.label)
                        .slice(0, 2)
                        .join(' and ')}
                      .
                    </p>
                  </div>
                </div>

                {/* Quick details — 2-col chip grid */}
                <div className="border-t border-brand-maroon/8 pt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {profile.personal?.age && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-brand-maroon">
                        <Heart className="size-2.5" />
                      </span>
                      <span className="text-xs text-brand-charcoal truncate">
                        {profile.personal.age} yrs old
                      </span>
                    </div>
                  )}
                  {profile.location?.city && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-brand-maroon">
                        <MapPin className="size-2.5" />
                      </span>
                      <span className="text-xs text-brand-charcoal truncate">
                        {profile.location.city}
                        {profile.location.state ? `, ${profile.location.state}` : ''}
                      </span>
                    </div>
                  )}
                  {profile.employment?.occupation && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-brand-maroon">
                        <Briefcase className="size-2.5" />
                      </span>
                      <span className="text-xs text-brand-charcoal truncate">
                        {profile.employment.occupation}
                      </span>
                    </div>
                  )}
                  {profile.education?.highestQualification && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-brand-maroon">
                        <GraduationCap className="size-2.5" />
                      </span>
                      <span className="text-xs text-brand-charcoal truncate">
                        {profile.education.highestQualification}
                      </span>
                    </div>
                  )}
                  {profile.religion?.religion && (
                    <div className="flex items-center gap-2 min-w-0 col-span-2">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-brand-maroon">
                        <Star className="size-2.5" />
                      </span>
                      <span className="text-xs text-brand-charcoal truncate">
                        {profile.religion.religion}
                        {profile.religion.community ? ` · ${profile.religion.community}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-brand-maroon/8 pt-3 space-y-2">
                  {isSelfView ? (
                    <Link
                      href="/member/profile/edit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#A10E4D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#890B40]"
                    >
                      Edit your profile
                    </Link>
                  ) : (
                    <>
                      <ProfileActions profileId={actionProfileId} stacked />
                      <PremiumButton href="/member/messages" variant="secondary" className="w-full">
                        <MessageSquareText className="size-4" />
                        Send a message
                      </PremiumButton>
                    </>
                  )}
                </div>
              </div>
            </ProfileSurface>
          </div>
        </aside>

        {/* ── Mobile Sticky Action Bar ─────────────────────────────────── */}
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-maroon/10 bg-white/95 shadow-[0_-14px_40px_rgba(122,31,43,0.12)] backdrop-blur lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
          <div className="mx-auto max-w-5xl px-4 py-2">
            {/* Mini profile info */}
            <div className="flex items-center gap-3 mb-2">
              {primaryPhotoUrl ? (
                <div className="relative size-8 overflow-hidden rounded-full border-2 border-brand-maroon/20 shrink-0">
                  <Image
                    src={primaryPhotoUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-maroon text-white text-sm font-bold">
                  {(firstName ?? 'V').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-charcoal">{fullName}</p>
                <p className="text-xs text-gray-500">{overallScore}% match</p>
              </div>
            </div>
            <div className="grid gap-2">
              {isSelfView ? (
                <Link
                  href="/member/profile/edit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#A10E4D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#890B40]"
                >
                  Edit your profile
                </Link>
              ) : (
                <>
                  <ProfileActions profileId={actionProfileId} compact />
                  <PremiumButton href="/member/messages" variant="secondary" className="w-full">
                    <MessageSquareText className="size-4" />
                    Message
                  </PremiumButton>
                </>
              )}
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
        <PremiumCard className="overflow-hidden rounded-[32px] border border-brand-maroon/10 p-0">
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                Private profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-brand-charcoal">
                Sign in to view this member
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-500">
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-brand-charcoal">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-gray-500">{message}</p>
        </PremiumCard>
      </motion.section>
    </StaticProfileLayout>
  );
}
