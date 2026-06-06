'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Heart,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
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

const heroHighlights = [
  { label: '100% Verified Profiles', icon: ShieldCheck },
  { label: 'Safe & Secure', icon: Lock },
  { label: 'Genuine Matches', icon: Users },
  { label: 'Australian Support', icon: MapPin },
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

const verificationBenefits = [
  'Manual & AI verified profiles',
  'ID, visa & employment verification',
  'Facial verification available',
  'Australian-based customer support',
  'Privacy-first matchmaking',
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

const storyImages = [
  '/success-stories/couple-melbourne.jpg',
  '/success-stories/couple-sydney.jpg',
  '/success-stories/couple-brisbane.jpg',
] as const;

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

  const sectionsToRender = useMemo(() => {
    const active = dynamicSections
      .filter((section) => section.visible && (section.status === 'PUBLISHED' || process.env.NODE_ENV !== 'production'))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return active.length ? active : [...homepageFallbackOrder];
  }, [dynamicSections]);

  const howItWorks = home.howItWorks?.length
    ? home.howItWorks.map((item, index) => ({
        step: String(index + 1),
        title: item.split(':')[0] ?? fallbackHowItWorks[index]?.title ?? `Step ${index + 1}`,
        body:
          item.split(':').slice(1).join(':').trim() ||
          fallbackHowItWorks[index]?.body ||
          'Thoughtful matchmaking for meaningful relationships.',
        icon: fallbackHowItWorks[index]?.icon ?? Sparkles,
      }))
    : fallbackHowItWorks;

  const storyCards = (stories.length ? stories : testimonials).slice(0, 3).map((item, index) => ({
    title:
      item.title ||
      item.name ||
      ['Neha & Chirag', 'Priya & Kunal', 'Anjali & Manish'][index] ||
      'Vivah Couple',
    body:
      item.body ||
      item.quote ||
      'Vivah Australia helped us focus on serious conversations and move forward with confidence.',
    location: ['Melbourne, VIC', 'Sydney, NSW', 'Brisbane, QLD'][index] || 'Australia',
    imageUrl: storyImages[index % storyImages.length] || storyImages[0],
  }));

  const curatedPlans = plans.slice(0, 3);
  const faqs = (home.faq ?? fallbackFaqs).map((item) => ({
    question: item.question ?? 'How does Vivah Australia work?',
    answer: item.answer ?? 'Create your profile, complete trust checks, browse compatible introductions, and connect safely.',
  }));

  const trustStats = [
    { value: '15,000+', label: 'Verified profiles' },
    { value: '5,000+', label: 'Successful matches' },
    { value: '50,000+', label: 'Members' },
    { value: '100%', label: 'Privacy protected' },
    { value: 'Australia-wide', label: 'Indian community focus' },
  ];

  const featuredProfiles = profiles.slice(0, 3);
  const resourceCards = blogs.slice(0, 3);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = new URLSearchParams({
      gender: lookingFor,
      ageRange,
      city: location === 'Australia' ? '' : location,
      religion: community === 'Any' ? '' : community,
    });

    router.push(`/matches?${query.toString()}`);
  }

  function renderHero(section?: CmsSection) {
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(212,160,76,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(231,76,124,0.12),_transparent_22%),linear-gradient(180deg,#fffaf7_0%,#fff6f0_100%)] pt-28 pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(161,14,77,0.02)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] pb-12 lg:pb-20">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex rounded-full border border-[#D4A04C]/30 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#A10E4D]">
                Premium Australian Matrimony
              </div>
              <h1 className="max-w-xl font-playfair text-5xl font-bold leading-[0.98] text-[#2F2F2F] sm:text-6xl lg:text-7xl">
                {section?.title || home.hero?.title || 'Meaningful Connections.'}
                <span className="mt-2 block text-[#A10E4D]">
                  {home.hero?.subtitle?.includes('Lifetime')
                    ? home.hero.subtitle.split('.').slice(-2).join('.').trim()
                    : 'Lifetime Together.'}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#5F5F5F]">
                {section?.subtitle ||
                  home.hero?.subtitle ||
                  'Vivah Australia is a trusted matrimonial platform for the Indian and South Asian community across Australia.'}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {heroHighlights.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-center shadow-[0_18px_45px_rgba(161,14,77,0.06)] backdrop-blur"
                  >
                    <Icon className="mx-auto size-5 text-[#A10E4D]" />
                    <p className="mt-3 text-sm font-medium leading-5 text-[#2F2F2F]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <PremiumButton href={section?.ctaHref || '/register'} className="min-w-[214px] rounded-full px-7 py-3.5 text-base">
                  {section?.ctaLabel || home.hero?.primaryAction || 'Create Your Profile'}
                </PremiumButton>
                <PremiumButton href="/membership" variant="secondary" className="min-w-[214px] rounded-full px-7 py-3.5 text-base">
                  {home.hero?.secondaryAction || 'View Membership Plans'}
                </PremiumButton>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-6 inset-y-10 rounded-[44px] bg-[radial-gradient(circle_at_center,_rgba(212,160,76,0.26),_transparent_60%)] blur-3xl" />
              <div className="relative overflow-hidden rounded-[40px] border border-white/80 bg-white/40 p-3 shadow-[0_30px_80px_rgba(161,14,77,0.12)] backdrop-blur">
                <div className="relative aspect-[0.96] overflow-hidden rounded-[34px]">
                  <Image
                    src={section?.imageUrl || '/success-stories/couple-sydney.jpg'}
                    alt="Vivah Australia couple"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(161,14,77,0.1)_100%)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6 lg:mt-[-3.5rem]">
            <div className="mx-auto max-w-6xl rounded-[34px] border border-[#A10E4D]/10 bg-white px-5 py-8 shadow-[0_30px_80px_rgba(47,47,47,0.10)] sm:px-8">
              <div className="text-center">
                <h2 className="font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
                  Find Your <span className="text-[#A10E4D]">Perfect Match</span>
                </h2>
                <p className="mt-3 text-base text-[#5F5F5F]">
                  Advanced search with compatibility matching and trust-first introductions
                </p>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1.5fr_1.6fr_1.5fr_auto] lg:items-end"
              >
                <SearchField label="I am looking for">
                  <select
                    value={lookingFor}
                    onChange={(event) => setLookingFor(event.target.value as 'MALE' | 'FEMALE')}
                    className={fieldClassName}
                  >
                    <option value="FEMALE">Bride</option>
                    <option value="MALE">Groom</option>
                  </select>
                </SearchField>

                <SearchField label="Age">
                  <select
                    value={ageRange}
                    onChange={(event) => setAgeRange(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="22-28">22 to 28</option>
                    <option value="25-32">25 to 32</option>
                    <option value="28-36">28 to 36</option>
                    <option value="32-40">32 to 40</option>
                  </select>
                </SearchField>

                <SearchField label="Community">
                  <select
                    value={community}
                    onChange={(event) => setCommunity(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="Any">Any</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </SearchField>

                <SearchField label="Location">
                  <select
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="Australia">Australia</option>
                    <option value="Melbourne">Melbourne</option>
                    <option value="Sydney">Sydney</option>
                    <option value="Brisbane">Brisbane</option>
                    <option value="Perth">Perth</option>
                  </select>
                </SearchField>

                <PremiumButton
                  type="submit"
                  className="h-[58px] w-full lg:w-auto rounded-2xl px-8 text-base shadow-[0_20px_45px_rgba(161,14,77,0.22)]"
                >
                  <Search className="size-4" />
                  Search Now
                </PremiumButton>
              </form>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-[#2F2F2F]">
                <span>Advanced Search</span>
                <ChevronDown className="size-4 text-[#A10E4D]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderStats() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[30px] bg-[linear-gradient(135deg,#8E0D43_0%,#A10E4D_46%,#7B123F_100%)] px-6 py-6 text-white shadow-[0_24px_60px_rgba(161,14,77,0.22)] sm:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {trustStats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 last:col-span-2 last:md:col-span-1"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-[#F7D88A] shrink-0">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white leading-none">{item.value}</p>
                    <p className="text-xs sm:text-sm text-white/80 mt-1">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderSuccessStories() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl text-center sm:text-left">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4A04C]">
                Real stories of love and companionship
              </div>
              <h2 className="mt-4 font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
                Success Stories
              </h2>
            </div>
            <PremiumButton href="/blog" variant="secondary" className="rounded-full px-6">
              View all stories
            </PremiumButton>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {storyCards.map((story) => (
              <article
                key={`${story.title}-${story.location}`}
                className="overflow-hidden rounded-[30px] border border-[#A10E4D]/8 bg-white shadow-[0_20px_50px_rgba(161,14,77,0.06)]"
              >
                <div className="relative h-56">
                  <Image src={story.imageUrl} alt={story.title} fill className="object-cover" />
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#D4A04C]">
                    <Sparkles className="size-4" />
                    Vivah Australia Story
                  </div>
                  <h3 className="mt-4 font-cormorant text-3xl font-semibold text-[#2F2F2F]">
                    {story.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#5F5F5F]">{story.body}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#A10E4D]/8 pt-5">
                    <span className="text-sm font-medium text-[#5F5F5F]">{story.location}</span>
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#A10E4D]">
                      Read their story
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderHowItWorks() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4A04C]">
              Thoughtful matchmaking
            </div>
            <h2 className="mt-4 font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
              How Vivah Australia Works
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={`${item.step}-${item.title}`}
                  className="relative rounded-[28px] border border-[#A10E4D]/8 bg-white p-8 shadow-[0_20px_50px_rgba(47,47,47,0.05)]"
                >
                  <div className="absolute left-6 top-6 flex size-10 items-center justify-center rounded-full bg-[#A10E4D] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div className="mt-10 flex size-20 items-center justify-center rounded-full bg-[radial-gradient(circle,_rgba(231,76,124,0.20),_rgba(255,249,245,0.7))] text-[#A10E4D]">
                    <Icon className="size-8" />
                  </div>
                  <h3 className="mt-6 font-cormorant text-3xl font-semibold text-[#2F2F2F]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#5F5F5F]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  function renderVerification() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-[#D4A04C]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(255,248,241,1)_100%)] p-8 shadow-[0_24px_60px_rgba(161,14,77,0.07)] lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-[#D4A04C]/25 bg-[#FFF7E8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#A10E4D]">
                  Trust-first introductions
                </div>
                <h2 className="mt-5 font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
                  Build trust before the first conversation
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5F5F5F]">
                  {home.safety?.[0] ||
                    'Verification helps members feel safer, respond faster, and focus on introductions with real intent.'}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {verificationBenefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-3 rounded-2xl border border-[#A10E4D]/8 bg-white/90 px-4 py-4"
                    >
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#1F9D68]" />
                      <span className="text-sm leading-6 text-[#2F2F2F]">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/register" className="rounded-full px-7">
                    Create Your Profile
                  </PremiumButton>
                  <PremiumButton href="/faq" variant="secondary" className="rounded-full px-7">
                    Learn about verification
                  </PremiumButton>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#A10E4D]/10 bg-white p-6 shadow-[0_20px_50px_rgba(47,47,47,0.05)]">
                <div className="grid gap-4">
                  {featuredProfiles.length ? (
                    featuredProfiles.map((profile, index) => (
                      <div
                        key={profile._id || profile.id || profile.displayId}
                        className="flex items-center gap-4 rounded-2xl border border-[#A10E4D]/8 bg-[#FFF9F5] px-4 py-4"
                      >
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#A10E4D]/10 font-cormorant text-xl font-semibold text-[#A10E4D]">
                          {(profile.personal?.firstName || 'V').slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#2F2F2F]">
                            {profile.personal?.firstName || 'Vivah member'}
                            {profile.personal?.age ? `, ${profile.personal.age}` : ''}
                          </p>
                          <p className="mt-1 text-sm text-[#5F5F5F]">
                            {[profile.location?.city, profile.location?.state].filter(Boolean).join(', ') ||
                              'Australia'}
                          </p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#A10E4D] shadow-sm">
                          {['Gold Verified', 'Safe & Genuine', 'Trust Checked'][index] || 'Verified'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[#A10E4D]/8 bg-[#FFF9F5] px-6 py-10 text-center text-sm text-[#5F5F5F]">
                      Verified member previews appear here once featured profiles are available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderMembershipCta() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[36px] border border-[#A10E4D]/10 bg-[linear-gradient(135deg,#FFF7F2_0%,#FFFDFB_42%,#FFF7ED_100%)] shadow-[0_28px_70px_rgba(161,14,77,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="p-8 lg:p-10">
                <div className="inline-flex rounded-full border border-[#D4A04C]/25 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#A10E4D]">
                  Premium membership
                </div>
                <h2 className="mt-5 font-playfair text-4xl font-bold leading-tight text-[#2F2F2F] sm:text-5xl">
                  Choose the right plan for meaningful connections
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-[#5F5F5F]">
                  Unlock direct messaging, advanced search filters, higher visibility, and trust-building features designed for serious matrimonial journeys.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    '100% verified profiles',
                    'Safe & secure platform',
                    'Genuine introductions',
                    'Priority customer support',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm font-medium text-[#2F2F2F]">
                      <ShieldCheck className="size-4 text-[#A10E4D]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/membership" className="rounded-full px-7">
                    Explore membership
                  </PremiumButton>
                  <PremiumButton href="/matches" variant="secondary" className="rounded-full px-7">
                    Explore matches
                  </PremiumButton>
                </div>
              </div>

              <div className="grid gap-px bg-[#A10E4D]/8 md:grid-cols-3">
                {curatedPlans.map((plan, index) => (
                  <div
                    key={plan.code}
                    className={cx(
                      'relative bg-white p-8',
                      index === 1 && 'bg-[linear-gradient(180deg,#FFFDF7_0%,#FFFFFF_100%)]',
                    )}
                  >
                    {index === 1 ? (
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A04C] px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#2F2F2F]">
                        Most Popular
                      </div>
                    ) : null}
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A10E4D]">
                      {plan.name}
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="font-playfair text-5xl font-bold text-[#2F2F2F]">
                        {formatMoney(plan.priceCents, plan.currency)}
                      </span>
                      <span className="pb-2 text-sm text-[#5F5F5F]">/ {plan.interval.toLowerCase()}</span>
                    </div>
                    <ul className="mt-6 space-y-3 text-sm leading-6 text-[#5F5F5F]">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1F9D68]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <PremiumButton
                      href="/membership"
                      variant={index === 1 ? 'primary' : 'secondary'}
                      className="mt-8 w-full rounded-full"
                    >
                      View {plan.name}
                    </PremiumButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderBlog() {
    return (
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4A04C]">
                Guidance for serious members
              </div>
              <h2 className="mt-4 font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
                Resources & stories
              </h2>
            </div>
            <PremiumButton href="/blog" variant="secondary" className="rounded-full px-6">
              Browse resources
            </PremiumButton>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resourceCards.map((blog, index) => (
              <article
                key={`${blog.slug || blog.title}-${index}`}
                className="rounded-[28px] border border-[#A10E4D]/8 bg-white p-7 shadow-[0_18px_45px_rgba(47,47,47,0.05)]"
              >
                <div className="inline-flex rounded-full bg-[#FFF1F5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#A10E4D]">
                  Vivah guide
                </div>
                <h3 className="mt-5 font-cormorant text-3xl font-semibold text-[#2F2F2F]">
                  {blog.title || 'Thoughtful matrimonial advice'}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#5F5F5F]">
                  {blog.body || 'Guidance to help members create stronger profiles, safer conversations, and more aligned introductions.'}
                </p>
                <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#A10E4D]">
                  Read article
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderFaq() {
    return (
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4A04C]">
              Clear, respectful, trustworthy
            </div>
            <h2 className="mt-4 font-playfair text-4xl font-bold text-[#2F2F2F] sm:text-5xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-10 rounded-[30px] border border-[#A10E4D]/8 bg-white p-4 shadow-[0_20px_50px_rgba(47,47,47,0.05)] sm:p-6">
            <FAQAccordion
              items={faqs.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          </div>
        </div>
      </section>
    );
  }

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

  return (
    <div className="bg-[#FFF9F5] text-[#2F2F2F] font-poppins selection:bg-[#A10E4D] selection:text-white">
      <PublicHeader />
      {sectionsToRender.map((section) => (
        <div key={section.key}>{renderSection(section as CmsSection)}</div>
      ))}
      <PublicFooter />
    </div>
  );
}

function SearchField({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
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

const fieldClassName =
  'h-[58px] w-full appearance-none rounded-2xl border border-[#A10E4D]/12 bg-[#FFFDFC] px-4 text-base text-[#2F2F2F] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#A10E4D]/8';
