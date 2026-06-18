'use client';

import { ProfileMatchCard, PublicHeader, PublicFooter } from '@/app/components';
import Image from 'next/image';
import Link from 'next/link';
import { Users, ShieldCheck, MapPin, LockKeyhole, Search, Sparkles, Heart, ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { FinalSuccessSlider } from '@/app/components/home/final-success-slider';
import type { FeaturedProfile } from '@/lib/public-api';

function formatRelativeDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

export default function FinalHomepageClient({
  featuredProfiles = [],
}: Readonly<{ featuredProfiles?: FeaturedProfile[] }>) {
  const router = useRouter();
  const { token, initialized } = useAuth();
  const [lookingFor, setLookingFor] = useState('Female');
  const [ageRange, setAgeRange] = useState('22 - 40');
  const [location, setLocation] = useState('All Australia');
  const [community, setCommunity] = useState('All');

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('gender', lookingFor === 'Male' ? 'MALE' : 'FEMALE');
    const [min, max] = ageRange.split('-').map((s) => s.trim());
    if (min) params.set('ageMin', min);
    if (max) params.set('ageMax', max);
    if (location !== 'All Australia') params.set('city', location);
    if (community !== 'All') params.set('community', community);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col font-poppins selection:bg-brand-gold/20 selection:text-brand-maroon">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pb-32 lg:pb-48 xl:pb-56 overflow-hidden bg-brand-maroon sm:bg-transparent">
          
          {/* Mobile Image */}
          <div className="relative w-full aspect-[4/3] sm:hidden">
            <Image
              src="/home/hero-bg-attached.jpg"
              alt="Vivah Australia Couple"
              fill
              priority
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-maroon/30 to-brand-maroon" />
          </div>

          {/* Desktop Background Image & Overlay */}
          <div className="hidden sm:block absolute inset-0 z-0">
            <Image
              src="/home/hero-bg-attached.jpg"
              alt="Vivah Australia Couple"
              fill
              priority
              className="object-cover object-top"
            />
            {/* Deep maroon gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-maroon from-20% via-brand-maroon/85 via-45% to-transparent to-65%" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 from-0% to-transparent to-45%" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.15),transparent_60%)]" />
          </div>

          <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-[120px]">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4 sm:mb-6 flex items-center gap-2">
                Australia&apos;s Premium Indian Matrimonial Platform
              </p>

              {/* Headings */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] text-white font-playfair mb-2">
                Meaningful Connections.
              </h1>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] text-brand-gold font-playfair mb-6">
                Lifetime Together.
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-xl mb-8">
                A trusted space for Indian singles and families across all communities and backgrounds to build genuine, lifelong relationships.
              </p>

              {/* Tagline */}
              <div className="flex items-center gap-2 mb-10">
                <span className="text-brand-gold font-medium text-base sm:text-lg">Connecting Hearts. Creating Futures.</span>
                <Heart className="size-5 text-brand-gold fill-transparent stroke-2" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-14">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold w-full sm:w-auto"
                >
                  Create Your Profile <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/matches"
                  className="inline-flex items-center justify-center gap-2 rounded border border-white/40 bg-transparent px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 w-full sm:w-auto"
                >
                  Browse Members <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Stats / Trust Signals */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 border-t border-white/20 pt-8">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-gold"><Users className="size-5 sm:size-6" /></div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg">10,000+</p>
                    <p className="text-white/60 text-sm">Members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-gold"><ShieldCheck className="size-5 sm:size-6" /></div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg">5,000+</p>
                    <p className="text-white/60 text-sm">Verified Profiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-gold"><MapPin className="size-5 sm:size-6" /></div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg">Australia Wide</p>
                    <p className="text-white/60 text-sm">Across All States</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-brand-gold"><LockKeyhole className="size-5 sm:size-6" /></div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg">100%</p>
                    <p className="text-white/60 text-sm">Private & Secure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH WIDGET (Overlapping Hero) */}
        <section className="relative z-20 px-4 sm:px-6 lg:px-8 -mt-24 mb-20 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_16px_rgba(161,14,77,0.08)] p-6 sm:p-8">

            {/* Title row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-5 text-brand-gold" />
                <h3 className="text-xl font-playfair font-bold text-brand-charcoal">Find Your Perfect Match</h3>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-brand-maroon/50" />
                <span className="text-xs font-medium text-gray-400">Every profile verified</span>
              </div>
            </div>

            {/* Filter grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">

              <div className="lg:col-span-1 group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="size-3 text-brand-maroon" />
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-maroon">Looking For</label>
                </div>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-brand-ivory/50 px-4 py-3.5 pr-10 text-sm font-semibold text-brand-charcoal outline-none transition focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10 cursor-pointer"
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                  >
                    <option value="Female">A Bride</option>
                    <option value="Male">A Groom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-brand-gold" />
                </div>
              </div>

              <div className="lg:col-span-1 group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="size-3 text-brand-maroon" />
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-maroon">Age Range</label>
                </div>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-brand-ivory/50 px-4 py-3.5 pr-10 text-sm font-semibold text-brand-charcoal outline-none transition focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10 cursor-pointer"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                  >
                    <option value="18 - 25">18 – 25 years</option>
                    <option value="22 - 30">22 – 30 years</option>
                    <option value="22 - 40">22 – 40 years</option>
                    <option value="25 - 35">25 – 35 years</option>
                    <option value="30 - 45">30 – 45 years</option>
                    <option value="35 - 50">35 – 50 years</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-brand-gold" />
                </div>
              </div>

              <div className="lg:col-span-1 group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="size-3 text-brand-maroon" />
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-maroon">Location</label>
                </div>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-brand-ivory/50 px-4 py-3.5 pr-10 text-sm font-semibold text-brand-charcoal outline-none transition focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10 cursor-pointer"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="All Australia">All Australia</option>
                    <option value="Sydney">Sydney, NSW</option>
                    <option value="Melbourne">Melbourne, VIC</option>
                    <option value="Brisbane">Brisbane, QLD</option>
                    <option value="Perth">Perth, WA</option>
                    <option value="Adelaide">Adelaide, SA</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-brand-gold" />
                </div>
              </div>

              <div className="lg:col-span-1 group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="size-3 text-brand-maroon" />
                  <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-maroon">Community</label>
                </div>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-brand-ivory/50 px-4 py-3.5 pr-10 text-sm font-semibold text-brand-charcoal outline-none transition focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10 cursor-pointer"
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                  >
                    <option value="All">All Communities</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Christian">Christian</option>
                    <option value="Jain">Jain</option>
                    <option value="Buddhist">Buddhist</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-brand-gold" />
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-maroon px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#8A0C41] active:scale-[0.98] shadow-[0_4px_14px_rgba(161,14,77,0.30)]"
                >
                  <Search className="size-4 shrink-0" /> View Matches
                </button>
              </div>

            </div>

            {/* Quick filter chips */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">Popular:</span>
              {[
                { label: 'Hindu Bride 25–32', gender: 'Female', age: '25 - 35', comm: 'Hindu' },
                { label: 'Sikh Groom 28–36', gender: 'Male', age: '25 - 35', comm: 'Sikh' },
                { label: 'Muslim Bride in Sydney', gender: 'Female', age: '22 - 40', comm: 'Muslim', loc: 'Sydney' },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    setLookingFor(q.gender);
                    setAgeRange(q.age);
                    setCommunity(q.comm);
                    if (q.loc) setLocation(q.loc);
                    handleSearch();
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-maroon/15 bg-brand-ivory px-3 py-1 text-[11px] font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white hover:border-brand-maroon transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* FEATURED MEMBERS */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-[#A10E4D]/8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-2">
                  Featured Members
                </p>
                <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal">
                  Members getting noticed right now
                </h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-gray-500">
                  A live row of active profiles, with boosted members prioritised the same way discovery already works across the platform.
                </p>
              </div>
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-maroon hover:underline"
              >
                Browse all members <ArrowRight className="size-4" />
              </Link>
            </div>

            {featuredProfiles.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredProfiles.slice(0, 6).map((profile) => {
                  const id = profile.id || profile._id || profile.displayId;
                  return (
                    <ProfileMatchCard
                      key={profile.displayId}
                      profile={{
                        id,
                        slug: profile.slug || profile.displayId,
                        name: profile.personal?.firstName ?? 'Vivah member',
                        age: profile.personal?.age,
                        city: [profile.location?.city, profile.location?.state].filter(Boolean).join(', ') || 'Australia',
                        occupation: profile.employment?.occupation,
                        religion: profile.religion?.religion,
                        verificationLevel: profile.verification?.level,
                        isBoosted: profile.isBoosted,
                        lastActiveLabel: formatRelativeDate(profile.stats?.lastActiveAt),
                        privacyHint: profile.isBoosted
                          ? 'This member is currently using a profile boost for higher visibility.'
                          : 'Create your profile to unlock full compatibility and direct introductions.',
                      }}
                      actions={
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-medium text-[#6B7280]">
                            {profile.isBoosted
                              ? 'Boosted profiles appear first during active discovery windows.'
                              : 'More member details unlock once you create your profile.'}
                          </p>
                          <Link
                            href={profile.slug ? `/profiles/${profile.slug}` : `/profiles/${profile.displayId}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-maroon"
                          >
                            View preview <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-brand-gold/40 bg-brand-ivory px-6 py-10 text-center">
                <Sparkles className="mx-auto size-8 text-brand-gold" />
                <h3 className="mt-4 text-xl font-semibold text-brand-charcoal">
                  Featured members will appear here as profiles go live
                </h3>
                <p className="mt-3 max-w-2xl mx-auto text-sm leading-7 text-gray-500">
                  As approved members become active or use profile boosts, this row automatically updates to showcase who is trending now.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* COMMUNITY SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-ivory">
          <div className="max-w-6xl mx-auto text-center">
            {/* Eyebrow */}
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              United by Culture. Connected by Values.
            </p>
            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal mb-4">
              A Community for Every Indian
            </h2>
            {/* Divider */}
            <div className="flex items-center justify-center gap-2 mb-12">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
              <div className="size-1.5 rotate-45 bg-brand-gold" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-8 mb-12">
              {[
                { icon: Users, label: 'All Indian\nCommunities' },
                { icon: MapPin, label: 'Australian\nLifestyle' },
                { icon: Heart, label: 'Family\nValues' },
                { icon: Sparkles, label: 'Education\nFocused' }, // Placeholder for GraduationCap
                { icon: ShieldCheck, label: 'Career\nDriven' }, // Placeholder for Briefcase
                { icon: LockKeyhole, label: 'Diverse\nBackgrounds' }, // Placeholder for Globe
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center justify-center text-center p-10 sm:p-12 bg-white border border-gray-100 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                    <div className="text-brand-gold mb-6">
                      <Icon className="size-12" strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-bold text-brand-charcoal whitespace-pre-line leading-tight">{item.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Sub-text */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-gray-500">
              <span>Hindu</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span>Sikh</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span>Muslim</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span>Christian</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span>Jain</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span>Buddhist</span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span className="text-brand-maroon">All Communities Welcome</span>
              <Heart className="size-4 text-brand-maroon" />
            </div>
          </div>
        </section>

        {/* SMART MATCHMAKING SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: AI Matchmaking Card */}
            <div className="relative">
              <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-brand-charcoal">Smart Matchmaking</h3>
                  <div className="bg-brand-ivory text-brand-gold text-xs font-bold px-3 py-1.5 rounded-full">
                    AI
                  </div>
                </div>

                {/* Profiles */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 mb-6 relative">
                  {/* Heart overlapping icon */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-maroon">
                    <Heart className="size-5 fill-brand-maroon" />
                  </div>

                  {/* Profile 1 */}
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                    <Image src="/home/match-ananya.png" alt="Ananya" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-lg">Ananya, 29</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="size-2 rounded-full bg-green-500" />
                        <span className="text-white/90 text-xs font-medium">98% Match Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile 2 */}
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                    <Image src="/home/match-rohan.png" alt="Rohan" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-lg">Rohan, 31</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="size-2 rounded-full bg-green-500" />
                        <span className="text-white/90 text-xs font-medium">98% Match Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 px-2 border border-gray-100">
                    <Heart className="size-3.5 text-brand-gold" />
                    <div className="text-xs leading-tight text-gray-600">
                      <span className="block font-bold">Values</span> Aligned
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 px-2 border border-gray-100">
                    <Sparkles className="size-3.5 text-brand-gold" />
                    <div className="text-xs leading-tight text-gray-600">
                      <span className="block font-bold">Lifestyle</span> Compatible
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 px-2 border border-gray-100">
                    <MapPin className="size-3.5 text-brand-gold" />
                    <div className="text-xs leading-tight text-gray-600">
                      <span className="block font-bold">Goals</span> Similar
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 px-2 border border-gray-100">
                    <Users className="size-3.5 text-brand-gold" />
                    <div className="text-xs leading-tight text-gray-600">
                      <span className="block font-bold">Culture</span> Connected
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Text & Features */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
                Smart Matchmaking
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal mb-10">
                Intelligent Compatibility
              </h2>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-8 mb-10">
                {[
                  { icon: Heart, title: 'Lifestyle Matching', desc: 'Find someone with a compatible lifestyle' },
                  { icon: MapPin, title: 'Location Preferences', desc: 'Find matches across Australia' },
                  { icon: ShieldCheck, title: 'Values & Beliefs', desc: 'Connect on what truly matters' },
                  { icon: Sparkles, title: 'Future Goals', desc: 'Build a future with aligned dreams' },
                  { icon: LockKeyhole, title: 'Career & Education', desc: 'Match with similar professional goals' },
                  { icon: Users, title: 'Cultural Preferences', desc: 'Respecting your heritage & choices' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-brand-ivory text-brand-gold">
                      <item.icon className="size-4" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-brand-charcoal mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-brand-maroon transition hover:bg-gray-50 shadow-sm"
              >
                How It Works <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* AUSTRALIA MAP SECTION */}
        <section className="bg-brand-maroon py-20 px-4 sm:px-6 lg:px-8 border-b border-white/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">
                Australia Wide Community
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-4 leading-tight">
                Connecting Hearts<br />Across Australia
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                No matter where you are, find meaningful connections in your city and beyond.
              </p>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 rounded border border-brand-gold/50 px-6 py-3 text-base font-bold text-brand-gold transition hover:bg-brand-gold/10"
              >
                Explore Members <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Center: Map */}
            <div className="relative flex justify-center items-center">
              <div className="relative w-full max-w-[500px] aspect-[4/3]">
                <Image 
                  src="/home/australia-dotted-map.png"
                  alt="Australia Map"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(212,160,76,0.2)] mix-blend-screen [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_70%)]"
                />
                {/* Pins */}
                {[
                  { top: '56%', left: '65%' }, // Sydney
                  { top: '65%', left: '61%' }, // Melbourne
                  { top: '46%', left: '67%' }, // Brisbane
                  { top: '56%', left: '33%' }, // Perth
                  { top: '60%', left: '56%' }, // Adelaide
                ].map((pos, idx) => (
                  <div key={idx} className="absolute size-3 bg-brand-gold rounded-full shadow-[0_0_15px_#D4A04C] flex items-center justify-center animate-pulse" style={{ top: pos.top, left: pos.left }}>
                    <div className="size-1.5 bg-white rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Cities List */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 pl-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0">
              {[
                'Sydney', 'Adelaide',
                'Melbourne', 'Canberra',
                'Brisbane', 'Gold Coast',
                'Perth', 'Darwin'
              ].map((city) => (
                <div key={city} className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(212,160,76,0.1)] backdrop-blur-md transition hover:bg-white/10 hover:shadow-[0_0_25px_rgba(212,160,76,0.2)]">
                  <MapPin className="size-4 text-brand-gold drop-shadow-[0_0_8px_rgba(212,160,76,0.6)]" />
                  <span className="text-white text-sm font-semibold tracking-wide drop-shadow-md">{city}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAFETY SECTION */}
        <section className="bg-brand-maroon py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.08),transparent_50%)]" />
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.5fr_1fr] gap-12 items-center relative z-10">
            {/* Left: Icons & Text */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3 drop-shadow-[0_0_8px_rgba(212,160,76,0.4)]">
                Trust Comes First
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-12 drop-shadow-lg">
                Your Safety. Our Priority.
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                {[
                  { icon: ShieldCheck, label: 'Driver Licence\nVerification' },
                  { icon: LockKeyhole, label: 'Employment\nVerification' },
                  { icon: Users, label: 'Visa\nVerification' },
                  { icon: ShieldCheck, label: 'Police Check\nVerification' },
                  { icon: Sparkles, label: 'Manual Profile\nReview' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-4">
                    <div className="size-14 rounded-xl border border-brand-gold/40 bg-white/10 flex items-center justify-center text-brand-gold shadow-[0_0_25px_rgba(212,160,76,0.2)] backdrop-blur-md transition hover:scale-105 hover:shadow-[0_0_35px_rgba(212,160,76,0.3)]">
                      <item.icon className="size-6 drop-shadow-[0_0_10px_rgba(212,160,76,0.8)]" strokeWidth={1.5} />
                    </div>
                    <p className="text-white/90 text-xs sm:text-sm font-bold whitespace-pre-line leading-tight drop-shadow-md">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Shield & Text */}
            <div className="flex items-center gap-6 pl-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-white/10 pt-10 lg:pt-0">
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-gold blur-[60px] opacity-20 rounded-full" />
                <div className="relative size-24 sm:size-32 rounded-3xl bg-gradient-to-br from-brand-gold/40 to-[brand-maroon]/40 p-1">
                  <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-brand-maroon to-brand-maroon flex items-center justify-center border border-brand-gold/50 shadow-[inset_0_0_20px_rgba(212,160,76,0.3)]">
                    <ShieldCheck className="size-12 sm:size-16 text-brand-gold" />
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-base leading-relaxed max-w-xs">
                Multiple verification layers to ensure a safe and trustworthy environment for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* SUCCESS STORIES SECTION */}
        <FinalSuccessSlider />

        {/* MEMBERSHIP SECTION */}
        <section className="bg-brand-ivory py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-12">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-1">
                  Choose Your Membership
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-brand-charcoal">
                  Plans Designed for Meaningful Connections.
                </h2>
              </div>
              <Link href="/membership" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline">
                See all plans <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Grid Layout: 3 Pricing Cards + 1 Features Column */}
            <div className="grid lg:grid-cols-4 gap-6">
              
              {/* Card 1: Essential */}
              <div className="bg-white rounded-[24px] p-8 border border-gray-200 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-brand-charcoal text-lg mb-2">Essential</h3>
                <div className="text-4xl font-bold text-brand-charcoal mb-8 font-playfair">FREE</div>
                <ul className="space-y-4 mb-10 w-full text-left">
                  {['Create your profile', 'Browse verified members', 'Send 5 interests / month'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-gray-700 font-medium">
                      <span className="text-brand-maroon"><svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto w-full">
                  <button
                    onClick={() => router.push(initialized && token ? '/member' : '/register')}
                    className="w-full rounded-xl border border-brand-maroon py-3.5 text-base font-bold text-brand-maroon transition hover:bg-brand-maroon/5"
                  >
                    Get Started <ArrowRight className="inline-block size-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Card 2: Gold (Most Popular) */}
              <div className="bg-white rounded-[24px] p-8 border-2 border-brand-gold flex flex-col items-center text-center shadow-[0_12px_40px_rgba(212,160,76,0.18)] relative">
                <div className="absolute -top-4 right-6 bg-brand-gold text-brand-charcoal text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-sm">
                  Most Popular
                  <div className="absolute -bottom-1.5 right-2 border-[3px] border-transparent border-t-brand-gold border-r-brand-gold" />
                </div>

                <h3 className="font-bold text-brand-charcoal text-lg mb-2 mt-2">Gold</h3>
                <div className="text-4xl font-bold text-brand-maroon mb-1 font-playfair">
                  $59 <span className="text-sm font-medium text-gray-500 font-poppins">/month</span>
                </div>
                <ul className="space-y-4 mb-10 mt-7 w-full text-left">
                  {['Everything in Premium', 'Priority discovery', '4 profile boosts / month', 'Priority member care'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-gray-700 font-medium">
                      <span className="text-brand-gold"><svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto w-full">
                  <button
                    onClick={() => router.push(initialized && token ? '/pricing?tier=GOLD' : '/register?returnUrl=/pricing?tier=GOLD')}
                    className="w-full rounded-xl bg-brand-gold py-3.5 text-base font-bold text-brand-charcoal shadow-md transition hover:bg-brand-gold/90"
                  >
                    Choose Gold <ArrowRight className="inline-block size-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Card 3: Platinum */}
              <div className="bg-white rounded-[24px] p-8 border border-brand-maroon/30 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-brand-charcoal text-lg mb-2">Platinum</h3>
                <div className="text-4xl font-bold text-brand-charcoal mb-1 font-playfair">
                  $99 <span className="text-sm font-medium text-gray-500 font-poppins">/month</span>
                </div>
                <ul className="space-y-4 mb-10 mt-7 w-full text-left">
                  {['Everything in Gold', 'Dedicated profile review', 'Concierge matchmaking', 'Front-of-queue support'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-gray-700 font-medium">
                      <span className="text-brand-maroon"><svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto w-full">
                  <button
                    onClick={() => router.push(initialized && token ? '/pricing?tier=PLATINUM' : '/register?returnUrl=/pricing?tier=PLATINUM')}
                    className="w-full rounded-xl bg-brand-maroon py-3.5 text-base font-bold text-white transition hover:bg-brand-maroon/90"
                  >
                    Go Platinum <ArrowRight className="inline-block size-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* 4th Column: Features/Trust Signals */}
              <div className="bg-brand-ivory rounded-[24px] p-8 border border-brand-maroon/10 flex flex-col justify-center gap-8">
                <div className="flex gap-4">
                  <div className="shrink-0 size-12 rounded-full bg-brand-ivory border border-brand-maroon/20 flex items-center justify-center text-brand-maroon">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal text-base mb-1">100% Secure Payments</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Your transactions are safe and encrypted.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-12 rounded-full bg-brand-ivory border border-brand-maroon/20 flex items-center justify-center text-brand-maroon">
                    <LockKeyhole className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal text-base mb-1">Privacy Protected</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Your data is always confidential.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 size-12 rounded-full bg-brand-ivory border border-brand-maroon/20 flex items-center justify-center text-brand-maroon">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal text-base mb-1">Dedicated Support</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">We&apos;re here to help you every step of the way.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* APP BANNER SECTION */}
        <section className="bg-brand-maroon relative overflow-hidden border-t border-white/5 py-16 sm:py-20 lg:py-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-[1fr_1.5fr_1fr] gap-12 items-center">
              
              {/* Phones Image */}
              <div className="hidden lg:block relative h-[380px] w-full pt-12">
                <div className="absolute bottom-0 left-0 w-full h-[120%] flex items-end">
                  {/* Left Phone */}
                  <div className="w-[85%] h-full max-h-[400px] bg-black rounded-t-[40px] border-x-[8px] border-t-[8px] border-brand-gold/40 relative overflow-hidden shadow-2xl origin-bottom rotate-[-5deg] translate-x-4">
                    <Image src="/home/app-mockup-1.png" alt="App Mockup Match Profile" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                  {/* Right Phone */}
                  <div className="absolute bottom-0 right-4 w-[75%] h-full max-h-[350px] bg-black rounded-t-[36px] border-x-[8px] border-t-[8px] border-brand-gold/40 relative overflow-hidden shadow-2xl origin-bottom rotate-[5deg]">
                    <Image src="/home/app-mockup-2.png" alt="App Mockup Chat Screen" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              </div>

              {/* Text Center */}
              <div className="text-center lg:text-left py-12 lg:py-24">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-6">
                  Vivah Australia App<br />Coming Soon
                </h2>
                <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  Stay connected on the go. Find matches, start conversations and never miss an opportunity.
                </p>
              </div>

              {/* QR Code & Store Buttons Right */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-center gap-8 py-12 lg:py-24">
                <div className="flex items-center gap-6">
                  {/* QR Code placeholder */}
                  <div className="bg-white p-2 rounded-xl size-28 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-brand-charcoal fill-current">
                      <path d="M10 10h30v30H10V10zm10 10v10h10V20H20zm40-10h30v30H60V10zm10 10v10h10V20H70zM10 60h30v30H10V60zm10 10v10h10V70H20zm40-10h10v10H60V60zm20 0h10v10H80V60zm-20 20h10v10H60V80zm20 0h10v10H80V80z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold mb-1">Scan to Register</p>
                    <p className="text-white/60 text-sm">for Early Access</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* App Store button */}
                  <button className="bg-black border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-black/80 transition">
                    <svg className="size-6 text-white fill-current" viewBox="0 0 24 24"><path d="M16.365 14.123c-.021-2.613 2.138-3.882 2.235-3.94-.122-1.785-1.36-3.415-3.187-3.666-1.54-.265-3.003.805-3.795.805-.793 0-2.002-.916-3.292-.89-1.683.023-3.238.98-4.103 2.502-1.748 3.036-.445 7.534 1.258 10.02.836 1.218 1.83 2.576 3.125 2.527 1.256-.052 1.73-.814 3.25-.814 1.517 0 1.95.814 3.254.787 1.336-.023 2.181-1.22 3.008-2.43 1.054-1.547 1.488-3.045 1.509-3.122-.03-.016-2.22-.857-2.242-3.78v-.001zM15.485 5.894c.691-.84 1.157-2.008 1.03-3.171-1.004.04-2.215.666-2.928 1.503-.568.665-1.127 1.85-.98 2.998 1.118.087 2.185-.49 2.878-1.33z"/></svg>
                    <div className="text-left leading-none">
                      <p className="text-xs text-white/70">Coming Soon to</p>
                      <p className="text-sm font-bold text-white">App Store</p>
                    </div>
                  </button>

                  {/* Google Play button */}
                  <button className="bg-black border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-black/80 transition">
                    <svg className="size-6 text-white fill-current" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.165-.154-.27-.373-.27-.618v-19.14c0-.244.105-.463.27-.614zM14.62 12.828l3.195 3.195-12.012 6.89c-.276.158-.616.143-.878-.04l9.695-9.695v-.35zM15.42 12l2.678-2.678 4.298 2.464c.594.34.594 1.113 0 1.453l-4.298 2.464L15.42 12zM14.62 11.172L4.925 1.477c.262-.183.602-.198.878-.04l12.012 6.89-3.195 3.195v-.35z"/></svg>
                    <div className="text-left leading-none">
                      <p className="text-xs text-white/70">Coming Soon to</p>
                      <p className="text-sm font-bold text-white">Google Play</p>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
