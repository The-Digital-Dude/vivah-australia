'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/app/components';
import { HeroSearchForm } from '@/app/components/home/hero-search-form';
import { PremiumFloatingElements } from '@/app/components/premium-floating-elements';
import { AnimatedWordPlay } from '../[variant]/animated-word-play';

// Dynamic imports for below-the-fold components to optimize page load
const BentoSuccessStories = dynamic(() => import('@/app/components/bento-success-stories').then(mod => mod.BentoSuccessStories), { ssr: true });
const CommunityStatsStrip = dynamic(() => import('@/app/components/home/community-stats-strip').then(mod => mod.CommunityStatsStrip), { ssr: true });
const TrustVerificationStrip = dynamic(() => import('@/app/components/home/trust-verification-strip').then(mod => mod.TrustVerificationStrip), { ssr: true });
const HowItWorksSection = dynamic(() => import('@/app/components/home/how-it-works-section').then(mod => mod.HowItWorksSection), { ssr: true });
const RevampedMembershipCards = dynamic(() => import('@/app/components/revamped-membership-cards').then(mod => mod.RevampedMembershipCards), { ssr: true });
const RedesignedFaqSection = dynamic(() => import('@/app/components/redesigned-faq').then(mod => mod.RedesignedFaqSection), { ssr: true });

// This is the StoryVariantHero adapted for our comprehensive page
function StoryHero({ data }: { data: any }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-[#0B0407] px-8 py-16 sm:px-12 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(161,14,77,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,160,76,0.15),transparent_45%)]" />
      <Heart className="absolute left-[5%] top-[14%] size-5 animate-pulse fill-[#E74C7C]/30 text-[#E74C7C]/30" />
      <Heart className="absolute right-[8%] top-[20%] size-4 animate-pulse fill-[#D4A04C]/40 text-[#D4A04C]/40" />
      <Heart className="absolute bottom-[18%] left-[12%] size-3.5 animate-pulse fill-[#E74C7C]/25 text-[#E74C7C]/25" />
      <Heart className="absolute bottom-[12%] right-[5%] size-6 animate-pulse fill-[#E74C7C]/20 text-[#E74C7C]/20" />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <Heart className="size-3.5 fill-[#D4A04C] text-[#D4A04C]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#D4A04C]">
              Real stories of love
            </span>
          </div>
            <AnimatedWordPlay 
              theme="dark"
              eyebrow="Premium Indian Matrimony"
              prefix="Your Search for"
              words={['Love', 'Companionship', 'Forever', 'Connection']}
              suffix=" Ends Here."
              body="Experience Australia’s most trusted Indian matrimony platform. We combine 100% verified profiles with personalized matchmaking to help you find a partner who shares your cultural roots and Australian lifestyle." 
            />
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(231,76,124,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(231,76,124,0.6)]"
            >
              <Heart className="size-4 fill-white" />
              Find Your Match
            </a>
            <a
              href="/blog"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              See Success Stories
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rotate-2 rounded-2xl border border-white/10 bg-white/5 p-4 pb-16 backdrop-blur-lg shadow-[0_0_40px_rgba(161,14,77,0.2)] transition duration-300 hover:rotate-0 hover:shadow-[0_0_50px_rgba(161,14,77,0.3)]">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src="/home/success-stories/couple-02.jpg"
                alt="Vivah Australia success story"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </div>
            <p className="absolute bottom-5 left-0 right-0 text-center font-cormorant text-2xl font-semibold italic text-white/90">
              Neha &amp; Chirag — Melbourne ♥
            </p>
          </div>
          <div className="absolute -left-6 -top-6 -z-10 hidden h-36 w-32 -rotate-6 rounded-xl border border-white/5 bg-white/5 p-2 backdrop-blur-md lg:block">
            <div className="h-full w-full rounded-md bg-gradient-to-br from-[#A10E4D]/20 to-[#E74C7C]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ComprehensiveClient({ data }: { data: any }) {
  return (
    <main className="min-h-screen bg-[#0B0407] text-[#FAFAFA] overflow-x-hidden">
      <PublicHeader />
      
      <PremiumFloatingElements>
        {/* 1. Header from "story homepage" */}
        <StoryHero data={data} />

        {/* Metric Strip moved to right after the hero */}
        <div className="py-4">
          <CommunityStatsStrip />
        </div>

        {/* 2. Search Section from "current homepage" */}
        <section className="px-8 pt-8 pb-4 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-8">
               <h2 className="font-playfair text-3xl font-bold text-white">Connect with Compatible Indian Singles Across Australia</h2>
            </div>
            <HeroSearchForm />
          </div>
        </section>

        {/* 3. Success Story from "current homepage" (Bento style) */}
        <BentoSuccessStories />

        {/* Trust Strip */}
        <TrustVerificationStrip />

        {/* 4. How Vivah Australia Works from "animated homepage" */}
        <HowItWorksSection />

        {/* 5. Subscription/membership revamped */}
        <RevampedMembershipCards />

        {/* 6. FAQ Section redesigned */}
        <RedesignedFaqSection />

      </PremiumFloatingElements>

      <PublicFooter />
    </main>
  );
}
