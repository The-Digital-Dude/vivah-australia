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
      <div className="relative mx-auto max-w-7xl px-8 sm:px-12 lg:px-16">
        
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column: Typography & CTA */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9A05B]/30 bg-white/80 px-4 py-2 backdrop-blur-sm shadow-sm">
              <Heart className="size-3.5 fill-[#D9A05B] text-[#D9A05B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C48C45]">
                Premium Indian Matrimony
              </span>
            </div>
            
            <div className="mt-8">
              <AnimatedWordPlay 
                theme="light"
                align="left"
                eyebrow="Vivah Australia"
                prefix="Your Search for"
                words={['Love', 'Companionship', 'Forever', 'Connection']}
                suffix=" Ends Here."
                body="Experience Australia's most trusted Indian matrimony platform. We combine 100% verified profiles with personalized matchmaking to help you find a partner who shares your cultural roots and Australian lifestyle." 
              />
            </div>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/register"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D9A05B] to-[#C48C45] px-8 py-3.5 text-sm font-bold text-white shadow-[0_16px_38px_rgba(217,160,91,0.35)] transition hover:-translate-y-0.5 hover:from-[#C48C45] hover:to-[#AF7830]"
              >
                <Heart className="size-4 fill-white" />
                Start Your Journey
              </a>
            </div>
          </div>

          {/* Right Column: Luxury Image Collage */}
          <div className="relative hidden lg:block h-[500px]">
             {/* Back Image (Left) */}
             <div className="absolute bottom-10 left-0 w-64 h-80 rounded-2xl overflow-hidden border-8 border-white bg-white shadow-[0_30px_60px_rgba(217,160,91,0.15)] z-0 -rotate-6 transition-transform duration-700 hover:rotate-0 hover:scale-105">
               <Image 
                 src="/home/success-stories/couple-03.jpg" 
                 fill 
                 className="object-cover opacity-90 transition-opacity hover:opacity-100" 
                 alt="Indian wedding ceremony" 
                 sizes="(min-width: 1024px) 20vw, 100vw"
               />
               {/* Soft Gold Overlay */}
               <div className="absolute inset-0 bg-[#D9A05B]/10 mix-blend-overlay"></div>
             </div>

             {/* Front Image (Right) */}
             <div className="absolute top-4 right-4 w-72 h-96 rounded-2xl overflow-hidden border-8 border-white bg-white shadow-[0_40px_80px_rgba(217,160,91,0.25)] z-10 rotate-3 transition-transform duration-700 hover:rotate-0 hover:scale-105">
               <Image 
                 src="/home/success-stories/couple-02.jpg" 
                 fill 
                 className="object-cover" 
                 alt="Happy Indian couple in Australia" 
                 sizes="(min-width: 1024px) 25vw, 100vw"
                 priority
               />
             </div>
             
             {/* Floating Trust Badge */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-white to-[#FDFBF7] shadow-[0_20px_40px_rgba(217,160,91,0.3)] border border-[#D9A05B]/30 animate-pulse-slow">
                <div className="text-center">
                  <div className="text-[#C48C45] font-playfair font-bold text-xl leading-none">100%</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#2A111A] mt-1">Verified</div>
                </div>
             </div>
          </div>
        </div>

        {/* The Search Form directly integrated into the bottom of the Hero */}
        <div className="mt-16 mb-16 relative z-30 mx-auto max-w-[1100px]">
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
