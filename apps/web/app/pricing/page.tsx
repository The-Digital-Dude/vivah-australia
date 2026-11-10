import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Building2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vivah Australia Premium | Membership & Pricing',
  description:
    'Join Vivah Australia for free or activate Vivah Australia Premium for $51 for 3 months ($17/mo equivalent). Full profile access, messaging, and partner filters.',
};

const FEATURES_TABLE = [
  {
    feature: 'Full profile access',
    received: 'View detailed profiles and member photos, subject to privacy settings',
    freeLabel: 'Basic profiles only',
    premiumLabel: 'View detailed profiles & photos',
    premiumCheck: true,
  },
  {
    feature: 'Send messages',
    received: 'Start conversations with other members',
    freeLabel: null,
    premiumLabel: 'Start conversations',
    premiumCheck: true,
  },
  {
    feature: 'Reply to messages',
    received: 'Continue conversations throughout the membership',
    freeLabel: null,
    premiumLabel: 'Continue conversations',
    premiumCheck: true,
  },
  {
    feature: 'Express interest',
    received: 'Let someone know you’re interested in connecting',
    freeLabel: 'Receive notifications only',
    premiumLabel: 'Express interest in potential matches',
    premiumCheck: true,
  },
  {
    feature: 'Search filters',
    received: 'Find profiles by age, location and relevant partner preferences',
    freeLabel: 'Basic age & location',
    premiumLabel: 'Age, location & partner preferences',
    premiumCheck: true,
  },
  {
    feature: 'Shortlist profiles',
    received: 'Save potential matches to revisit',
    freeLabel: null,
    premiumLabel: 'Save potential matches',
    premiumCheck: true,
  },
  {
    feature: 'See who’s interested',
    received: 'View members who have expressed interest in their profile',
    freeLabel: 'Notification only',
    premiumLabel: 'View interested member profiles',
    premiumCheck: true,
  },
  {
    feature: 'Member support',
    received: 'Get help with their profile, account and platform access',
    freeLabel: 'Help Centre & FAQs',
    premiumLabel: 'Dedicated member support',
    premiumCheck: true,
  },
];

const FAQS = [
  {
    q: 'How does Vivah Australia Premium work?',
    a: 'Vivah Australia Premium is available for $51 for 3 months (equivalent to $17 per month, paid as one $51 payment). It provides full access to view detailed member profiles, send and reply to messages, express interest, search with partner preferences, shortlist favourites, see who has expressed interest in you, and access dedicated member support.',
  },
  {
    q: 'What is included in Free Registration?',
    a: 'Free registration is designed to be genuinely useful. As a free member, you can create your profile, upload photos, browse basic member profiles, and receive interest notifications when other members want to connect.',
  },
  {
    q: 'How will the payment appear on my statement?',
    a: 'All transactions are processed in Australian Dollars (AUD) inclusive of GST. The transaction will appear on your cardholder bank statement as "VIVAH AUSTRALIA".',
  },
  {
    q: 'How quickly is my membership activated?',
    a: 'Delivery is 100% digital and instantaneous. Upon successful payment of $51, all Premium capabilities (messaging, full profiles, advanced filters) unlock immediately in your account within 0–5 minutes.',
  },
  {
    q: 'What is your refund and dispute policy?',
    a: 'In accordance with Australian Consumer Law (ACL), we honour all statutory guarantees. If you experience an unresolved technical failure or dispute, please contact our support team. See our Refund Policy for complete claim procedures.',
  },
  {
    q: 'How can I get in touch with member support?',
    a: 'Our Australian member support team is available via email at support@vivahaustralia.com.au or phone at +61 479 134 385 (Monday to Friday, 9:00 AM – 6:00 PM AEST).',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins selection:bg-brand-gold/20 selection:text-brand-maroon">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-maroon/5 border border-brand-maroon/10 text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-4">
            <Sparkles className="size-3.5 text-brand-gold" />
            Membership Options
          </div>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-brand-charcoal mb-4 leading-tight">
            Transparent Membership.<br className="hidden sm:inline" /> Genuine Connections.
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Keep free registration useful with basic browsing, or activate Vivah Australia Premium to start conversations, explore detailed profiles, and connect directly.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
              <ShieldCheck className="size-4 text-emerald-600" /> Instant Digital Delivery
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
              <CreditCard className="size-4 text-brand-maroon" /> Secure Gateway
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
              <Building2 className="size-4 text-brand-gold" /> AUD (Incl. GST)
            </span>
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────────────────── */}
      <section className="pb-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Free Registration Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-9 shadow-sm border border-gray-200 flex flex-col justify-between relative transition hover:shadow-md">
              <div>
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Basic Access
                  </span>
                  <h2 className="font-playfair text-3xl font-bold text-brand-charcoal mt-1">
                    Free Registration
                  </h2>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Keep free registration useful: members can create a profile, browse basic profiles and receive interest notifications.
                  </p>
                  
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-brand-charcoal font-playfair">$0</span>
                    <span className="text-sm font-semibold text-gray-500">Forever Free</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">No credit card required</p>
                </div>

                <hr className="border-gray-100 my-6" />

                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  What is included:
                </div>
                <ul className="space-y-3.5 mb-8 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Create &amp; edit your matrimonial profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Browse basic member profiles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Receive interest notifications from other members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Upload profile photos with privacy settings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Access Help Centre &amp; FAQs</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-bold transition border-2 border-brand-maroon/20 text-brand-maroon hover:bg-brand-maroon/5 bg-white shadow-xs"
                >
                  Register for Free <ArrowRight className="size-4" />
                </Link>
                <p className="text-xs text-center text-gray-400 mt-3">
                  Always free · Upgrade anytime
                </p>
              </div>
            </div>

            {/* Vivah Australia Premium Card (Highlighted) */}
            <div className="bg-gradient-to-b from-amber-50/50 via-white to-white rounded-3xl p-8 sm:p-9 shadow-lg border-2 border-brand-gold ring-4 ring-brand-gold/15 flex flex-col justify-between relative transition hover:shadow-xl">
              {/* Highlight Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-brand-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-brand-charcoal shadow-sm border border-brand-gold/40">
                  Most Popular · Full Access
                </span>
              </div>

              <div>
                <div className="mb-6 pt-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-maroon">
                    Complete Matchmaking
                  </span>
                  <h2 className="font-playfair text-3xl font-bold text-brand-charcoal mt-1">
                    Vivah Australia Premium
                  </h2>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Premium unlocks messaging and all advanced features to help you connect and find your life partner.
                  </p>
                  
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-brand-maroon font-playfair">$51</span>
                    <span className="text-base font-bold text-gray-700">for 3 months</span>
                  </div>
                  <p className="text-xs font-semibold text-brand-maroon/90 mt-1.5 bg-brand-gold/20 inline-block px-2.5 py-1 rounded-md">
                    Equivalent to $17 per month, paid as one $51 payment.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">All prices in AUD · GST Included</p>
                </div>

                <hr className="border-gray-100 my-6" />

                <div className="text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-3">
                  What you receive:
                </div>
                <ul className="space-y-3.5 mb-8 text-sm text-brand-charcoal">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">View detailed member profiles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">Send and reply to messages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">Express interest in potential matches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">Search using partner preferences</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">Save your favourite profiles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">See who has expressed interest in you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">Member support</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  href="/register?plan=premium"
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-base font-bold transition bg-brand-gold text-brand-charcoal hover:bg-brand-gold/90 shadow-md hover:shadow-lg"
                >
                  Activate Premium <ArrowRight className="size-5" />
                </Link>
                <p className="text-xs text-center text-gray-500 mt-3 font-medium">
                  Instant digital activation · Safe &amp; secure checkout
                </p>
              </div>
            </div>

          </div>

          {/* Merchant Billing Disclosure Banner */}
          <div className="mt-12 rounded-2xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6 text-xs text-gray-600">
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">🇦🇺 Registered Australian Entity</p>
                <p className="leading-relaxed">
                  Vivah Australia is owned and operated by Aussi Biz Pty Ltd (ABN: 85 700 086 808), registered trading address: 3 Leafton Street, Truganina, VIC 3029, Australia.
                </p>
              </div>
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">💳 Cardholder Statement Descriptor</p>
                <p className="leading-relaxed">
                  Charges will appear as <strong className="text-brand-charcoal font-semibold">&quot;VIVAH AUSTRALIA&quot;</strong> on your cardholder statement. All prices in AUD including GST.
                </p>
              </div>
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">⚡ Digital Service Delivery</p>
                <p className="leading-relaxed">
                  Membership features unlock immediately upon transaction completion (0–5 minutes). Review our <Link href="/delivery-policy" className="text-brand-maroon underline font-medium">Delivery Policy</Link> and <Link href="/refund-policy" className="text-brand-maroon underline font-medium">Refund Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Breakdown Table ───────────────────────────────────── */}
      <section className="bg-white py-16 px-6 sm:px-8 lg:px-12 border-y border-gray-200/80">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon">
              Side-by-Side Breakdown
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal mt-2 mb-3">
              Feature Breakdown: What Members Receive
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Compare free registration with Vivah Australia Premium to see how each level helps you connect.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-brand-maroon/5 border-b border-gray-200 text-brand-charcoal font-semibold">
                  <th className="py-4 px-6 text-left w-1/4">Feature</th>
                  <th className="py-4 px-6 text-left w-2/5">What members receive</th>
                  <th className="py-4 px-4 text-center">Free Registration</th>
                  <th className="py-4 px-4 text-center bg-brand-gold/15 text-brand-charcoal font-bold">
                    Vivah Australia Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {FEATURES_TABLE.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="py-4 px-6 font-semibold text-brand-charcoal align-middle">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-xs sm:text-sm text-gray-600 leading-relaxed align-middle">
                      {row.received}
                    </td>
                    <td className="py-4 px-4 text-center text-xs align-middle">
                      {row.freeLabel ? (
                        <span className="text-gray-600 font-medium">{row.freeLabel}</span>
                      ) : (
                        <X className="size-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-brand-gold/5 align-middle">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-maroon">
                        <Check className="size-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
                        <span className="hidden sm:inline">{row.premiumLabel}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/register?plan=premium"
              className="inline-flex items-center gap-2 rounded-xl py-3 px-8 text-sm font-bold transition bg-brand-maroon text-white hover:bg-brand-maroon/90 shadow-sm"
            >
              Activate Premium ($51 for 3 months) <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-8 lg:px-12 bg-brand-ivory">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-2">
              <HelpCircle className="size-4" />
              Frequently Asked Questions
            </div>
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal">
              Everything You Need to Know
            </h2>
          </div>

          <div className="grid gap-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-gray-200/80 p-6 shadow-xs"
              >
                <h3 className="font-bold text-brand-charcoal text-base mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-white border border-brand-maroon/15 p-6 text-center text-sm text-gray-600">
            <p className="font-semibold text-brand-charcoal mb-1">Have more questions about our membership?</p>
            <p>
              Contact our Australian support team at{' '}
              <a href="mailto:support@vivahaustralia.com.au" className="text-brand-maroon font-bold underline">
                support@vivahaustralia.com.au
              </a>{' '}
              or call{' '}
              <a href="tel:+61479134385" className="text-brand-maroon font-bold">
                +61 479 134 385
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
