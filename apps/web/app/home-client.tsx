'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, type ReactNode, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Search,
  Heart,
  Sparkles,
  CheckCircle,
  ChevronDown,
  Shield,
  Lock,
  Award,
  PlayCircle,
} from 'lucide-react';
import { PremiumButton, ProfileMatchCard, PublicFooter, PublicHeader } from '@/app/components';
import type { FeaturedProfile, HomeContent, PublicContentItem, PublicPlan } from '@/lib/public-api';

const communities = [
  'Indian Matrimony in Melbourne',
  'Indian Matrimony in Sydney',
  'Punjabi Matrimony in Australia',
  'Hindu Matrimony in Australia',
  'Sikh Matrimony in Australia',
  'Muslim Matrimony in Australia',
  'Telugu Matrimony in Australia',
  'Gujarati Matrimony in Australia',
  'Tamil Matrimony in Australia',
  'Divorcee / Second Marriage Matrimony',
];

const faqs = [
  {
    q: 'Is Vivah Australia free to join?',
    a: 'Yes, creating a profile and receiving interests is entirely free. Premium features unlock direct messaging and advanced visibility.',
  },
  {
    q: 'How does profile verification work?',
    a: 'We use a multi-tier verification ladder, reviewing email, mobile, ID, address, and employment documents to grant badges.',
  },
  {
    q: 'Can I control who sees my photos?',
    a: 'Absolutely. You can choose to show your photos publicly, only to logged-in members, or strictly to matches you accept.',
  },
  {
    q: 'When can members message each other?',
    a: 'Messaging is unlocked when a mutual interest is accepted and at least one member holds an active premium plan.',
  },
  {
    q: 'What is the difference between Free, Premium, Gold, and Platinum?',
    a: 'Free members can explore. Premium unlocks communication. Gold and Platinum provide advanced filters, priority placement, and higher visibility.',
  },
  {
    q: 'Can I block or report someone?',
    a: 'Yes, safety is a priority. We offer robust reporting tools and strict admin moderation to ensure community safety.',
  },
  {
    q: 'Is this only for Indian Australians?',
    a: 'Vivah Australia focuses on the South Asian diaspora within Australia, but our platform respects and welcomes members from all backgrounds seeking serious relationships.',
  },
  {
    q: 'Can divorced or separated members join?',
    a: 'Yes, we respect all life journeys. You can specify your marital status clearly so you connect with compatible individuals.',
  },
];

function FadeIn({
  children,
  delay = 0,
  className = '',
}: Readonly<{ children: ReactNode; delay?: number; className?: string }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
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
}: {
  home: HomeContent;
  profiles: FeaturedProfile[];
  plans: PublicPlan[];
  stories: PublicContentItem[];
  testimonials: PublicContentItem[];
  blogs: PublicContentItem[];
}) {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');

  // Hero Search Widget State
  const [lookingFor, setLookingFor] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [ageRange, setAgeRange] = useState('25-30');
  const [city, setCity] = useState('Sydney');
  const [religion, setReligion] = useState('Any');

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (genderFilter === 'ALL') return true;
      const pGender = p.personal?.gender?.toUpperCase();
      return pGender === genderFilter;
    });
  }, [profiles, genderFilter]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const query = new URLSearchParams({
      gender: lookingFor,
      ageRange,
      city,
      religion,
    });
    router.push(`/matches?${query.toString()}`);
  }

  return (
    <div className="bg-[#FFF9F5] text-[#2F2F2F] font-poppins selection:bg-[#A10E4D] selection:text-white">
      <PublicHeader />
      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden flex items-center bg-gradient-to-br from-[#FFF9F5] via-[#FFF5EF] to-[#D4A04C]/10">
        <div className="absolute inset-x-0 top-0 h-px bg-[#D4A04C]/40" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[#A10E4D]/10" />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[1fr_0.9fr] gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4A04C] mb-4">
              Australia&apos;s Premium Matrimonial Platform
            </p>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-playfair font-bold text-[#A10E4D] leading-[1.1] mb-6">
              {home.hero?.title || 'Find a life partner who truly matches your values.'}
            </h1>
            <p className="text-lg text-[#5F5F5F] leading-relaxed mb-8 max-w-xl">
              {home.hero?.subtitle ||
                "Vivah Australia helps serious singles and families discover verified, compatible matrimonial matches across Australia's Indian and South Asian community."}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#A10E4D]/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl font-poppins"
              >
                {home.hero?.primaryAction || 'Create Free Profile'}
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/matches"
                className="rounded-full border border-[#A10E4D]/20 bg-white/50 px-8 py-4 text-sm font-bold text-[#A10E4D] backdrop-blur-sm transition-all duration-300 hover:bg-white hover:border-[#A10E4D]/40 font-poppins"
              >
                {home.hero?.secondaryAction || 'Explore Matches'}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#5F5F5F]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#1F9D68]" /> Verified Profiles
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-4 text-[#D4A04C]" /> Privacy First
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="size-4 text-[#E74C7C]" /> Serious Matchmaking
              </span>
            </div>
          </motion.div>

          {/* Floating Cards Mockup */}
          <div className="relative h-[450px] lg:h-[550px] w-full hidden md:block">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-10 right-10 z-20 w-[280px] bg-white/80 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-2xl shadow-[#A10E4D]/10"
            >
              <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-[#A10E4D]/10 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80"
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Gold Verified
                </div>
              </div>
              <h3 className="font-semibold text-lg text-[#2F2F2F] font-cormorant">Priya, 29</h3>
              <p className="text-xs text-[#5F5F5F] mt-1">Melbourne • Software Engineer</p>
              <div className="mt-3 bg-[#FFF9F5] rounded-xl p-2.5 flex items-center justify-between border border-[#A10E4D]/5">
                <span className="text-xs font-medium text-[#5F5F5F]">Compatibility</span>
                <span className="text-xs font-bold text-[#A10E4D]">94% Match</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-10 left-10 z-10 w-[260px] bg-white/90 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-2xl shadow-[#D4A04C]/15"
            >
              <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-[#D4A04C]/10 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80"
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg text-[#2F2F2F] font-cormorant">Arjun, 32</h3>
              <p className="text-xs text-[#5F5F5F] mt-1">Sydney • Finance</p>
              <div className="mt-3 w-full bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] text-white rounded-xl py-2 text-center text-xs font-bold shadow-md">
                New Match Request
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Search Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-0 w-full px-5 lg:px-8 translate-y-1/2 z-30"
        >
          <div className="max-w-5xl mx-auto bg-white rounded-2xl lg:rounded-full shadow-2xl shadow-[#A10E4D]/10 border border-[#A10E4D]/5 p-4 lg:p-3">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col lg:flex-row items-center gap-3 w-full"
            >
              <span className="hidden lg:block pl-4 text-sm font-bold text-[#2F2F2F]">
                I am looking for
              </span>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value as 'MALE' | 'FEMALE')}
                className="w-full lg:w-auto h-12 bg-[#FFF9F5] rounded-full px-4 text-sm font-medium text-[#5F5F5F] border-none outline-none focus:ring-2 focus:ring-[#A10E4D]/20"
              >
                <option value="FEMALE">A Woman</option>
                <option value="MALE">A Man</option>
              </select>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full lg:w-auto h-12 bg-[#FFF9F5] rounded-full px-4 text-sm font-medium text-[#5F5F5F] border-none outline-none focus:ring-2 focus:ring-[#A10E4D]/20"
              >
                <option value="25-30">Age 25 - 30</option>
                <option value="30-35">Age 30 - 35</option>
                <option value="35-40">Age 35 - 40</option>
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full lg:w-auto h-12 bg-[#FFF9F5] rounded-full px-4 text-sm font-medium text-[#5F5F5F] border-none outline-none focus:ring-2 focus:ring-[#A10E4D]/20"
              >
                <option value="Sydney">In Sydney</option>
                <option value="Melbourne">In Melbourne</option>
                <option value="Brisbane">In Brisbane</option>
                <option value="Anywhere">Anywhere in AU</option>
              </select>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full lg:w-auto h-12 bg-[#FFF9F5] rounded-full px-4 text-sm font-medium text-[#5F5F5F] border-none outline-none focus:ring-2 focus:ring-[#A10E4D]/20"
              >
                <option value="Any">Any Community</option>
                <option value="Hindu">Hindu</option>
                <option value="Sikh">Sikh</option>
                <option value="Muslim">Muslim</option>
              </select>
              <button
                type="submit"
                className="w-full lg:w-auto flex-1 h-12 bg-[#D4A04C] text-white font-bold text-sm rounded-full shadow-md hover:opacity-90 transition-opacity ml-auto"
              >
                Start Matching
              </button>
            </form>
          </div>
        </motion.div>
      </section>
      <div className="h-24 lg:h-16" /> {/* Spacer for overflowing widget */}
      {/* 3. Trust Stats Strip */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-[#A10E4D]/10">
          <FadeIn delay={0.1}>
            <div className="text-3xl lg:text-4xl font-playfair font-bold text-[#A10E4D] mb-2">
              10k+
            </div>
            <div className="text-xs lg:text-sm font-semibold text-[#5F5F5F] uppercase tracking-wider">
              Verified Profiles
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="text-3xl lg:text-4xl font-playfair font-bold text-[#A10E4D] mb-2">
              100%
            </div>
            <div className="text-xs lg:text-sm font-semibold text-[#5F5F5F] uppercase tracking-wider">
              Privacy Controlled
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="text-3xl lg:text-4xl font-playfair font-bold text-[#A10E4D] mb-2">AU</div>
            <div className="text-xs lg:text-sm font-semibold text-[#5F5F5F] uppercase tracking-wider">
              Local Community
            </div>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="text-3xl lg:text-4xl font-playfair font-bold text-[#A10E4D] mb-2">#1</div>
            <div className="text-xs lg:text-sm font-semibold text-[#5F5F5F] uppercase tracking-wider">
              For Serious Bonds
            </div>
          </FadeIn>
        </div>
      </section>
      {/* 4. How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#FFF9F5]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16 font-poppins">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4A04C] mb-3">
              Simple & Safe
            </h2>
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F]">
              A simpler, safer way to find the right match.
            </h3>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Create Your Profile',
                body:
                  home.howItWorks?.[0] ||
                  'Add your personal, family, education, and partner preferences in a guided setup.',
                icon: UserPlus,
              },
              {
                title: 'Get Verified',
                body:
                  home.howItWorks?.[1] ||
                  'Build trust with email, mobile, ID, address, and employment document reviews.',
                icon: ShieldCheck,
              },
              {
                title: 'Discover Matches',
                body:
                  home.howItWorks?.[2] ||
                  'Search by age, religion, community, education, profession, and verification status.',
                icon: Search,
              },
              {
                title: 'Connect Confidently',
                body:
                  home.howItWorks?.[3] ||
                  'Send interests and start private conversations only when both sides are comfortable.',
                icon: Heart,
              },
            ].map((step, idx) => (
              <FadeIn
                key={step.title}
                delay={idx * 0.1}
                className="group bg-white rounded-3xl p-8 shadow-sm border border-[#A10E4D]/5 hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
              >
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#FFF9F5] to-[#FFF5EF] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="size-8 text-[#E74C7C]" />
                </div>
                <h4 className="text-lg font-bold text-[#2F2F2F] mb-3 font-cormorant">{step.title}</h4>
                <p className="text-sm text-[#5F5F5F] leading-relaxed">{step.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 5. Featured Verified Profiles */}
      <section id="matches" className="py-20 lg:py-28 bg-[#FFF9F5] overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl font-poppins">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E74C7C] mb-3">
                Featured Today
              </h2>
              <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F]">
                Meet our actively boosted members.
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGenderFilter('ALL')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  genderFilter === 'ALL'
                    ? 'bg-[#A10E4D] text-white shadow-md'
                    : 'border border-[#A10E4D]/20 text-[#A10E4D] hover:bg-[#FFF9F5]'
                }`}
              >
                All Matches
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('FEMALE')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  genderFilter === 'FEMALE'
                    ? 'bg-[#A10E4D] text-white shadow-md'
                    : 'border border-[#A10E4D]/20 text-[#A10E4D] hover:bg-[#FFF9F5]'
                }`}
              >
                Brides (Female)
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('MALE')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  genderFilter === 'MALE'
                    ? 'bg-[#A10E4D] text-white shadow-md'
                    : 'border border-[#A10E4D]/20 text-[#A10E4D] hover:bg-[#FFF9F5]'
                }`}
              >
                Grooms (Male)
              </button>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.slice(0, 3).map((profile, i) => (
                <FadeIn key={profile.displayId} delay={i * 0.1}>
                  <ProfileMatchCard
                    compact
                    profile={{
                      age: profile.personal?.age,
                      city: profile.location?.city ?? profile.location?.state,
                      id: profile._id ?? profile.displayId,
                      matchScore: 95,
                      name: profile.personal?.firstName ?? 'Vivah member',
                      occupation: profile.employment?.occupation ?? 'Professional',
                      religion: profile.religion?.religion,
                      slug: profile.slug,
                      verificationLevel: profile.verification?.level ?? 'VERIFIED',
                      isBoosted: profile.isBoosted,
                    }}
                    actions={
                      <div className="grid gap-3 sm:grid-cols-2">
                        <PremiumButton
                          href={`/profiles/${profile.slug || profile._id || profile.displayId}`}
                          variant="secondary"
                        >
                          View Profile
                        </PremiumButton>
                        <PremiumButton href="/register">Send Interest</PremiumButton>
                      </div>
                    }
                  />
                </FadeIn>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#A10E4D]/5">
                <p className="text-sm font-semibold text-[#5F5F5F]">
                  No featured matches found for the selected gender filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* 6. Smart Matchmaking */}
      <section className="py-20 lg:py-28 bg-[#FFF9F5]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn className="relative h-[500px] rounded-[2rem] bg-white border border-[#A10E4D]/10 shadow-2xl p-6 hidden md:flex flex-col gap-4 font-poppins">
            <div className="flex items-center justify-between border-b border-[#A10E4D]/5 pb-4">
              <div className="flex gap-6">
                <span className="font-bold text-[#A10E4D] border-b-2 border-[#A10E4D] pb-4 -mb-4">
                  Recommended
                </span>
                <span className="font-medium text-[#5F5F5F]">New</span>
              </div>
              <Sparkles className="size-5 text-[#D4A04C]" />
            </div>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex gap-4 p-4 rounded-2xl bg-[#FFF9F5] border border-[#A10E4D]/5 items-center"
              >
                <div className="size-16 rounded-full bg-[#A10E4D]/10 flex items-center justify-center font-playfair text-xl font-bold text-[#A10E4D]">
                  A
                </div>
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-[#5F5F5F]/20 rounded-full mb-2" />
                  <div className="h-3 w-1/2 bg-[#5F5F5F]/10 rounded-full" />
                </div>
                <div className="size-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Heart className="size-4 text-[#E74C7C]" />
                </div>
              </div>
            ))}
            <div className="absolute -right-8 top-20 bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] text-white p-4 rounded-2xl shadow-xl">
              <p className="text-xs font-bold uppercase mb-1">New Match Alert</p>
              <p className="text-sm font-medium">Someone highly compatible joined!</p>
            </div>
          </FadeIn>

          <FadeIn>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4A04C] mb-3">
              Smart Discovery
            </h2>
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F] mb-6">
              Matchmaking that respects culture, values, and modern life.
            </h3>
            <p className="text-lg text-[#5F5F5F] mb-8 leading-relaxed">
              We blend advanced search capabilities with smart recommendations to help you find
              matches that align with your lifestyle and family expectations.
            </p>
            <ul className="grid sm:grid-cols-2 gap-4">
              {[
                'Advanced search filters',
                'Partner preference matching',
                'Compatibility indicators',
                'Recently active profiles',
                'Verified profile priority',
                'Saved favourites & shortlist',
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm font-bold text-[#2F2F2F]"
                >
                  <CheckCircle className="size-5 text-[#1F9D68]" /> {feature}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>
      {/* 7. Verification and Safety */}
      <section
        id="verification"
        className="py-20 lg:py-28 bg-[#2F2F2F] text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=20')] opacity-5 mix-blend-screen" />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10 font-poppins">
          <FadeIn className="text-center max-w-3xl mx-auto mb-16">
            <Shield className="size-12 text-[#D4A04C] mx-auto mb-6" />
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold mb-6">
              Trust is built into every step.
            </h3>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-6">
              Vivah Australia gives members control over visibility, privacy, verification, and
              communication so every connection feels safer and more intentional.
            </p>
            {home.safety?.length ? (
              <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium text-white/80">
                {home.safety.map((point) => (
                  <span
                    key={point}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full"
                  >
                    <ShieldCheck className="size-4 text-[#1F9D68]" /> {point}
                  </span>
                ))}
              </div>
            ) : null}
          </FadeIn>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { l: 'Basic', d: 'Email + Mobile Verified', c: 'border-white/10' },
              { l: 'Silver', d: 'ID Document Reviewed', c: 'border-[#a8aeb8]/40' },
              {
                l: 'Gold',
                d: 'Address / Employment',
                c: 'border-[#D4A04C]/60 shadow-[0_0_15px_rgba(212,160,76,0.2)]',
              },
              { l: 'Platinum', d: 'Advanced Verification', c: 'border-[#b4b4b4]/60' },
              {
                l: 'Fully Verified',
                d: 'Highest Trust Level',
                c: 'border-[#1F9D68]/60 bg-[#1F9D68]/10',
              },
            ].map((badge, i) => (
              <FadeIn
                key={badge.l}
                delay={i * 0.1}
                className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 border ${badge.c} text-center`}
              >
                <Award
                  className={`size-8 mx-auto mb-4 ${badge.l === 'Gold' ? 'text-[#D4A04C]' : 'text-white/60'}`}
                />
                <h4 className="font-bold text-lg mb-2">{badge.l}</h4>
                <p className="text-xs text-white/60 uppercase tracking-wider">{badge.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 8. Success Stories */}
      <section id="stories" className="py-20 lg:py-28 bg-[#FFF9F5]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-16 font-poppins">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E74C7C] mb-3">
              Success Stories
            </h2>
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F]">
              Real stories. Meaningful connections.
            </h3>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {stories.slice(0, 3).map((story, i) => (
              <FadeIn
                key={i}
                delay={i * 0.1}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#A10E4D]/5 relative font-poppins"
              >
                <div className="absolute -top-5 -left-5 text-6xl text-[#D4A04C]/20 font-playfair">
                  &quot;
                </div>
                <p className="text-[#5F5F5F] italic leading-relaxed relative z-10 mb-6">
                  &quot;
                  {story.body ||
                    story.quote ||
                    'We connected through shared values and honest conversations. Vivah helped us find someone serious and aligned with our future.'}
                  &quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-[#A10E4D]/10 flex items-center justify-center">
                    <Heart className="size-5 text-[#A10E4D]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2F2F2F] font-cormorant">{story.title || 'Happy Couple'}</h4>
                    <p className="text-xs text-[#5F5F5F] uppercase">Verified Members</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <FadeIn
                key={testimonial.name ?? `testimonial-${index}`}
                delay={index * 0.1}
                className="rounded-3xl border border-[#A10E4D]/5 bg-white/70 p-6 font-poppins"
              >
                <p className="text-sm italic leading-7 text-[#5F5F5F]">
                  &quot;
                  {testimonial.quote ?? testimonial.body ?? 'A thoughtful matrimonial experience.'}
                  &quot;
                </p>
                <p className="mt-4 text-sm font-bold text-[#A10E4D]">
                  {testimonial.name ?? 'Vivah Australia member'}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 9. Membership Plans */}
      <section id="membership" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16 font-poppins">
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F] mb-4">
              Choose your journey
            </h3>
            <p className="text-[#5F5F5F]">
              Start free, and upgrade when connection tools become valuable. Plans and pricing are
              transparent.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => {
              const isPremium = plan.code === 'PLATINUM' || plan.code === 'GOLD';
              return (
                <FadeIn
                  key={plan.code}
                  delay={i * 0.1}
                  className={`relative rounded-3xl p-8 border ${isPremium ? 'border-[#D4A04C] bg-gradient-to-b from-white to-[#FFF9F5] shadow-xl shadow-[#D4A04C]/10' : 'border-[#A10E4D]/10 bg-white shadow-sm'}`}
                >
                  {plan.code === 'PLATINUM' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4A04C] text-[#2F2F2F] text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full font-poppins">
                      Most Premium
                    </div>
                  )}
                  <h4
                    className={`text-xl font-bold ${isPremium ? 'text-[#D4A04C]' : 'text-[#A10E4D]'} mb-2 font-cormorant`}
                  >
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mb-6 font-poppins">
                    <span className="text-4xl font-playfair font-bold text-[#2F2F2F]">
                      {formatMoney(plan.priceCents, plan.currency)}
                    </span>
                    {plan.priceCents > 0 && (
                      <span className="text-sm text-[#5F5F5F]">/{plan.interval.toLowerCase()}</span>
                    )}
                  </div>
                  <ul className="space-y-4 mb-8 font-poppins">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-[#5F5F5F] font-medium"
                      >
                        <CheckCircle
                          className={`size-4 mt-0.5 shrink-0 ${isPremium ? 'text-[#D4A04C]' : 'text-[#A10E4D]/60'}`}
                        />{' '}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3 rounded-full text-center text-sm font-bold transition-all font-poppins ${
                      isPremium
                        ? 'bg-[#D4A04C] text-[#2F2F2F] hover:opacity-90 shadow-md'
                        : 'bg-white border-2 border-[#A10E4D]/20 text-[#A10E4D] hover:bg-[#E74C7C]/10'
                    }`}
                  >
                    {plan.priceCents === 0 ? 'Start Free' : `Choose ${plan.name}`}
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>
      {/* 10. Community Discovery */}
      <section className="py-20 lg:py-28 bg-[#FFF9F5]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-12 font-poppins">
            <h3 className="text-2xl lg:text-3xl font-playfair font-bold text-[#2F2F2F]">
              Find matches across Australia&apos;s vibrant communities.
            </h3>
          </FadeIn>
          <div className="flex flex-wrap justify-center gap-3 font-poppins">
            {communities.map((c, i) => (
              <FadeIn key={c} delay={i * 0.05}>
                <Link
                  href="/register"
                  className="block bg-white border border-[#A10E4D]/10 px-5 py-3 rounded-full text-sm font-bold text-[#5F5F5F] hover:border-[#E74C7C] hover:text-[#A10E4D] hover:shadow-md transition-all"
                >
                  {c}
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 11. Blog & Guidance */}
      <section id="blog" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="mb-12 font-poppins">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E74C7C] mb-3">
              Guidance
            </h2>
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F]">
              Insights for your matchmaking journey.
            </h3>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8 font-poppins">
            {blogs.slice(0, 3).map((blog, i) => (
              <FadeIn key={i} delay={i * 0.1} className="group cursor-pointer">
                <div className="w-full h-48 bg-[#FFF9F5] rounded-3xl mb-5 flex items-center justify-center group-hover:shadow-md transition-shadow border border-[#A10E4D]/5">
                  <PlayCircle className="size-10 text-[#A10E4D]/30" />
                </div>
                <p className="text-xs font-bold uppercase text-[#D4A04C] mb-2">Advice</p>
                <h4 className="text-lg font-bold text-[#2F2F2F] mb-3 group-hover:text-[#A10E4D] transition-colors font-cormorant">
                  {blog.title}
                </h4>
                <p className="text-sm text-[#5F5F5F] line-clamp-2 mb-4">
                  {blog.body ||
                    'Learn more about creating meaningful connections safely and securely.'}
                </p>
                <span className="text-sm font-bold text-[#A10E4D] flex items-center gap-1">
                  Read More <ChevronRight className="size-4" />
                </span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 12. FAQ Section */}
      <section className="py-20 lg:py-28 bg-[#FFF9F5]">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-12 font-poppins">
            <h3 className="text-3xl lg:text-4xl font-playfair font-bold text-[#2F2F2F]">
              Frequently Asked Questions
            </h3>
          </FadeIn>
          <div className="space-y-4 font-poppins">
            {(home.faq?.length
              ? home.faq.map((item) => ({ q: item.question ?? '', a: item.answer ?? '' }))
              : faqs
            ).map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-[#A10E4D]/10 overflow-hidden">
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-[#2F2F2F] font-cormorant">{faq.q}</span>
                    <ChevronDown
                      className={`size-5 text-[#A10E4D] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="px-6 pb-5 text-sm text-[#5F5F5F] leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      {/* 13. Final CTA */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#A10E4D] to-[#6c002c] text-white text-center font-poppins">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=20')] opacity-10 mix-blend-overlay" />
        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <FadeIn>
            <h2 className="text-4xl lg:text-5xl font-playfair font-bold mb-6">
              Start your journey toward a meaningful match.
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Create your free profile today and discover serious, verified matrimonial matches
              across Australia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-[#D4A04C] px-8 py-4 text-sm font-bold text-white shadow-xl hover:opacity-90 transition-opacity"
              >
                Create Free Profile
              </Link>
              <Link
                href="#membership"
                className="rounded-full border-2 border-white/30 bg-white/5 backdrop-blur px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                Explore Memberships
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
