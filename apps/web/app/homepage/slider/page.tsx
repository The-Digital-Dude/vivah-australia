import { PublicFooter, PublicHeader } from '@/app/components';
import { CommunityStatsStrip } from '@/app/components/home/community-stats-strip';
import { FaqSection } from '@/app/components/home/faq-section';
import { HeroSearchForm } from '@/app/components/home/hero-search-form';
import { HowItWorksSection } from '@/app/components/home/how-it-works-section';
import { MinimalPricingSection } from '@/app/components/home/minimal-pricing-section';
import { SuccessStoriesSlider } from '@/app/components/home/success-stories-slider';
import { TrustVerificationStrip } from '@/app/components/home/trust-verification-strip';
import { SliderHero } from './slider-hero';

export const metadata = {
  title: 'Slider homepage | Vivah Australia',
  description:
    'A cinematic slider-led homepage: three rotating hero moments covering trust, verification, and success stories.',
};

export default function SliderHomepage() {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f]">
      <PublicHeader />
      <section className="border-b border-[#a10e4d]/10 bg-[#fff9f5] px-8 py-4 sm:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-sm font-semibold text-[#5f5f5f]">
          <span className="text-[#d4a04c]">Homepage variants:</span>
          <span className="rounded-full bg-white px-3 py-1 text-[#a10e4d] shadow-sm">Slider Home</span>
          <span className="font-normal text-[#5f5f5f]">
            — Showcase-led: three rotating cinematic hero moments, then discovery and proof.
          </span>
        </div>
      </section>
      <SliderHero />
      <div className="pt-12">
        <CommunityStatsStrip />
      </div>
      <HeroSearchForm />
      <HowItWorksSection />
      <SuccessStoriesSlider />
      <TrustVerificationStrip />
      <MinimalPricingSection />
      <FaqSection />
      <PublicFooter />
    </main>
  );
}
