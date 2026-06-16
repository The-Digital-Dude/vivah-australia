import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { Lock, ArrowRight } from 'lucide-react';

const slug = 'privacy-policy';
const fallback = {
  title: 'Privacy Policy',
  description: 'Review the privacy policy and data protection practices of Vivah Australia.',
  eyebrow: 'Data Protection',
  body: `Your privacy is a core pillar of the Vivah Australia matchmaking community.

We are committed to securing your personal information, photos, and identity documents through encrypted transmission, secure cloud database servers, and strict manual review processes.

Information We Collect
When you register, we collect your name, email address, mobile number, date of birth, and profile details you choose to share. During verification, we may also collect government-issued ID documents and address proof.

How We Use Your Information
Your information is used solely to operate the Vivah Australia platform — to verify your identity, match you with compatible members, and send account-related communications. We do not sell your personal data to third parties.

Photo Privacy
You have full control over who can see your profile photos. You may choose to show photos publicly, only to logged-in members, or exclusively to matches you have accepted. This setting can be changed at any time from your profile privacy controls.

Data Security
All data is transmitted over HTTPS. Sensitive documents are stored in encrypted cloud storage with restricted access controls. Our team undergoes regular security training and access is reviewed quarterly.

Data Retention
Your data is retained for as long as your account is active. Upon account deletion, personal data is removed within 30 days, except where retention is required for legal compliance.

Your Rights
You have the right to access, correct, export, or delete your personal data at any time. To exercise these rights, contact our support team at support@vivahaustralia.com.au.

Contact
For privacy-related queries, email us at support@vivahaustralia.com.au. We respond to privacy requests within 5 business days.`,
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function PrivacyPage() {
  const { page } = await getCmsPage(slug);
  const title = page?.title ?? fallback.title;
  const body = page?.body ?? fallback.body;

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 lg:px-12 text-center">
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="size-5 text-brand-gold" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            {fallback.eyebrow}
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/50 text-sm">Last reviewed: June 2025</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-12">
            {renderPolicyBody(body)}
          </div>

          {/* Questions CTA */}
          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Questions about this policy?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our team responds within 5 business days.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0"
            >
              Contact Us <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Related policies */}
          <PolicyLinks current="/privacy" />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function renderPolicyBody(body: string) {
  const lines = body.split('\n');
  return (
    <div className="whitespace-pre-line text-gray-700 leading-8">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const prevTrimmed = i > 0 ? lines[i - 1]?.trim() ?? null : null;
        const isHeading =
          trimmed !== '' &&
          (prevTrimmed === null || prevTrimmed === '') &&
          !trimmed.endsWith('.') &&
          !trimmed.startsWith('-') &&
          trimmed.length < 70;
        return isHeading ? (
          <span key={i} className="font-bold text-brand-charcoal">{line}{'\n'}</span>
        ) : (
          <span key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</span>
        );
      })}
    </div>
  );
}

function PolicyLinks({ current }: { current: string }) {
  const links = [
    ['Terms of Service',      '/terms'],
    ['Refund Policy',         '/refund-policy'],
    ['Verification Policy',   '/verification-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Privacy Policy',        '/privacy'],
  ].filter(([, href]) => href !== current);

  return (
    <div className="mt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Related Policies</p>
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href!}
            className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
