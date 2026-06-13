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
    <section className="relative overflow-hidden border-b border-[#E74C7C]/15 bg-[linear-gradient(160deg,#FFF1F5_0%,#FFE9EF_55%,#FFF6F0_100%)] px-8 py-16 sm:px-12 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,76,124,0.14),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,160,76,0.12),transparent_45%)]" />
      <Heart className="absolute left-[5%] top-[14%] size-5 animate-pulse fill-[#E74C7C]/30 text-[#E74C7C]/30" />
      <Heart className="absolute right-[8%] top-[20%] size-4 animate-pulse fill-[#D4A04C]/35 text-[#D4A04C]/35" />
      <Heart className="absolute bottom-[18%] left-[12%] size-3.5 animate-pulse fill-[#E74C7C]/25 text-[#E74C7C]/25" />
      <Heart className="absolute bottom-[12%] right-[5%] size-6 animate-pulse fill-[#E74C7C]/20 text-[#E74C7C]/20" />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E74C7C]/30 bg-white/80 px-4 py-2 backdrop-blur-sm">
            <Heart className="size-3.5 fill-[#E74C7C] text-[#E74C7C]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#A10E4D]">
              Real stories of love
            </span>
          </div>
          <div className="mt-6">
            <AnimatedWordPlay 
              eyebrow="Premium Indian Matrimony"
              prefix="Your Search for"
              words={['Love', 'Companionship', 'Forever', 'Connection']}
              suffix=" Ends Here."
              body="Experience Australia’s most trusted Indian matrimony platform. We combine 100% verified profiles with personalized matchmaking to help you find a partner who shares your cultural roots and Australian lifestyle." 
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#E74C7C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_38px_rgba(231,76,124,0.35)] transition hover:-translate-y-0.5 hover:bg-[#D63D6D]"
            >
              <Heart className="size-4 fill-white" />
              Start Your Journey
            </a>
            <a
              href="/blog"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E74C7C]/35 bg-white px-7 py-3.5 text-sm font-bold text-[#A10E4D] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF1F5]"
            >
              See Success Stories
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rotate-2 rounded-2xl bg-white p-4 pb-16 shadow-[0_30px_70px_rgba(161,14,77,0.16)] transition duration-300 hover:rotate-0">
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
            <p className="absolute bottom-5 left-0 right-0 text-center font-cormorant text-2xl font-semibold italic text-[#2f2f2f]">
              Neha &amp; Chirag — Melbourne ♥
            </p>
          </div>
          <div className="absolute -left-6 -top-6 -z-10 hidden h-36 w-32 -rotate-6 rounded-xl bg-white p-2 shadow-[0_18px_44px_rgba(161,14,77,0.12)] lg:block">
            <div className="h-full w-full rounded-md bg-[#FFE9EF]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ComprehensiveClient({ data }: { data: any }) {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f] overflow-x-hidden">
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
               <h2 className="font-playfair text-3xl font-bold text-[#2f2f2f]">Connect with Compatible Indian Singles Across Australia</h2>
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
