import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { CreditCard, ArrowRight } from 'lucide-react';

const slug = 'refund-policy';
const fallback = {
  title: 'Refund Policy',
  description: 'Understand the billing refund conditions for paid membership plans on Vivah Australia.',
  eyebrow: 'Billing Policy',
  body: `Vivah Australia offers transparent, fair billing for all premium membership plans.

Digital Service Nature
Our premium memberships — Premium, Gold, and Platinum — unlock immediate digital features including direct messaging, advanced search filters, profile boosts, and priority discovery. Because these features are delivered digitally and activated immediately upon payment, subscriptions are generally non-refundable once accessed.

Refund Eligibility
We will consider refund requests in the following circumstances:
- Technical error resulting in a duplicate charge
- Accidental purchase of the wrong plan where features have not yet been accessed
- Service unavailability lasting more than 48 continuous hours attributable to our platform

How to Request a Refund
All refund requests must be submitted within 14 days of the original purchase date. To request a refund, contact our billing team at support@vivahaustralia.com.au with:
- Your registered email address
- The date and amount of the charge
- A brief description of the reason for the request

We aim to review all refund requests within 5 business days. Approved refunds are returned to the original payment method within 7–10 business days, depending on your bank or card issuer.

Cancellation vs Refund
Cancelling your subscription stops future renewals but does not automatically entitle you to a refund of the current billing period. Your membership access will continue until the end of the paid period.

Disputes
If you believe a charge was made in error and our team is unable to resolve it, you may contact your bank or card issuer to initiate a dispute. We encourage members to contact us first, as we can often resolve billing issues faster than a formal dispute process.

Contact
For billing enquiries, email support@vivahaustralia.com.au. Our billing team is available Monday to Friday, 9am–5pm AEST.`,
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function RefundPolicyPage() {
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
            <CreditCard className="size-5 text-brand-gold" />
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

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Billing question or refund request?</p>
              <p className="text-xs text-gray-500 mt-0.5">Submit requests within 14 days of purchase.</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0">
              Contact Billing Team <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/refund-policy" />
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
    ['Privacy Policy',        '/privacy'],
    ['Terms of Service',      '/terms'],
    ['Verification Policy',   '/verification-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Refund Policy',         '/refund-policy'],
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
