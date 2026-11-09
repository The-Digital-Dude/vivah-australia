import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { CreditCard, ArrowRight, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

const slug = 'refund-policy';
const fallback = {
  title: 'Refunds & Dispute Policy',
  description: 'Understand the billing refund conditions, dispute rights, and Australian Consumer Law guarantees for Vivah Australia.',
  eyebrow: 'Billing & Consumer Rights',
  body: `Vivah Australia (ABN: 85 700 086 808) operates transparent, fair, and compliant billing policies for all membership plans and services.

1. Australian Consumer Law (ACL) Guarantees
Our services come with statutory guarantees that cannot be excluded under Schedule 2 of the Competition and Consumer Act 2010 (Cth) (Australian Consumer Law).
Nothing in this Refund Policy excludes, limits, or modifies any rights, remedies, or statutory consumer guarantees that you are entitled to under Australian Consumer Law.
If a digital service fails to meet a major statutory guarantee, you are entitled to cancel your service and obtain a refund or compensation.

2. Digital Service Nature & Fulfillment
Our paid membership subscriptions — Silver ($29/mo), Gold ($59/mo), and Platinum ($99/mo) — provide immediate digital access to features including direct messaging, advanced cultural search filters, priority profile discovery, and profile boosts.
Because features are delivered electronically and activated immediately upon payment confirmation (see our Delivery Policy), subscriptions are generally non-refundable once accessed, except as required by law or outlined below.

3. Refund Eligibility Criteria
Vivah Australia will review and approve refund requests in the following circumstances:
- Duplicate or Incorrect Charge: Technical error resulting in duplicate charges or an incorrect billing amount.
- Unused Accidental Purchase: Where an incorrect tier was accidentally purchased and reported within 48 hours without accessing paid features (e.g. no messages sent, no boost utilized).
- Major Technical Service Failure: Significant platform downtime lasting more than 48 continuous hours attributable directly to our servers or hosting infrastructure.
- Statutory ACL Entitlement: Where required under Australian Consumer Law guarantees.

4. Refund Request & Dispute Process
All refund requests must be submitted within 14 calendar days of the original transaction date.
To lodge a request or dispute:
- Email our dedicated billing team at support@vivahaustralia.com.au or call +61 479 134 385 (Mon–Fri 9am–5pm AEST).
- Include your registered account email address.
- Provide the transaction date, amount charged (in AUD), and payment reference number.
- State the reason for your refund request or billing dispute.

Review & Processing Timeframe:
- Our billing team investigates and responds to all claims within 5 business days.
- If approved, refunds are credited back to the original credit/debit card or payment method within 7–10 business days, depending on your financial institution's processing cycles.

5. Subscription Cancellation vs Refund
You may cancel automatic recurring renewals at any time directly through your Member Dashboard or by emailing support@vivahaustralia.com.au.
Cancellation stops future renewal charges. Upon cancellation, your access remains active until the expiration date of your current paid billing cycle. Cancellation does not automatically generate a pro-rata refund for days elapsed.

6. Cardholder Statement & Currency Disclosure
Payments processed through our payment gateway will appear on your bank or credit card statement as "VIVAH AUSTRALIA".
All transactions are processed in Australian Dollars (AUD) and are inclusive of Australian Goods and Services Tax (GST) where applicable.

7. Merchant Trading Entity & Contact Details
Vivah Australia
ABN: 85 700 086 808
Registered Trading Address: 3 Leafton Street, Truganina, VIC 3029, Australia
Customer Support Phone: +61 479 134 385 (Mon–Fri 9:00 AM – 5:00 PM AEST)
Billing & Disputes Email: support@vivahaustralia.com.au
Website: www.vivahaustralia.com.au`,
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
          <p className="text-white/70 text-sm">Last updated: November 2026 · Built under Australian Consumer Law</p>
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

          {/* Quick Merchant Contact Card */}
          <div className="mt-8 rounded-2xl bg-white border border-brand-maroon/10 p-6 sm:p-8 shadow-sm">
            <h3 className="font-playfair text-xl font-bold text-brand-charcoal mb-2">Merchant Registration &amp; Dispute Contact</h3>
            <p className="text-xs text-gray-500 mb-4">If you notice an unrecognized charge or wish to request assistance with a refund:</p>
            
            <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-4 text-brand-maroon shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-charcoal">Trading Entity &amp; ABN</p>
                  <p>Vivah Australia · ABN: 85 700 086 808</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-brand-maroon shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-charcoal">Registered Address</p>
                  <p>3 Leafton Street, Truganina, VIC 3029, Australia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-brand-maroon shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-charcoal">Phone Support</p>
                  <p><a href="tel:+61479134385" className="hover:text-brand-maroon underline font-semibold">+61 479 134 385</a> (Mon–Fri 9am–5pm AEST)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-brand-maroon shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-charcoal">Billing Enquiries</p>
                  <p><a href="mailto:support@vivahaustralia.com.au" className="hover:text-brand-maroon underline font-semibold">support@vivahaustralia.com.au</a></p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Billing question or refund request?</p>
              <p className="text-xs text-gray-500 mt-0.5">Submit requests within 14 days of purchase. Reviewed within 5 business days.</p>
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
          trimmed.length < 80;
        return isHeading ? (
          <span key={i} className="font-bold text-brand-charcoal text-lg block mt-6 mb-2 first:mt-0">{line}{'\n'}</span>
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
    ['Terms of Use',          '/terms'],
    ['Delivery & Fulfillment','/delivery-policy'],
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
