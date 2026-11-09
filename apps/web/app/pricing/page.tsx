import type { Metadata } from 'next';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Membership Plans & Pricing | Vivah Australia',
  description: 'Explore Vivah Australia membership options. Transparent pricing in AUD with instant digital activation for genuine connections.',
};

const PLANS = [
  {
    id: 'free',
    name: 'Essential',
    price: '$0',
    period: 'Forever Free',
    description: 'Begin your search with verified Australian Indian profiles.',
    highlight: false,
    badge: null,
    border: 'border-gray-200',
    buttonVariant: 'outline' as const,
    buttonText: 'Create Free Profile',
    buttonHref: '/register',
    features: [
      'Create and edit your matrimony profile',
      'Upload and manage up to 5 photos',
      'Browse verified member profiles',
      'Send 5 interests every month',
      'Receive unlimited interests',
      'Standard photo privacy controls',
      'Basic search & location filters',
    ],
    notIncluded: [
      'Direct messaging & chat',
      'Advanced compatibility filters',
      'Profile visibility boosts',
      'Priority verification badge review',
      'See who viewed your profile',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '$29',
    period: '/ month (AUD)',
    description: 'Ideal for serious members ready to connect and communicate directly.',
    highlight: false,
    badge: 'Popular',
    border: 'border-slate-300',
    buttonVariant: 'outline' as const,
    buttonText: 'Choose Silver',
    buttonHref: '/register?plan=silver',
    features: [
      'Everything in Essential',
      'Unlimited direct messaging & chat',
      'Send 50 interests per month',
      'Advanced search & cultural filters',
      '1 profile boost per month',
      'Photo privacy & lock controls',
      'Standard verification support',
      'Member care assistance',
    ],
    notIncluded: [
      'Top-of-search priority discovery',
      'Dedicated profile review',
      'Priority queue member support',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$59',
    period: '/ month (AUD)',
    description: 'Our most popular plan for maximum matches and accelerated discovery.',
    highlight: true,
    badge: 'Most Popular',
    border: 'border-brand-gold ring-2 ring-brand-gold/30',
    buttonVariant: 'gold' as const,
    buttonText: 'Get Started with Gold',
    buttonHref: '/register?plan=gold',
    features: [
      'Everything in Silver',
      'Send 120 interests per month',
      'Top-of-search priority discovery',
      '4 profile visibility boosts per month',
      'Priority verification badge review',
      'Smart compatibility recommendations',
      'See who viewed your profile',
      'Priority member care support',
    ],
    notIncluded: [
      'Dedicated concierge matchmaking review',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$99',
    period: '/ month (AUD)',
    description: 'The ultimate VIP experience with maximum visibility and personal care.',
    highlight: false,
    badge: 'VIP Concierge',
    border: 'border-brand-maroon',
    buttonVariant: 'maroon' as const,
    buttonText: 'Go Platinum',
    buttonHref: '/register?plan=platinum',
    features: [
      'Everything in Gold',
      'Unlimited monthly interests',
      'Maximum visibility in all match feeds',
      '8 profile visibility boosts per month',
      'Fast-track verification review',
      'Dedicated concierge assistance',
      'Profile presentation coaching',
      'Direct phone & front-of-queue care',
    ],
    notIncluded: [],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Profile Creation & Photo Upload', free: true, silver: true, gold: true, platinum: true },
  { feature: 'Browse Verified Member Profiles', free: true, silver: true, gold: true, platinum: true },
  { feature: 'Monthly Interests Quota', free: '5 / month', silver: '50 / month', gold: '120 / month', platinum: 'Unlimited' },
  { feature: 'Direct Messaging & Realtime Chat', free: false, silver: true, gold: true, platinum: true },
  { feature: 'Advanced Community & Visa Filters', free: false, silver: true, gold: true, platinum: true },
  { feature: 'Profile Visibility Boosts', free: false, silver: '1 / month', gold: '4 / month', platinum: '8 / month' },
  { feature: 'Top of Search Results Discovery', free: false, silver: false, gold: true, platinum: true },
  { feature: 'See Who Viewed Your Profile', free: false, silver: false, gold: true, platinum: true },
  { feature: 'Priority Identity & Verification Review', free: false, silver: 'Standard', gold: 'Priority', platinum: 'Fast-Track' },
  { feature: 'Australian Phone & Front-of-Queue Support', free: false, silver: false, gold: false, platinum: true },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins selection:bg-brand-gold/20 selection:text-brand-maroon">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-10 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-4">
            Membership Options &amp; Pricing
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-brand-charcoal mb-4">
            Transparent Pricing. Genuine Connections.
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            All plans are charged in Australian Dollars (AUD) with instant digital access upon payment confirmation. Cancel or upgrade anytime without lock-in contracts.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-600" /> Instant Digital Delivery</span>
            <span className="flex items-center gap-1.5"><CreditCard className="size-4 text-brand-maroon" /> Secure Australian Payments</span>
            <span className="flex items-center gap-1.5"><Building2 className="size-4 text-brand-gold" /> AUD (Incl. GST)</span>
          </div>
        </div>
      </section>

      {/* ── Product & Pricing Cards ───────────────────────────────────── */}
      <section className="pb-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border ${plan.border} flex flex-col relative transition-all duration-300 hover:shadow-md ${
                  plan.highlight ? 'bg-gradient-to-b from-amber-50/40 via-white to-white' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-gold px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-charcoal shadow-sm border border-brand-gold/40">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="font-playfair text-2xl font-bold text-brand-charcoal">{plan.name}</h2>
                  <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>
                  
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-brand-charcoal font-playfair">{plan.price}</span>
                    <span className="text-xs font-semibold text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Billed in AUD · GST Included</p>
                </div>

                <hr className="border-gray-100 mb-5" />

                <ul className="space-y-3 mb-8 flex-1 text-xs sm:text-sm">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-gray-700">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-gray-400">
                      <X className="size-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div>
                  <Link
                    href={plan.buttonHref}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition shadow-sm ${
                      plan.buttonVariant === 'gold'
                        ? 'bg-brand-gold text-brand-charcoal hover:bg-brand-gold/90'
                        : plan.buttonVariant === 'maroon'
                        ? 'bg-brand-maroon text-white hover:bg-brand-maroon/90'
                        : 'border border-brand-maroon/30 text-brand-maroon hover:bg-brand-maroon/5 bg-white'
                    }`}
                  >
                    {plan.buttonText} <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-[11px] text-center text-gray-400 mt-2.5">
                    Instant digital activation
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Merchant Billing Disclosure Banner */}
          <div className="mt-12 rounded-2xl bg-white border border-gray-200/80 p-6 sm:p-8 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6 text-xs text-gray-600">
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">🇦🇺 Australian Business Entity</p>
                <p className="leading-relaxed">
                  Vivah Australia (ABN: 85 700 086 808), registered at 3 Leafton Street, Truganina, VIC 3029, Australia.
                </p>
              </div>
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">💳 Cardholder Statement Descriptor</p>
                <p className="leading-relaxed">
                  Transactions will appear as <strong className="text-brand-charcoal font-semibold">&quot;VIVAH AUSTRALIA&quot;</strong> on cardholder bank statements. All prices are in AUD.
                </p>
              </div>
              <div>
                <p className="font-bold text-brand-charcoal text-sm mb-1">⚡ Digital Service Delivery</p>
                <p className="leading-relaxed">
                  Paid features unlock immediately upon transaction completion. Read our <Link href="/delivery-policy" className="text-brand-maroon underline font-medium">Delivery Policy</Link> and <Link href="/refund-policy" className="text-brand-maroon underline font-medium">Refund Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Comparison Table ─────────────────────────────────── */}
      <section className="bg-white py-16 px-6 sm:px-8 lg:px-12 border-y border-gray-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal mb-3">
              Detailed Plan Comparison
            </h2>
            <p className="text-gray-500 text-sm">
              Review what is included in each membership tier
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-brand-maroon/5 border-b border-gray-200 text-brand-charcoal font-semibold">
                  <th className="py-4 px-6 text-left">Feature</th>
                  <th className="py-4 px-4 text-center">Essential ($0)</th>
                  <th className="py-4 px-4 text-center">Silver ($29/mo)</th>
                  <th className="py-4 px-4 text-center bg-brand-gold/10">Gold ($59/mo)</th>
                  <th className="py-4 px-4 text-center">Platinum ($99/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3.5 px-6 font-medium text-brand-charcoal">{row.feature}</td>
                    
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="size-4 text-emerald-600 mx-auto" /> : <X className="size-4 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-xs font-semibold">{row.free}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {typeof row.silver === 'boolean' ? (
                        row.silver ? <Check className="size-4 text-emerald-600 mx-auto" /> : <X className="size-4 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-xs font-semibold">{row.silver}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center bg-brand-gold/5">
                      {typeof row.gold === 'boolean' ? (
                        row.gold ? <Check className="size-4 text-emerald-600 mx-auto font-bold" /> : <X className="size-4 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-xs font-bold text-brand-charcoal">{row.gold}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {typeof row.platinum === 'boolean' ? (
                        row.platinum ? <Check className="size-4 text-emerald-600 mx-auto" /> : <X className="size-4 text-gray-300 mx-auto" />
                      ) : (
                        <span className="text-xs font-semibold text-brand-maroon">{row.platinum}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-playfair text-3xl font-bold text-brand-charcoal text-center mb-10">
            Billing &amp; Membership FAQs
          </h2>

          <div className="space-y-5">
            {[
              {
                q: 'What currency are your plans billed in?',
                a: 'All membership prices are quoted and processed in Australian Dollars (AUD). Australian Goods and Services Tax (GST) is included where applicable.',
              },
              {
                q: 'How fast is my paid membership delivered?',
                a: 'Delivery is immediate. Your account upgrades within seconds of payment confirmation, unlocking messaging, search filters, and boost credits right away.',
              },
              {
                q: 'How will charges appear on my card statement?',
                a: 'All payments processed on Vivah Australia will appear as "VIVAH AUSTRALIA" on your credit card or bank account statement.',
              },
              {
                q: 'Can I cancel my membership renewal at any time?',
                a: 'Yes. You can cancel your subscription renewal at any time via your Member Dashboard or by contacting support@vivahaustralia.com.au. You will retain access until the end of your paid billing period.',
              },
              {
                q: 'What is your refund policy?',
                a: 'Because digital features are unlocked immediately, subscriptions are generally non-refundable once accessed. However, in accordance with Australian Consumer Law and our Refund Policy, requests due to technical errors, duplicate charges, or platform unavailability are reviewed within 5 business days.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-brand-charcoal text-base mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Need assistance selecting a plan? Call our Melbourne team on{' '}
              <a href="tel:+61479134385" className="font-bold text-brand-maroon hover:underline">
                +61 479 134 385
              </a>{' '}
              or email{' '}
              <a href="mailto:support@vivahaustralia.com.au" className="font-bold text-brand-maroon hover:underline">
                support@vivahaustralia.com.au
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
            Ready to Find Your Life Partner?
          </h2>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Join thousands of genuine Australian Indian singles and families looking for marriage.
          </p>
          <div className="flex justify-center mb-10">
            <PremiumButton href="/register" variant="gold">
              Create Your Free Profile Today
            </PremiumButton>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-brand-gold text-xs sm:text-sm font-medium">
            <span>🛡️ Verified Profiles</span>
            <span className="opacity-50">•</span>
            <span>🔒 Bank-Grade 256-Bit SSL</span>
            <span className="opacity-50">•</span>
            <span>❤️ Real Australian Singles</span>
            <span className="opacity-50">•</span>
            <span>🇦🇺 Truganina, Melbourne VIC</span>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
