import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { FAQAccordion } from '@/app/components/premium-design-system';
import { getCmsPage, getFaqs } from '@/lib/public-api';
import { ArrowRight, MessageCircle } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage('faq');
  return {
    title: page?.seoTitle ?? 'Frequently Asked Questions | Vivah Australia',
    description:
      page?.seoDescription ??
      'Find answers about profiles, verification, matching, billing, and safety on Vivah Australia.',
  };
}

const FALLBACK_FAQS_BY_CATEGORY = [
  {
    category: 'Getting Started',
    items: [
      {
        id: 'free',
        question: 'Is Vivah Australia free to join?',
        answer:
          'Yes. Creating a profile and receiving interests is entirely free. Premium features unlock direct messaging, advanced filters, and greater visibility across the platform.',
      },
      {
        id: 'register',
        question: 'Who can join Vivah Australia?',
        answer:
          'Vivah Australia is open to Indian and South Asian singles living in Australia who are looking for serious, long-term relationships and marriage. Members from all Indian communities, religions, and backgrounds are welcome.',
      },
      {
        id: 'divorced',
        question: 'Can divorced or separated members join?',
        answer:
          'Yes. We respect all life journeys. You can specify your marital status clearly on your profile so you connect with compatible, like-minded individuals.',
      },
    ],
  },
  {
    category: 'Profile & Verification',
    items: [
      {
        id: 'verification',
        question: 'How does profile verification work?',
        answer:
          'We use a multi-tier verification ladder — reviewing email, mobile, government ID, address, and employment documents to award trust badges. Higher badge levels indicate more thorough identity confirmation by our team.',
      },
      {
        id: 'photos',
        question: 'Can I control who sees my photos?',
        answer:
          'Absolutely. You choose to show your photos publicly, only to logged-in members, or strictly to matches you have accepted. This setting can be changed at any time from your profile privacy controls.',
      },
      {
        id: 'profile-tips',
        question: 'How do I create a strong profile?',
        answer:
          "A strong matrimonial profile leads with clarity and authenticity. Include your education, career, family background, and what you are genuinely looking for. Members who complete their profiles receive significantly more quality matches. See our blog article on profile creation for step-by-step guidance.",
      },
    ],
  },
  {
    category: 'Matching & Communication',
    items: [
      {
        id: 'messaging',
        question: 'When can members message each other?',
        answer:
          'Messaging is unlocked when a mutual interest is accepted and at least one member holds an active premium plan. This ensures conversations happen between genuinely interested, serious members.',
      },
      {
        id: 'how-matching',
        question: 'How does Vivah Australia match profiles?',
        answer:
          'Vivah uses a combination of your stated preferences — community, religion, education, lifestyle, and location — to surface compatible profiles. Advanced filters on paid plans let you narrow results further. There is no algorithm forcing matches; you stay in control.',
      },
      {
        id: 'block',
        question: 'Can I block or report someone?',
        answer:
          'Yes. Every profile has a report and block option accessible from the three-dot menu. Our moderation team reviews all reports within 24 hours and takes appropriate action, including permanent bans for verified violations.',
      },
    ],
  },
  {
    category: 'Membership & Billing',
    items: [
      {
        id: 'plans',
        question: 'What is the difference between Free, Premium, Gold, and Platinum?',
        answer:
          'Free members can explore profiles and receive interests. Premium unlocks direct messaging and advanced filters. Gold adds priority discovery, more monthly interests, and faster visibility. Platinum is our highest tier with maximum reach, dedicated profile review, and front-of-queue support.',
      },
      {
        id: 'cancel',
        question: 'Can I cancel my subscription anytime?',
        answer:
          'Yes. You can cancel future renewals from your account billing settings at any time. Your membership access continues until the end of the paid period — there are no cancellation penalties.',
      },
      {
        id: 'refund',
        question: 'Can I request a refund?',
        answer:
          'Refund requests are reviewed under the Vivah Australia refund policy. If you have concerns before upgrading, our member care team can walk you through what to expect. See the refund policy page for full details.',
      },
      {
        id: 'secure',
        question: 'Is payment secure?',
        answer:
          'All checkout is handled by Stripe, one of the most trusted payment processors in the world. Your card details are never stored by Vivah Australia — they remain within Stripe\'s PCI-compliant environment.',
      },
    ],
  },
  {
    category: 'Safety',
    items: [
      {
        id: 'safe',
        question: 'How does Vivah keep the community safe?',
        answer:
          'We combine multi-tier verification, manual profile review, AI-assisted content moderation, and a dedicated safety team. Members can report concerns directly from any profile, and all reports are reviewed within 24 hours.',
      },
      {
        id: 'diaspora',
        question: 'Is this only for Indian Australians?',
        answer:
          'Vivah Australia focuses on the South Asian diaspora within Australia but welcomes members from all backgrounds who are seeking serious, family-oriented relationships with the Indian community.',
      },
    ],
  },
];

export default async function FaqPage() {
  const [{ page }, { faqs }] = await Promise.all([getCmsPage('faq'), getFaqs()]);

  const hasApiData = faqs && faqs.length > 0;

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Help Center
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {page?.title ?? 'Frequently Asked Questions'}
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {page?.body ??
              'Find answers about profiles, verification, matching, billing, and safety on Vivah Australia.'}
          </p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── FAQ Content ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          {hasApiData ? (
            /* API data: flat list */
            <FAQAccordion
              items={(faqs as { question: string; answer: string }[]).map((f) => ({
                id: f.question,
                question: f.question,
                answer: f.answer,
              }))}
            />
          ) : (
            /* Fallback: categorised sections */
            <div className="space-y-14">
              {FALLBACK_FAQS_BY_CATEGORY.map(({ category, items }) => (
                <div key={category}>
                  <h2 className="font-playfair text-xl font-bold text-brand-charcoal mb-5 pb-3 border-b border-gray-200">
                    {category}
                  </h2>
                  <FAQAccordion items={items} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Still Need Help ───────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 sm:px-8 lg:px-12 border-t border-gray-100">
        <div className="mx-auto max-w-2xl text-center">
          <div className="size-14 rounded-2xl bg-brand-gold/15 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="size-7 text-brand-gold" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-brand-charcoal mb-3">
            Couldn&apos;t Find Your Answer?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Our member care team is available to help with any question about your account, safety,
            or membership. We typically respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PremiumButton href="/contact" variant="gold">
              Contact Member Care
              <ArrowRight className="size-4" />
            </PremiumButton>
            <PremiumButton href="/help" variant="secondary">
              Browse Help Center
            </PremiumButton>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            You can also browse{' '}
            <Link href="/blog" className="text-brand-maroon font-bold hover:underline">
              our blog
            </Link>{' '}
            for in-depth guides.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
