import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { FAQAccordion } from '@/app/components/premium-design-system';
import { getCmsPage } from '@/lib/public-api';
import {
  User,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  ArrowRight,
  Mail,
  Phone,
  FileText,
  Search,
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage('help-centre');
  return {
    title: page?.seoTitle ?? 'Help Center | Vivah Australia',
    description:
      page?.seoDescription ??
      'Find answers to your questions about profiles, verification, matching, and billing on Vivah Australia.',
  };
}

const CATEGORIES = [
  {
    icon: User,
    title: 'Profile Setup & Onboarding',
    description:
      'Create a premium matrimonial profile, save draft details, and configure granular privacy controls for photos and personal information.',
    links: [
      { label: 'How to complete your profile', href: '/blog/how-to-create-a-strong-matrimonial-profile' },
      { label: 'Privacy and photo controls', href: '/safety' },
      { label: 'Profile verification badges', href: '/verification-policy' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Verification',
    description:
      'Understand the document upload process, verification standards, and how badges are reviewed and approved by our team.',
    links: [
      { label: 'Verification policy', href: '/verification-policy' },
      { label: 'How verification works', href: '/blog/how-verification-works' },
      { label: 'Community guidelines', href: '/community-guidelines' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Matches & Communication',
    description:
      'Discover how compatibility works, how to send interests, unlock messaging, and navigate conversations on Vivah.',
    links: [
      { label: 'How matching works', href: '/how-it-works' },
      { label: 'Messaging and safety', href: '/safety' },
      { label: 'Writing a first message', href: '/blog/how-to-write-a-first-message' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Billing & Membership',
    description:
      'Get support for checkout issues, payment history, refunds, coupon codes, and plan subscription cancellations.',
    links: [
      { label: 'Membership plans', href: '/membership' },
      { label: 'Refund policy', href: '/refund-policy' },
      { label: 'Pricing details', href: '/pricing' },
    ],
  },
];

const QUICK_FAQS = [
  {
    id: 'free',
    question: 'Is Vivah Australia free to join?',
    answer:
      'Yes. Creating a profile and receiving interests is entirely free. Premium features unlock direct messaging, advanced filters, and greater visibility.',
  },
  {
    id: 'verification',
    question: 'How does profile verification work?',
    answer:
      'We use a multi-tier verification process — reviewing email, mobile, government ID, address, and employment documents to award trust badges.',
  },
  {
    id: 'photos',
    question: 'Can I control who sees my photos?',
    answer:
      'Absolutely. You choose to show your photos publicly, only to logged-in members, or strictly to matches you have accepted.',
  },
  {
    id: 'messaging',
    question: 'When can members message each other?',
    answer:
      'Messaging is unlocked when a mutual interest is accepted and at least one member holds an active premium plan.',
  },
];

export default async function HelpPage() {
  await getCmsPage('help-centre');

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Help & Support
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            How Can We{' '}
            <span className="text-brand-gold">Help You?</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Find answers about profile setup, verification, matching, billing, and safety — or
            reach our member care team directly.
          </p>
          {/* Search teaser */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help topics..."
              disabled
              className="w-full rounded-2xl border border-white/20 bg-white/10 pl-12 pr-4 py-4 text-white placeholder-white/40 text-sm font-medium backdrop-blur-sm focus:outline-none cursor-not-allowed"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 font-semibold">
              Coming soon
            </span>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Help Categories ───────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Support Topics
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
              What Are You Looking For?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {CATEGORIES.map(({ icon: Icon, title, description, links }) => (
              <div
                key={title}
                className="rounded-[28px] bg-white border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="size-12 rounded-2xl bg-brand-maroon/10 flex items-center justify-center mb-5">
                  <Icon className="size-5 text-brand-maroon" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-brand-charcoal mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{description}</p>
                <ul className="space-y-2">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-maroon hover:underline"
                      >
                        <ArrowRight className="size-3.5" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick FAQs ────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-8 lg:px-12 border-y border-gray-100">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Common Questions
            </p>
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal mb-3">
              Quick Answers
            </h2>
            <p className="text-gray-500 text-sm">
              See the{' '}
              <Link href="/faq" className="text-brand-maroon font-bold hover:underline">
                full FAQ page
              </Link>{' '}
              for the complete list.
            </p>
          </div>
          <FAQAccordion items={QUICK_FAQS} />
        </div>
      </section>

      {/* ── Contact Options ───────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Still Need Help?
            </p>
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal">
              Reach Our Member Care Team
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: 'Email Support',
                body: 'We respond to most emails within 24 hours on business days.',
                action: 'support@vivahaustralia.com.au',
                href: 'mailto:support@vivahaustralia.com.au',
                cta: 'Send an Email',
              },
              {
                icon: MessageCircle,
                title: 'Send a Message',
                body: 'Use our contact form to send a detailed inquiry with your account information.',
                action: 'Contact Form',
                href: '/contact',
                cta: 'Open Contact Form',
              },
              {
                icon: FileText,
                title: 'Browse Guides',
                body: 'Our blog has in-depth articles covering every aspect of the Vivah platform.',
                action: 'Read the Blog',
                href: '/blog',
                cta: 'Visit Blog',
              },
            ].map(({ icon: Icon, title, body, href, cta }) => (
              <div
                key={title}
                className="rounded-[24px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-7 text-center flex flex-col items-center"
              >
                <div className="size-12 rounded-2xl bg-brand-gold/15 flex items-center justify-center mb-4">
                  <Icon className="size-5 text-brand-gold" />
                </div>
                <h3 className="font-bold text-brand-charcoal mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">{body}</p>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline"
                >
                  {cta} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-playfair text-3xl font-bold text-white mb-4">
            Not a member yet?
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            Join Vivah Australia free and start connecting with verified Indian singles across the country.
          </p>
          <PremiumButton href="/register" variant="gold">
            Create Free Profile
            <ArrowRight className="size-4" />
          </PremiumButton>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
