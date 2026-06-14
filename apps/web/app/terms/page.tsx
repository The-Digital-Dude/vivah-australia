import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { FileText, ArrowRight } from 'lucide-react';

const slug = 'terms-and-conditions';
const fallback = {
  title: 'Terms & Conditions',
  description: 'Read the matrimonial terms and conditions for using the Vivah Australia platform.',
  eyebrow: 'Matrimonial Agreement',
  body: `Welcome to Vivah Australia. By registering an account and using our matchmaking platform, you agree to comply with the following Terms and Conditions.

Eligibility
Our service is exclusively for single individuals and families looking for serious, long-term matrimonial introductions. You must be at least 18 years of age to register. By creating an account, you confirm that you are legally eligible to marry under Australian law.

Accurate Information
All members are expected to provide true, accurate, and up-to-date identity details during onboarding and throughout their membership. Misrepresentation of marital status, age, identity, or any other material fact is a violation of these terms and may result in immediate account suspension.

Acceptable Use
Vivah Australia is a matrimonial platform, not a general social networking or dating application. The following are strictly prohibited:
- Commercial solicitation, advertising, or spam
- Harassment, abuse, or threatening behaviour
- Creation of fraudulent or impersonation accounts
- Sharing or soliciting explicit content of any kind
- Attempting to circumvent platform security or verification

Intellectual Property
All content, trademarks, logos, and platform design elements are the property of Vivah Australia Pty Ltd. You may not reproduce, distribute, or create derivative works without written consent.

Limitation of Liability
Vivah Australia provides a platform for introductions and does not guarantee any specific outcomes, including matches or marriages. We are not liable for the actions of third-party members or outcomes arising from in-person meetings arranged through the platform.

Account Termination
We reserve the right to suspend or permanently delete any account found to be in violation of these terms, at our sole discretion, with or without prior notice.

Changes to Terms
These terms may be updated from time to time. Continued use of the platform following any update constitutes acceptance of the revised terms.

Contact
For questions regarding these terms, contact us at support@vivahaustralia.com.au.`,
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function TermsPage() {
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
            <FileText className="size-5 text-brand-gold" />
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
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-8 whitespace-pre-line">
              {body}
            </div>
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Questions about these terms?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our team responds within 5 business days.</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0">
              Contact Us <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/terms" />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PolicyLinks({ current }: { current: string }) {
  const links = [
    ['Privacy Policy',        '/privacy'],
    ['Refund Policy',         '/refund-policy'],
    ['Verification Policy',   '/verification-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Terms of Service',      '/terms'],
  ].filter(([, href]) => href !== current);

  return (
    <div className="mt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Related Policies</p>
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <Link key={href} href={href!} className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
