'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/app/components';
import { HeroSearchForm as HeroSearchFormLight } from '@/app/components/home/hero-search-form-light';
import { PremiumFloatingElements as PremiumFloatingElementsLight } from '@/app/components/premium-floating-elements-light';
import { AnimatedWordPlay } from '../[variant]/animated-word-play';

// Dynamic imports for below-the-fold components to optimize page load
const BentoSuccessStoriesLight = dynamic(() => import('@/app/components/bento-success-stories-light').then(mod => mod.BentoSuccessStories), { ssr: true });
const CommunityStatsStripLight = dynamic(() => import('@/app/components/home/community-stats-strip-light').then(mod => mod.CommunityStatsStrip), { ssr: true });
const TrustVerificationStripLight = dynamic(() => import('@/app/components/home/trust-verification-strip-light').then(mod => mod.TrustVerificationStrip), { ssr: true });
const HowItWorksSectionLight = dynamic(() => import('@/app/components/home/how-it-works-section-light').then(mod => mod.HowItWorksSection), { ssr: true });
const RevampedMembershipCardsLight = dynamic(() => import('@/app/components/revamped-membership-cards-light').then(mod => mod.RevampedMembershipCards), { ssr: true });
const RedesignedFaqSectionLight = dynamic(() => import('@/app/components/redesigned-faq-light').then(mod => mod.RedesignedFaqSection), { ssr: true });

// Removed PremiumFloatingElementsLight

// This is the StoryHero adapted for our editorial comprehensive page
function StoryHero({ data }: { data: any }) {
  return (
    <section className="relative overflow-hidden border-b border-[#E74C7C]/10 bg-white px-8 py-20 sm:px-12 lg:px-16">
      {/* Crisp White Background, No glowing orbs */}

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
              theme="light"
              eyebrow="Premium Indian Matrimony"
              prefix="Your Search for"
              words={['Love', 'Companionship', 'Forever', 'Connection']}
              suffix=" Ends Here."
              body="Experience AustraliaÎ“Ã‡Ã–s most trusted Indian matrimony platform. We combine 100% verified profiles with personalized matchmaking to help you find a partner who shares your cultural roots and Australian lifestyle." 
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
          <div className="rotate-1 rounded-sm bg-white p-4 pb-20 shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-[#E74C7C]/10 transition duration-500 hover:rotate-0 hover:-translate-y-2">
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
            <p className="absolute bottom-6 left-0 right-0 text-center font-cormorant text-2xl font-semibold italic text-[#1A1A1A]">
              Neha &amp; Chirag &mdash; Melbourne
            </p>
          </div>
          <div className="absolute -left-8 -top-8 -z-10 hidden h-48 w-40 -rotate-3 bg-[#FFF9F5] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#D4A04C]/15 lg:block">
          </div>
        </div>
      </div>
    </section>
  );
}

export function ComprehensiveLightClient({ data }: { data?: any }) {
  return (
    <main className="min-h-screen bg-white text-[#1A1A1A] overflow-x-hidden">
      <PublicHeader />
      
      {/* 1. Header from "story homepage" */}
      <StoryHero data={data} />

      {/* Metric Strip moved to right after the hero */}
      <div className="bg-[#FFF9F5] py-16">
        <CommunityStatsStripLight />
      </div>

      {/* 2. Search Section from "current homepage" */}
      <section className="bg-white px-8 pt-16 pb-10 sm:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
             <h2 className="font-playfair text-4xl font-bold text-[#1A1A1A]">Connect with Compatible Indian Singles Across Australia</h2>
          </div>
          <HeroSearchFormLight />
        </div>
      </section>

      {/* 3. Success Story from "current homepage" (Bento style) */}
      <BentoSuccessStoriesLight />

      {/* Trust Strip */}
      <TrustVerificationStripLight />

      {/* 4. How Vivah Australia Works from "animated homepage" */}
      <HowItWorksSectionLight />

      {/* 5. Subscription/membership revamped */}
      <RevampedMembershipCardsLight />

      {/* 6. FAQ Section redesigned */}
      <RedesignedFaqSectionLight />

      <PublicFooter />
    </main>
  );
}
