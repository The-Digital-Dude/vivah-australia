import { PublicFooter, PublicHeader } from '@/app/components';
import { FaqSection } from '@/app/components/home/faq-section';
import { CommunityStatsStrip } from './components/community-stats-strip';
import { HeroClientSection } from './components/hero-client-section';
import { HeroSearchForm } from './components/hero-search-form';
import { HowItWorksSection } from './components/how-it-works-section';
import { MinimalPricingSection } from './components/minimal-pricing-section';
import { SuccessStoriesSlider } from './components/success-stories-slider';
import { TrustVerificationStrip } from './components/trust-verification-strip';

export const metadata = {
  title: 'Animated homepage | Vivah Australia',
  description:
    'Animation-led homepage concept: scroll-triggered micro-interactions, count-up stats, and motion-rich sections.',
};

export default function AnimatedHomepage() {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f]">
      <PublicHeader />
      <section className="border-b border-[#a10e4d]/10 bg-[#fff9f5] px-8 py-4 sm:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-sm font-semibold text-[#5f5f5f]">
          <span className="text-[#d4a04c]">Homepage variants:</span>
          <span className="rounded-full bg-white px-3 py-1 text-[#a10e4d] shadow-sm">Animated Home</span>
          <span className="font-normal text-[#5f5f5f]">
            — Motion-led concept: micro-interactions, count-up stats, and scroll-triggered reveals.
          </span>
        </div>
      </section>
      <HeroClientSection />
      <HeroSearchForm />
      <CommunityStatsStrip />
      <SuccessStoriesSlider />
      <HowItWorksSection />
      <TrustVerificationStrip />
      <MinimalPricingSection />
      <FaqSection />
      <PublicFooter />
    </main>
  );
}
