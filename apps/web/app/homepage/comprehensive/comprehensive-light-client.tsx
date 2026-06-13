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

// This is the Unified Hero adapted for our luxury comprehensive page
function UnifiedHeroLight({ data }: { data: any }) {
  return (
    <section className="relative overflow-hidden border-b border-[#D9A05B]/20 bg-transparent pt-20 sm:pt-24 lg:pt-32">
      <div className="relative mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 text-center">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D9A05B]/30 bg-white/80 px-4 py-2 backdrop-blur-sm shadow-sm mx-auto">
          <Heart className="size-3.5 fill-[#D9A05B] text-[#D9A05B]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C48C45]">
            Premium Indian Matrimony
          </span>
        </div>
        
        <div className="mt-8 flex justify-center">
          <AnimatedWordPlay 
            theme="light"
            prefix="Your Search for"
            words={['Love', 'Companionship', 'Forever', 'Connection']}
            suffix=" Ends Here."
            body="Experience Australia's most trusted Indian matrimony platform. We combine 100% verified profiles with personalized matchmaking to help you find a partner who shares your cultural roots and Australian lifestyle." 
          />
        </div>
        
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/register"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D9A05B] to-[#C48C45] px-8 py-3.5 text-sm font-bold text-white shadow-[0_16px_38px_rgba(217,160,91,0.35)] transition hover:-translate-y-0.5 hover:from-[#C48C45] hover:to-[#AF7830]"
          >
            <Heart className="size-4 fill-white" />
            Start Your Journey
          </a>
        </div>

        {/* The Search Form directly integrated into the Hero */}
        <div className="mt-16 mb-16 relative z-20 mx-auto max-w-5xl">
          <HeroSearchFormLight />
        </div>
        
      </div>
    </section>
  );
}

export function ComprehensiveLightClient({ data }: { data?: any }) {
  return (
    <main className="min-h-screen bg-[#FCF8F2] text-[#2A111A] overflow-x-hidden">
      <PublicHeader />
      
      <PremiumFloatingElementsLight>
        {/* 1. The Unified Hero (Above the Fold) */}
        <UnifiedHeroLight data={data} />

        {/* 2. Trust Sequence */}
        <div className="bg-transparent py-16">
          <CommunityStatsStripLight />
        </div>
        <TrustVerificationStripLight />

        {/* 3. The Journey (How it Works) */}
        <HowItWorksSectionLight />

        {/* 4. Emotional Proof */}
        <BentoSuccessStoriesLight />

        {/* 5. Commitment & Pricing */}
        <RevampedMembershipCardsLight />

        {/* 6. FAQ Section */}
        <RedesignedFaqSectionLight />
      </PremiumFloatingElementsLight>

      <PublicFooter />
    </main>
  );
}
