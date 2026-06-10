import { PublicFooter, PublicHeader } from '@/app/components';
import { HeroClientSection } from '@/app/components/home/hero-client-section';
import { CommunityStatsStrip } from '@/app/components/home/community-stats-strip';
import { FaqSection } from '@/app/components/home/faq-section';
import { HeroSearchForm } from '@/app/components/home/hero-search-form';
import { HowItWorksSection } from '@/app/components/home/how-it-works-section';
import { MinimalPricingSection } from '@/app/components/home/minimal-pricing-section';
import { SuccessStoriesSlider } from '@/app/components/home/success-stories-slider';
import { TrustVerificationStrip } from '@/app/components/home/trust-verification-strip';

export const metadata = {
  title: 'Vivah Australia | Trusted Indian Matrimonial Community',
  description:
    'Create a verified matrimonial profile, discover compatible Australian matches, and connect safely with serious relationship seekers.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f]">
      <PublicHeader />
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
