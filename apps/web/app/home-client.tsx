'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Headset,
  Heart,
  LockKeyhole,
  MapPin,
  ScanFace,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { FAQAccordion, PremiumButton, PublicFooter, PublicHeader } from '@/app/components';
import type {
  CmsSection,
  FeaturedProfile,
  HomeContent,
  PublicContentItem,
  PublicPlan,
} from '@/lib/public-api';

/* ─── Static data ────────────────────────────────────────────────────────── */

const homepageFallbackOrder = [
  { key: 'hero' },
  { key: 'stats' },
  { key: 'success-stories' },
  { key: 'how-it-works' },
  { key: 'verification' },
  { key: 'membership-cta' },
  { key: 'blog' },
  { key: 'faq' },
] as const;

const fallbackHowItWorks = [
  {
    step: '1',
    title: 'Create Profile',
    body: 'Build a polished profile that reflects your values, family background, and life goals.',
    icon: UserPlus,
  },
  {
    step: '2',
    title: 'Search & Match',
    body: 'Use thoughtful filters to discover serious introductions across Australia.',
    icon: Search,
  },
  {
    step: '3',
    title: 'Connect',
    body: 'Express interest and start respectful, trust-first conversations at your own pace.',
    icon: Heart,
  },
  {
    step: '4',
    title: 'Build Relationship',
    body: 'Move forward with confidence through verification, privacy controls, and family-friendly matchmaking.',
    icon: ShieldCheck,
  },
] as const;

const verificationFeatures = [
  {
    icon: BadgeCheck,
    label: 'Manual & AI Verified Profiles',
    desc: 'Every profile is reviewed by our team and cross-checked with AI.',
  },
  {
    icon: BriefcaseBusiness,
    label: 'ID, Visa & Employment Checks',
    desc: 'Multi-layer identity verification you can rely on.',
  },
  {
    icon: ScanFace,
    label: 'Facial Verification Available',
    desc: 'Optional selfie match for the highest trust tier.',
  },
  {
    icon: Headset,
    label: 'Australian-Based Support',
    desc: 'Real people, local time zones, fast responses.',
  },
  {
    icon: LockKeyhole,
    label: 'Privacy is Our Priority',
    desc: 'Granular controls so you decide who sees what.',
  },
] as const;

const fallbackFaqs = [
  {
    question: 'Is Vivah Australia free to join?',
    answer:
      'Yes. You can create your profile, browse introductions, and begin your journey before upgrading for direct communication and visibility benefits.',
  },
  {
    question: 'How does verification work?',
    answer:
      'Members can complete multiple trust checks including mobile, identity, address, employment, visa, and selfie verification for stronger credibility.',
  },
  {
    question: 'Can I control who sees my photos?',
    answer:
      'Yes. Photo privacy and visibility settings let you choose how widely your profile and images are shared.',
  },
  {
    question: 'When can members message each other?',
    answer:
      'Messaging is unlocked when a mutual connection is established and the conversation meets the current membership rules.',
  },
  {
    question: 'Can I report or block someone?',
    answer:
      'Yes. Trust and safety tools are built into the experience so you can report, block, or hide profiles whenever needed.',
  },
] as const;

const demoStories = [
  {
    title: 'Neha & Chirag',
    body: 'We found each other on Vivah Australia and today we are starting our beautiful journey together. Thank you Vivah Australia!',
    location: 'Melbourne, VIC',
    imageUrl: '/success-stories/couple-melbourne.jpg',
  },
  {
    title: 'Priya & Kunal',
    body: 'The verification process gave us confidence and the platform helped us find a truly compatible match.',
    location: 'Sydney, NSW',
    imageUrl: '/home/success-stories/couple-02.jpg',
  },
  {
    title: 'Anjali & Manish',
    body: 'A trustworthy platform with genuine profiles and great support from the Vivah Australia team.',
    location: 'Brisbane, QLD',
    imageUrl: '/success-stories/couple-brisbane.jpg',
  },
  {
    title: 'Riya & Arjun',
    body: 'The matches felt serious and family-oriented. We connected quickly and everything moved naturally from there.',
    location: 'Perth, WA',
    imageUrl: '/home/success-stories/couple-04.jpg',
  },
  {
    title: 'Meera & Rohan',
    body: 'Vivah Australia made the search respectful, simple, and safe for both our families.',
    location: 'Adelaide, SA',
    imageUrl: '/home/success-stories/couple-05.jpg',
  },
  {
    title: 'Isha & Dev',
    body: 'We appreciated the verified profiles and clear member details. It helped us focus on the right conversations.',
    location: 'Canberra, ACT',
    imageUrl: '/home/success-stories/couple-06.jpg',
  },
] as const;

const trustStats = [
  { value: 15000, suffix: '+', label: 'Verified Profiles', icon: BadgeCheck },
  { value: 5000, suffix: '+', label: 'Successful Matches', icon: Heart },
  { value: 50000, suffix: '+', label: 'Active Members', icon: Users },
  { value: 100, suffix: '%', label: 'Privacy Protected', icon: LockKeyhole },
  { value: null, suffix: '', display: 'Australia-wide', label: 'Indian Community Focus', icon: MapPin },
] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/* ─── Animated counter ───────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current.textContent = target.toLocaleString() + suffix;
      return;
    }
    const el = ref.current;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate() {
        el.textContent = Math.floor(obj.val).toLocaleString() + suffix;
      },
    });
  }, [inView, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Hero entrance helper ───────────────────────────────────────────────── */

function FadeUp({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Ambient floating decor ─────────────────────────────────────────────── */

type DecorItem = {
  kind: 'heart' | 'sparkle' | 'ring' | 'dot';
  left: string;
  top: string;
  size: number;
  delay: number;
  duration?: number;
};

function AmbientDecor({ items, tone = 'light' }: { items: readonly DecorItem[]; tone?: 'light' | 'dark' }) {
  const reduce = useReducedMotion();
  const heartColor = tone === 'dark' ? '#D4A04C' : '#E74C7C';
  const sparkleColor = '#D4A04C';

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className="absolute" style={{ left: it.left, top: it.top }}>
          <motion.div
            {...(reduce
              ? { style: { opacity: 0.25 } }
              : {
                  animate: {
                    y: [-10, 10, -10],
                    rotate: it.kind === 'sparkle' ? [0, 20, 0] : it.kind === 'ring' ? [0, 12, 0] : 0,
                    opacity: it.kind === 'dot' ? [0.15, 0.35, 0.15] : [0.2, 0.45, 0.2],
                  },
                  transition: {
                    duration: it.duration ?? 6,
                    repeat: Infinity,
                    ease: 'easeInOut' as const,
                    delay: it.delay,
                  },
                })}
          >
            {it.kind === 'heart' && (
              <Heart style={{ width: it.size, height: it.size, color: heartColor, fill: heartColor }} />
            )}
            {it.kind === 'sparkle' && (
              <Sparkles style={{ width: it.size, height: it.size, color: sparkleColor, fill: sparkleColor }} />
            )}
            {it.kind === 'ring' && (
              <div
                className="rounded-full border-2"
                style={{ width: it.size, height: it.size, borderColor: `${sparkleColor}66` }}
              />
            )}
            {it.kind === 'dot' && (
              <div
                className="rounded-full blur-[2px]"
                style={{
                  width: it.size,
                  height: it.size,
                  background: tone === 'dark' ? 'rgba(247,216,138,0.5)' : 'rgba(212,160,76,0.45)',
                }}
              />
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

const heroDecor: readonly DecorItem[] = [
  { kind: 'heart', left: '6%', top: '16%', size: 16, delay: 0 },
  { kind: 'sparkle', left: '16%', top: '10%', size: 14, delay: 1.1, duration: 7 },
  { kind: 'ring', left: '4%', top: '38%', size: 26, delay: 0.5, duration: 8 },
  { kind: 'dot', left: '11%', top: '55%', size: 10, delay: 1.8 },
  { kind: 'heart', left: '3%', top: '72%', size: 20, delay: 0.7 },
  { kind: 'sparkle', left: '14%', top: '84%', size: 12, delay: 2.2, duration: 7.5 },
  { kind: 'dot', left: '42%', top: '14%', size: 8, delay: 0.3 },
  { kind: 'heart', left: '46%', top: '30%', size: 11, delay: 1.5 },
  { kind: 'ring', left: '44%', top: '58%', size: 18, delay: 2.6, duration: 9 },
  { kind: 'sparkle', left: '40%', top: '76%', size: 15, delay: 0.9, duration: 6.5 },
  { kind: 'dot', left: '24%', top: '26%', size: 12, delay: 2.9 },
  { kind: 'heart', left: '30%', top: '90%', size: 13, delay: 1.3 },
] as const;

const lightSectionDecor: readonly DecorItem[] = [
  { kind: 'heart', left: '3%', top: '14%', size: 14, delay: 0.4 },
  { kind: 'sparkle', left: '95%', top: '20%', size: 14, delay: 1.6, duration: 7 },
  { kind: 'ring', left: '92%', top: '70%', size: 22, delay: 0.8, duration: 8.5 },
  { kind: 'dot', left: '6%', top: '78%', size: 10, delay: 2.1 },
  { kind: 'sparkle', left: '2%', top: '46%', size: 11, delay: 2.8, duration: 7.5 },
  { kind: 'heart', left: '96%', top: '44%', size: 11, delay: 1.0 },
] as const;

const darkSectionDecor: readonly DecorItem[] = [
  { kind: 'sparkle', left: '4%', top: '18%', size: 13, delay: 0.6, duration: 7 },
  { kind: 'dot', left: '93%', top: '24%', size: 9, delay: 1.4 },
  { kind: 'heart', left: '96%', top: '64%', size: 12, delay: 0.2 },
  { kind: 'ring', left: '3%', top: '68%', size: 18, delay: 2.0, duration: 8 },
] as const;

/* ─── Gold ornamental eyebrow ────────────────────────────────────────────── */

function SectionEyebrow({ children, align = 'center' }: { children: React.ReactNode; align?: 'center' | 'left' }) {
  return (
    <div className={cx('mb-4 flex items-center gap-3', align === 'center' && 'justify-center')}>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4A04C]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4A04C]">{children}</span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4A04C]" />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   HOME CLIENT
═══════════════════════════════════════════════════════════════════════════ */

export default function HomeClient({
  home,
  profiles,
  plans,
  stories,
  testimonials,
  blogs,
  dynamicSections = [],
}: {
  home: HomeContent;
  profiles: FeaturedProfile[];
  plans: PublicPlan[];
  stories: PublicContentItem[];
  testimonials: PublicContentItem[];
  blogs: PublicContentItem[];
  dynamicSections?: CmsSection[];
}) {
  const router = useRouter();
  const [lookingFor, setLookingFor] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [ageRange, setAgeRange] = useState('25-32');
  const [community, setCommunity] = useState('Any');
  const [location, setLocation] = useState('Australia');
  const [matchCount, setMatchCount] = useState(1240);

  /* live match count reacts to filter changes */
  useEffect(() => {
    const seed = `${lookingFor}-${ageRange}-${community}-${location}`
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    setMatchCount(480 + (seed % 11) * 97);
  }, [lookingFor, ageRange, community, location]);

  const sectionsToRender = useMemo(() => {
    const active = dynamicSections
      .filter((s) => s.visible && (s.status === 'PUBLISHED' || process.env.NODE_ENV !== 'production'))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return active.length ? active : [...homepageFallbackOrder];
  }, [dynamicSections]);

  /* always render exactly 4 steps — pad CMS content with fallbacks if it has fewer */
  const cmsSteps = (home.howItWorks ?? []).map((item, i) => ({
    step: String(i + 1),
    title: item.split(':')[0] ?? fallbackHowItWorks[i]?.title ?? `Step ${i + 1}`,
    body: item.split(':').slice(1).join(':').trim() || fallbackHowItWorks[i]?.body || '',
    icon: fallbackHowItWorks[i]?.icon ?? Sparkles,
  }));
  const howItWorks = [
    ...cmsSteps,
    ...fallbackHowItWorks.slice(cmsSteps.length).map((s, i) => ({
      ...s,
      step: String(cmsSteps.length + i + 1),
    })),
  ].slice(0, 4);

  /* merge CMS stories with the demo pool so the section always shows 6 */
  const cmsStories = (stories.length ? stories : testimonials).slice(0, 6).map((item, i) => ({
    title: item.title || item.name || demoStories[i]?.title || 'Vivah Couple',
    body:
      item.body ||
      item.quote ||
      demoStories[i]?.body ||
      'Vivah Australia helped us focus on serious conversations and move forward with confidence.',
    location: demoStories[i]?.location || 'Australia',
    imageUrl: demoStories[i]?.imageUrl || demoStories[0].imageUrl,
  }));
  const storyCards = [...cmsStories, ...demoStories.slice(cmsStories.length)].slice(0, 6);

  const curatedPlans = plans.slice(0, 3);
  const resourceCards = blogs.slice(0, 3);
  const faqs = (home.faq ?? fallbackFaqs).map((f) => ({
    question: f.question ?? 'How does Vivah Australia work?',
    answer:
      f.answer ?? 'Create your profile, complete trust checks, browse compatible introductions, and connect safely.',
  }));

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = new URLSearchParams({
      gender: lookingFor,
      ageRange,
      city: location === 'Australia' ? '' : location,
      religion: community === 'Any' ? '' : community,
    });
    router.push(`/matches?${query.toString()}`);
  }

  /* ─── 1. HERO ───────────────────────────────────────────────────────────── */

  function renderHero(section?: CmsSection) {
    return (
      <section className="relative overflow-hidden">
        <div className="flex min-h-[calc(100vh-5rem)] flex-col lg:flex-row">
          {/* ── Left: editorial maroon panel ── */}
          <div className="relative flex w-full items-center bg-[linear-gradient(150deg,#6B0934_0%,#A10E4D_58%,#8B0C42_100%)] lg:w-[55%]">
            {/* texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,160,76,0.16),transparent_55%)]" />

            <AmbientDecor items={heroDecor} tone="dark" />

            <div className="relative w-full px-6 pb-36 pt-16 sm:px-12 lg:py-24 lg:pl-16 lg:pr-12 xl:pl-24">
              <div className="mx-auto max-w-xl lg:mx-0">
                {/* eyebrow */}
                <FadeUp delay={0}>
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D4A04C]/40 bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#D4A04C]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#F7D88A]">
                      Premium Australian Matrimony
                    </span>
                  </div>
                </FadeUp>

                {/* headline */}
                <h1 className="mt-7 font-playfair font-bold text-white">
                  <motion.span
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-4xl leading-[1.08] sm:text-5xl lg:text-6xl xl:text-7xl"
                  >
                    {section?.title || home.hero?.title || 'Meaningful Connections.'}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="text-heartbeat mt-2 block text-4xl leading-[1.08] text-[#D4A04C] sm:text-5xl lg:text-6xl xl:text-7xl"
                  >
                    Lifetime Together.
                  </motion.span>
                </h1>

                {/* gold rule */}
                <FadeUp delay={0.5} className="my-7">
                  <div className="flex items-center gap-3">
                    <span className="block h-px w-14 bg-gradient-to-r from-[#D4A04C] to-transparent" />
                    <Star className="size-3 shrink-0 fill-[#D4A04C] text-[#D4A04C]" />
                  </div>
                </FadeUp>

                {/* sub copy */}
                <FadeUp delay={0.6}>
                  <p className="max-w-md text-base leading-7 text-white/75">
                    {section?.subtitle ||
                      home.hero?.subtitle ||
                      "Australia's trusted matrimonial platform for the Indian and South Asian community. Verified profiles, genuine intent, lifelong connections."}
                  </p>
                </FadeUp>

                {/* trust pills */}
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {[
                    { icon: ShieldCheck, label: '100% Verified' },
                    { icon: LockKeyhole, label: 'Safe & Secure' },
                    { icon: Users, label: 'Genuine Matches' },
                    { icon: MapPin, label: 'Australian Support' },
                  ].map(({ icon: Icon, label }, i) => (
                    <FadeUp key={label} delay={0.7 + i * 0.08}>
                      <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                        <Icon className="size-3.5 text-[#D4A04C]" />
                        <span className="text-xs font-semibold text-white/90">{label}</span>
                      </div>
                    </FadeUp>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-9 flex flex-wrap gap-4">
                  <FadeUp delay={0.95}>
                    <Link
                      href={section?.ctaHref || '/register'}
                      className="btn-shimmer inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full bg-[#D4A04C] px-8 py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(212,160,76,0.40)] transition hover:-translate-y-0.5 hover:bg-[#C4913C] hover:shadow-[0_22px_50px_rgba(212,160,76,0.50)]"
                    >
                      <UserPlus className="size-4" />
                      {section?.ctaLabel || home.hero?.primaryAction || 'Create Your Profile'}
                    </Link>
                  </FadeUp>
                  <FadeUp delay={1.05}>
                    <Link
                      href="/membership"
                      className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                    >
                      {home.hero?.secondaryAction || 'View Membership Plans'}
                    </Link>
                  </FadeUp>
                </div>

                {/* social proof */}
                <FadeUp delay={1.2}>
                  <div className="mt-10 flex items-center gap-6 border-t border-white/15 pt-7 sm:gap-8">
                    {[
                      ['50,000+', 'Members'],
                      ['5,000+', 'Matches Made'],
                      ['100%', 'Verified'],
                    ].map(([val, lbl], i) => (
                      <div key={lbl} className="flex items-center gap-6 sm:gap-8">
                        {i > 0 && <span className="h-9 w-px bg-white/15" />}
                        <div>
                          <p className="font-playfair text-2xl font-bold text-white">{val}</p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            {lbl}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>

          {/* ── Right: full-bleed image ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }}
            className="relative h-80 w-full sm:h-96 lg:h-auto lg:w-[45%]"
          >
            <Image
              src={section?.imageUrl || '/home/hero-vivah-australia.jpg'}
              alt="Vivah Australia — couples connecting across Australia"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
            />
            {/* seam blend into maroon panel */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(107,9,52,0.45)_0%,transparent_30%)] lg:bg-[linear-gradient(90deg,rgba(107,9,52,0.55)_0%,transparent_28%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(47,9,28,0.35)_100%)]" />

            {/* glass tagline badge */}
            <div className="absolute bottom-24 left-1/2 w-max -translate-x-1/2 lg:bottom-12 lg:left-auto lg:right-10 lg:translate-x-0">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-white/25 bg-black/25 px-6 py-4 text-center backdrop-blur-md lg:text-left"
              >
                <p className="font-cormorant text-xl font-semibold italic leading-tight text-white sm:text-2xl">
                  Connecting Hearts.
                </p>
                <p className="font-cormorant text-xl font-semibold italic leading-tight text-[#F7D88A] sm:text-2xl">
                  Creating Futures.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ─── 2. SEARCH CARD (overlaps hero) ───────────────────────────────────── */

  function renderSearchCard() {
    return (
      <section className="relative z-20 -mt-24 px-4 sm:px-6 lg:-mt-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-6xl rounded-[28px] border border-[#D4A04C]/20 border-t-4 border-t-[#D4A04C] bg-white px-6 py-8 shadow-[0_36px_90px_rgba(47,47,47,0.16)] sm:px-10 sm:py-10"
        >
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-playfair text-3xl font-bold text-[#2F2F2F] sm:text-4xl">
                Who are you <span className="text-[#A10E4D]">looking for?</span>
              </h2>
              <p className="mt-1.5 text-sm text-[#5F5F5F]">
                Compatibility matching with trust-first introductions across Australia
              </p>
            </div>

            {/* live match count */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={matchCount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#A10E4D]/20 bg-[#FFF1F5] px-4 py-2"
              >
                <Sparkles className="size-3.5 text-[#A10E4D]" />
                <span className="text-xs font-bold text-[#A10E4D]">
                  {matchCount.toLocaleString()} matches found
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1.4fr_1.4fr_auto] lg:items-end"
          >
            <SearchField label="I am looking for">
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value as 'MALE' | 'FEMALE')}
                className={fieldCls}
              >
                <option value="FEMALE">Bride</option>
                <option value="MALE">Groom</option>
              </select>
            </SearchField>
            <SearchField label="Age range">
              <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={fieldCls}>
                <option value="22-28">22 – 28</option>
                <option value="25-32">25 – 32</option>
                <option value="28-36">28 – 36</option>
                <option value="32-40">32 – 40</option>
              </select>
            </SearchField>
            <SearchField label="Community">
              <select value={community} onChange={(e) => setCommunity(e.target.value)} className={fieldCls}>
                <option value="Any">Any community</option>
                <option value="Hindu">Hindu</option>
                <option value="Sikh">Sikh</option>
                <option value="Muslim">Muslim</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </SearchField>
            <SearchField label="Location">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className={fieldCls}>
                <option value="Australia">All of Australia</option>
                <option value="Melbourne">Melbourne</option>
                <option value="Sydney">Sydney</option>
                <option value="Brisbane">Brisbane</option>
                <option value="Perth">Perth</option>
              </select>
            </SearchField>
            <button
              type="submit"
              className="btn-shimmer inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#A10E4D] px-8 text-sm font-bold text-white shadow-[0_18px_44px_rgba(161,14,77,0.28)] transition hover:-translate-y-0.5 hover:bg-[#8E0D43] hover:shadow-[0_24px_55px_rgba(161,14,77,0.36)] sm:col-span-2 lg:col-span-1 lg:w-auto"
            >
              <Search className="size-4" />
              Search Now
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A10E4D] transition hover:text-[#8E0D43]"
            >
              Advanced Search
              <ChevronDown className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    );
  }

  /* ─── 3. STATS ──────────────────────────────────────────────────────────── */

  function renderStats() {
    return (
      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#6B0934_0%,#A10E4D_52%,#7A0A3A_100%)] px-6 py-10 shadow-[0_30px_80px_rgba(161,14,77,0.28)] sm:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.20),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.05),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <AmbientDecor items={darkSectionDecor} tone="dark" />

          <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {trustStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={cx(
                    'relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-sm transition hover:bg-white/15',
                    i === 4 && 'sm:col-span-2 lg:col-span-1',
                  )}
                >
                  <div className="absolute -right-4 -top-4 size-16 rounded-full bg-[#D4A04C]/15 blur-xl" />
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4A04C]/40 bg-[#D4A04C]/15">
                    <Icon className="size-5 text-[#F7D88A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-playfair text-2xl font-bold leading-none text-white xl:text-[26px]">
                      {stat.value !== null ? (
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      ) : (
                        stat.display
                      )}
                    </p>
                    <p className="mt-1.5 text-xs font-medium leading-4 text-white/70">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  /* ─── 4. SUCCESS STORIES ────────────────────────────────────────────────── */

  function renderSuccessStories() {
    return (
      <section className="relative overflow-hidden bg-white py-20">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <SectionEyebrow>Real stories of love &amp; companionship</SectionEyebrow>
            <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">Success Stories</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Feature story */}
            {storyCards[0] && (
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="group relative h-[420px] overflow-hidden rounded-[32px] shadow-[0_24px_65px_rgba(161,14,77,0.10)] sm:h-[520px]"
              >
                <Image
                  src={storyCards[0].imageUrl}
                  alt={storyCards[0].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(47,9,28,0.85)_100%)]" />
                <div className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-[#D4A04C]/50 bg-black/30 px-3.5 py-1.5 backdrop-blur-sm">
                  <Sparkles className="size-3 fill-[#D4A04C] text-[#D4A04C]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F7D88A]">Vivah Story</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <p className="font-cormorant text-5xl font-bold italic leading-none text-[#D4A04C]/60">&ldquo;</p>
                  <p className="mt-1 line-clamp-3 font-cormorant text-xl font-semibold italic leading-7 text-white/95 sm:text-2xl sm:leading-8">
                    {storyCards[0].body}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                    <div>
                      <p className="font-playfair text-xl font-bold text-white">{storyCards[0].title}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <MapPin className="size-3 text-[#D4A04C]" />
                        <p className="text-xs font-medium text-white/65">{storyCards[0].location}</p>
                      </div>
                    </div>
                    <Link
                      href="/blog"
                      className="flex items-center gap-1.5 text-xs font-bold text-[#F7D88A] transition-[gap] hover:gap-3"
                    >
                      Read story <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}

            {/* Two stacked stories */}
            <div className="grid gap-6">
              {storyCards.slice(1, 3).map((story, i) => (
                <motion.article
                  key={story.title}
                  initial={{ opacity: 0, x: 28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative h-[248px] overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(161,14,77,0.08)]"
                >
                  <Image
                    src={story.imageUrl}
                    alt={story.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(47,9,28,0.85)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="line-clamp-2 font-cormorant text-lg font-semibold italic leading-6 text-white/95">
                      &ldquo;{story.body}&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                      <div>
                        <p className="font-playfair text-base font-bold text-white">{story.title}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <MapPin className="size-2.5 text-[#D4A04C]" />
                          <p className="text-[11px] text-white/65">{story.location}</p>
                        </div>
                      </div>
                      <Link
                        href="/blog"
                        className="flex items-center gap-1 text-[11px] font-bold text-[#F7D88A] transition-[gap] hover:gap-2"
                      >
                        Read <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          {/* second row — three more stories */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {storyCards.slice(3, 6).map((story, i) => (
              <motion.article
                key={story.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group relative h-[300px] overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(161,14,77,0.08)]"
              >
                <Image
                  src={story.imageUrl}
                  alt={story.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(47,9,28,0.85)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="line-clamp-2 font-cormorant text-lg font-semibold italic leading-6 text-white/95">
                    &ldquo;{story.body}&rdquo;
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                    <div>
                      <p className="font-playfair text-base font-bold text-white">{story.title}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <MapPin className="size-2.5 text-[#D4A04C]" />
                        <p className="text-[11px] text-white/65">{story.location}</p>
                      </div>
                    </div>
                    <Link
                      href="/blog"
                      className="flex items-center gap-1 text-[11px] font-bold text-[#F7D88A] transition-[gap] hover:gap-2"
                    >
                      Read <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <PremiumButton href="/blog" variant="secondary" className="rounded-full px-8">
              View all stories
            </PremiumButton>
          </div>
        </div>
      </section>
    );
  }

  /* ─── 5. HOW IT WORKS ───────────────────────────────────────────────────── */

  function renderHowItWorks() {
    return (
      <section className="relative overflow-hidden bg-[#FFF9F5] py-20">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <SectionEyebrow>Thoughtful matchmaking</SectionEyebrow>
            <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
              How Vivah Australia Works
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#5F5F5F]">
              Four thoughtful steps from first profile to lifelong connection.
            </p>
          </div>

          <div className="relative">
            {/* dashed connector through step circle centres (p-8 top + half of 56px circle = 60px) */}
            <svg
              aria-hidden
              className="absolute left-[12.5%] top-[60px] hidden h-0.5 w-3/4 lg:block"
              viewBox="0 0 1000 2"
              preserveAspectRatio="none"
            >
              <motion.line
                x1="0"
                y1="1"
                x2="1000"
                y2="1"
                stroke="#D4A04C"
                strokeWidth="2"
                strokeDasharray="10 8"
                strokeOpacity="0.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </svg>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={`${item.step}-${item.title}`}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col items-center rounded-[28px] border border-[#D4A04C]/15 bg-white p-8 text-center shadow-[0_18px_50px_rgba(47,47,47,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[#A10E4D]/20 hover:shadow-[0_28px_65px_rgba(161,14,77,0.10)]"
                  >
                    <div className="relative z-10 mb-6 flex size-14 items-center justify-center rounded-full bg-[#A10E4D] font-playfair text-xl font-bold text-white shadow-[0_8px_28px_rgba(161,14,77,0.35)] ring-4 ring-[#FFF9F5] transition group-hover:shadow-[0_12px_36px_rgba(161,14,77,0.45)]">
                      {item.step}
                    </div>
                    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle,rgba(212,160,76,0.18),rgba(255,249,245,0.8))]">
                      <Icon className="size-7 text-[#A10E4D]" />
                    </div>
                    <h3 className="font-cormorant text-3xl font-semibold text-[#2F2F2F]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5F5F5F]">{item.body}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-[#A10E4D] px-9 py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(161,14,77,0.26)] transition hover:-translate-y-0.5 hover:bg-[#8E0D43] hover:shadow-[0_22px_50px_rgba(161,14,77,0.34)]"
            >
              Start Your Journey <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ─── 6. VERIFICATION ───────────────────────────────────────────────────── */

  function renderVerification() {
    const featuredProfiles = profiles.slice(0, 3);

    return (
      <section className="relative overflow-hidden bg-white py-20">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* manifesto panel */}
          <div className="overflow-hidden rounded-[36px] border border-[#D4A04C]/20 bg-[linear-gradient(135deg,#FFFDF8_0%,#FFF8F0_100%)] p-8 shadow-[0_24px_65px_rgba(161,14,77,0.07)] lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4A04C]/30 bg-white px-5 py-2 shadow-sm">
                  <ShieldCheck className="size-4 text-[#1F9D68]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A10E4D]">
                    Trust-first introductions
                  </span>
                </div>
                <h2 className="font-playfair text-4xl font-bold leading-tight text-[#2F2F2F] sm:text-5xl">
                  Build trust before
                  <br />
                  <em className="not-italic text-[#A10E4D]">the first conversation</em>
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-8 text-[#5F5F5F]">
                  {home.safety?.[0] ||
                    'Verification helps members feel safer, respond faster, and focus on introductions with real intent.'}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/register" className="rounded-full px-7">
                    Create Your Profile
                  </PremiumButton>
                  <PremiumButton href="/faq" variant="secondary" className="rounded-full px-7">
                    Learn about verification
                  </PremiumButton>
                </div>
              </div>

              {/* featured member previews */}
              <div className="rounded-[28px] border border-[#D4A04C]/15 bg-white p-5 shadow-[0_18px_50px_rgba(47,47,47,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2F2F2F]">Featured Members</p>
                  <span className="rounded-full bg-[#1F9D68]/10 px-3 py-1 text-[11px] font-bold text-[#1F9D68]">
                    Verified
                  </span>
                </div>
                <div className="grid gap-3">
                  {featuredProfiles.length ? (
                    featuredProfiles.map((p, i) => (
                      <div
                        key={p._id || p.id || i}
                        className="flex items-center gap-3.5 rounded-2xl border border-[#D4A04C]/10 bg-[#FFF9F5] px-4 py-3.5 transition hover:border-[#A10E4D]/20"
                      >
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-[#D4A04C]/30 bg-[#A10E4D]/10 font-cormorant text-lg font-bold text-[#A10E4D]">
                          {(p.personal?.firstName || 'V').slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#2F2F2F]">
                            {p.personal?.firstName || 'Vivah member'}
                            {p.personal?.age ? `, ${p.personal.age}` : ''}
                          </p>
                          <p className="text-xs text-[#5F5F5F]">
                            {[p.location?.city, p.location?.state].filter(Boolean).join(', ') || 'Australia'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#D4A04C]/30 bg-white px-2.5 py-1 shadow-sm">
                          <Star className="size-2.5 fill-[#D4A04C] text-[#D4A04C]" />
                          <span className="text-[10px] font-bold text-[#A10E4D]">
                            {['Gold Verified', 'Genuine', 'Trust Checked'][i] || 'Verified'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#FFF9F5] px-5 py-10 text-center text-sm text-[#5F5F5F]">
                      Verified member previews appear here once featured profiles are available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5-column trust strip */}
          <div className="mt-12 border-y border-[#D4A04C]/20 py-10">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 lg:divide-x lg:divide-[#D4A04C]/15">
              {verificationFeatures.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center px-4 text-center"
                >
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-[#D4A04C]/35 bg-white shadow-[0_8px_22px_rgba(212,160,76,0.14)]">
                    <Icon className="size-6 text-[#A10E4D]" strokeWidth={1.7} />
                  </div>
                  <p className="text-sm font-bold leading-5 text-[#2F2F2F]">{label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-[#5F5F5F]">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ─── 7. MEMBERSHIP ─────────────────────────────────────────────────────── */

  function renderMembershipCta() {
    return (
      <section className="relative overflow-hidden bg-[#FFF9F5] py-20">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <SectionEyebrow>Premium membership</SectionEyebrow>
            <h2 className="font-playfair text-4xl font-bold leading-tight text-[#2F2F2F] sm:text-5xl">
              Choose the right plan for
              <br />
              <em className="not-italic text-[#A10E4D]">meaningful connections</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#5F5F5F]">
              Unlock direct messaging, advanced filters, and trust-building features designed for serious
              matrimonial journeys.
            </p>
          </div>

          {curatedPlans.length ? (
            <div className="grid gap-8 pt-4 md:grid-cols-3 md:gap-6">
              {curatedPlans.map((plan, i) => {
                const featured = i === 1;
                return (
                  <motion.div
                    key={plan.code}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className={cx(
                      'relative rounded-[32px] border p-8 transition duration-300',
                      featured
                        ? 'border-[#A10E4D]/20 bg-[linear-gradient(155deg,#A10E4D_0%,#8E0D43_100%)] shadow-[0_32px_80px_rgba(161,14,77,0.35)] md:-translate-y-3'
                        : 'border-[#D4A04C]/20 bg-white shadow-[0_18px_50px_rgba(47,47,47,0.06)] hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(47,47,47,0.10)]',
                    )}
                  >
                    {featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#D4A04C] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_6px_20px_rgba(212,160,76,0.50)]">
                          <Star className="size-3 fill-white" />
                          Most Popular
                        </div>
                      </div>
                    )}
                    <p
                      className={cx(
                        'text-[11px] font-semibold uppercase tracking-[0.22em]',
                        featured ? 'text-[#F7D88A]' : 'text-[#A10E4D]',
                      )}
                    >
                      {plan.name}
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className={cx('font-playfair text-5xl font-bold', featured ? 'text-white' : 'text-[#2F2F2F]')}>
                        {formatMoney(plan.priceCents, plan.currency)}
                      </span>
                      <span className={cx('pb-2 text-sm', featured ? 'text-white/60' : 'text-[#5F5F5F]')}>
                        / {plan.interval.toLowerCase()}
                      </span>
                    </div>
                    <div className={cx('my-6 h-px', featured ? 'bg-white/15' : 'bg-[#D4A04C]/15')} />
                    <ul className="space-y-3.5 text-sm leading-6">
                      {plan.features.slice(0, 5).map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <CheckCircle2
                            className={cx('mt-0.5 size-4 shrink-0', featured ? 'text-[#F7D88A]' : 'text-[#1F9D68]')}
                          />
                          <span className={featured ? 'text-white/80' : 'text-[#5F5F5F]'}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <PremiumButton
                      href="/membership"
                      variant={featured ? 'gold' : 'secondary'}
                      className="mt-8 w-full rounded-full"
                    >
                      View {plan.name}
                    </PremiumButton>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-10 text-center shadow-[0_24px_65px_rgba(161,14,77,0.07)]">
              <p className="mb-6 text-lg text-[#5F5F5F]">
                Unlock direct messaging, advanced search filters, and trust-building features.
              </p>
              <PremiumButton href="/membership" className="rounded-full px-8">
                Explore Membership
              </PremiumButton>
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <PremiumButton href="/membership" variant="secondary" className="rounded-full px-8">
              Compare all plans
            </PremiumButton>
            <PremiumButton href="/matches" className="rounded-full px-8">
              Explore matches
            </PremiumButton>
          </div>
        </div>
      </section>
    );
  }

  /* ─── 8. BLOG ───────────────────────────────────────────────────────────── */

  function renderBlog() {
    return (
      <section className="relative overflow-hidden bg-white py-20">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4A04C] sm:from-[#D4A04C] sm:to-[#D4A04C]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#D4A04C]">
                  Guidance for serious members
                </span>
              </div>
              <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">Resources &amp; Stories</h2>
            </div>
            <div className="shrink-0">
              <PremiumButton href="/blog" variant="secondary" className="rounded-full px-6">
                Browse resources
              </PremiumButton>
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {resourceCards.map((blog, i) => (
              <motion.article
                key={`${blog.slug || blog.title}-${i}`}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.11, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col rounded-[28px] border border-[#D4A04C]/15 bg-white p-7 shadow-[0_18px_48px_rgba(47,47,47,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(161,14,77,0.10)]"
              >
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#A10E4D]/15 bg-[#FFF1F5] px-3 py-1.5">
                  <Sparkles className="size-3 text-[#A10E4D]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A10E4D]">
                    Vivah guide
                  </span>
                </div>
                <h3 className="font-cormorant text-3xl font-semibold leading-tight text-[#2F2F2F]">
                  {blog.title || 'Thoughtful matrimonial advice'}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#5F5F5F]">
                  {blog.body ||
                    'Guidance to help members create stronger profiles, safer conversations, and more aligned introductions.'}
                </p>
                <div className="mt-5 border-t border-[#D4A04C]/10 pt-5">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#A10E4D] transition-[gap] hover:gap-2.5"
                  >
                    Read article <ArrowRight className="size-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ─── 9. FAQ ────────────────────────────────────────────────────────────── */

  function renderFaq() {
    return (
      <section className="relative overflow-hidden bg-[#FFF9F5] py-24">
        <AmbientDecor items={lightSectionDecor} tone="light" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <SectionEyebrow>Clear, respectful, trustworthy</SectionEyebrow>
            <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="rounded-[32px] border border-[#D4A04C]/20 bg-white p-4 shadow-[0_22px_58px_rgba(47,47,47,0.07)] sm:p-6">
            <FAQAccordion items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
          </div>
          <div className="mt-10 text-center">
            <p className="text-base text-[#5F5F5F]">Still have questions?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/faq" variant="secondary" className="rounded-full px-7">
                View full FAQ
              </PremiumButton>
              <PremiumButton href="/contact" className="rounded-full px-7">
                Contact support
              </PremiumButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ─── Section router ────────────────────────────────────────────────────── */

  function renderSection(section: CmsSection) {
    switch (section.key) {
      case 'hero':
        return renderHero(section);
      case 'stats':
      case 'trust-strip':
        return renderStats();
      case 'success-stories':
      case 'testimonials':
        return renderSuccessStories();
      case 'how-it-works':
        return renderHowItWorks();
      case 'verification':
      case 'why-vivah':
        return renderVerification();
      case 'membership-cta':
        return renderMembershipCta();
      case 'blog':
        return renderBlog();
      case 'faq':
        return renderFaq();
      default:
        return null;
    }
  }

  /* the search card is injected immediately after the hero so it can overlap it */
  const sectionsWithSearch = useMemo(() => {
    const result: Array<{ key: string; isSearchCard?: boolean }> = [];
    for (const s of sectionsToRender) {
      result.push(s);
      if (s.key === 'hero') result.push({ key: '__search__', isSearchCard: true });
    }
    return result;
  }, [sectionsToRender]);

  return (
    <div className="bg-[#FFF9F5] font-poppins text-[#2F2F2F] selection:bg-[#A10E4D] selection:text-white">
      <PublicHeader />
      {sectionsWithSearch.map((section) => (
        <div key={section.key}>
          {section.isSearchCard ? renderSearchCard() : renderSection(section as CmsSection)}
        </div>
      ))}
      <PublicFooter />
    </div>
  );
}

/* ─── Search field wrapper ───────────────────────────────────────────────── */

function SearchField({ children, label }: Readonly<{ children: React.ReactNode; label: string }>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#2F2F2F]">
      {label}
      <div className="relative">
        {children}
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#A10E4D]" />
      </div>
    </label>
  );
}

const fieldCls =
  'h-[56px] w-full appearance-none rounded-2xl border border-[#A10E4D]/10 bg-[#FFFDFC] px-4 text-base text-[#2F2F2F] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#A10E4D]/10';
