import Image from 'next/image';
import Link from 'next/link';
import { Lock, MapPin, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/app/components';
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

const trustItems = [
  { label: '100% Verified Profiles', icon: ShieldCheck },
  { label: 'Safe & Secure', icon: Lock },
  { label: 'Genuine Matches', icon: Users },
  { label: 'Australian Support', icon: MapPin },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f]">
      <PublicHeader />
      <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <Image
          src="/home/hero-vivah-australia.png"
          alt="Indian couple in wedding attire beside Sydney Harbour"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,245,0.98)_0%,rgba(255,249,245,0.9)_34%,rgba(255,249,245,0.28)_45%,rgba(255,249,245,0.04)_50%)]" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,245,0.14)_0%,rgba(255,249,245,0.04)_48%,rgba(255,249,245,0.92)_100%)]" /> */}

        <div className="relative mx-auto flex justify-center min-h-[calc(100vh-80px)] container flex-col px-4 py-8 sm:px-6 lg:px-0">
          <div className="max-w-2xl pt-10 sm:pt-14 lg:pt-8">
            <h1 className="max-w-xl font-playfair text-5xl font-bold leading-[0.98] text-[#2f2f2f] sm:text-6xl lg:text-7xl">
              Meaningful Connections.
              <span className="mt-2 block text-[#a10e4d]">Lifetime Together.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base font-medium leading-7 text-[#2f2f2f] sm:text-lg sm:leading-8">
              Vivah Australia is a trusted matrimonial platform for the Indian community in
              Australia.
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-y-5 divide-[#a10e4d]/15 sm:grid-cols-4 sm:divide-x">
              {trustItems.map(({ label, icon: Icon }) => (
                <div key={label} className="px-3 text-center first:pl-0 last:pr-0">
                  <Icon className="mx-auto size-7 text-[#a10e4d]" strokeWidth={1.8} />
                  <p className="mt-3 max-w-[90px] mx-auto flex items-center justify-center text-xs font-semibold leading-5 text-[#2f2f2f] sm:text-[13px]">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="inline-flex min-h-12 min-w-[214px] items-center justify-center gap-2 rounded-lg bg-[#a10e4d] px-7 py-3 text-base font-semibold text-white shadow-[0_18px_38px_rgba(161,14,77,0.22)] transition hover:bg-[#8e0d43] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
              >
                <UserPlus className="size-5" />
                Create Your Profile
              </Link>
              <Link
                href="/membership"
                className="inline-flex min-h-12 min-w-[214px] items-center justify-center rounded-lg border border-[#a10e4d]/35 bg-white/90 px-7 py-3 text-base font-semibold text-[#a10e4d] shadow-sm transition hover:bg-[#fff9f5] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
              >
                View Membership Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
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
