import type { Metadata } from 'next';
import Link from 'next/link';
import PlanCTA from './plan-cta';
import {
  ArrowRight,
  Check,
  X,
  Crown,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Eye,
  Zap,
  Lock,
  Phone,
  Globe,
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/app/components';

export const metadata: Metadata = {
  title: 'Membership Plans | Vivah Australia',
  description:
    'Choose the Vivah Australia membership plan that fits your search. From free browsing to platinum concierge — find your life partner faster.',
};

const plans = [
  {
    id: 'free',
    name: 'Essential',
    price: 'Free',
    period: '',
    priceNote: 'No credit card required',
    positioning: 'Begin your search',
    highlight: false,
    badge: null,
    color: 'border-gray-200',
    buttonStyle: 'border border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5',
    buttonLabel: 'Get Started Free',
    features: [
      'Create your profile',
      'Browse verified members',
      'Send 5 interests / month',
      'Receive unlimited interests',
      'Photo privacy controls',
      'Basic search filters',
    ],
    notIncluded: [
      'Direct messaging',
      'Advanced search filters',
      'Priority discovery',
      'Profile boosts',
      'Verification support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29',
    period: '/month',
    priceNote: 'Billed monthly · cancel anytime',
    positioning: 'Best for serious members',
    highlight: false,
    badge: null,
    color: 'border-gray-200',
    buttonStyle: 'border border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5',
    buttonLabel: 'Upgrade to Premium',
    features: [
      'Everything in Essential',
      'Direct messaging',
      '50 interests / month',
      'Advanced search filters',
      '1 profile boost / month',
      'Photo privacy controls',
      'Standard verification support',
      'Member care support',
    ],
    notIncluded: [
      'Priority discovery',
      'Dedicated profile review',
      'Front-of-queue support',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$59',
    period: '/month',
    priceNote: 'Billed monthly · cancel anytime',
    positioning: 'For faster results',
    highlight: true,
    badge: 'Most Popular',
    color: 'border-brand-gold',
    buttonStyle: 'bg-brand-gold text-brand-charcoal hover:bg-brand-gold/90',
    buttonLabel: 'Choose Gold',
    features: [
      'Everything in Premium',
      '120 interests / month',
      'Priority discovery',
      '4 profile boosts / month',
      'Priority verification',
      'Smart compatibility filters',
      'Priority member care',
      'Rise to top of search results',
    ],
    notIncluded: [
      'Dedicated profile review',
      'Concierge matchmaking',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$99',
    period: '/month',
    priceNote: 'Billed monthly · cancel anytime',
    positioning: 'Maximum visibility + concierge',
    highlight: false,
    badge: 'Premium Experience',
    color: 'border-brand-maroon',
    buttonStyle: 'bg-brand-maroon text-white hover:bg-brand-maroon/90',
    buttonLabel: 'Go Platinum',
    features: [
      'Everything in Gold',
      '200 interests / month',
      '8 profile boosts / month',
      'Dedicated profile review',
      'Concierge matchmaking support',
      'Fast-track verification',
      'Front-of-queue support',
      'Highest discovery presence',
    ],
    notIncluded: [],
  },
];

const comparisonRows = [
  { label: 'Monthly Interests', free: '5', premium: '50', gold: '120', platinum: '200' },
  { label: 'Direct Messaging', free: false, premium: true, gold: true, platinum: true },
  { label: 'Advanced Filters', free: false, premium: true, gold: true, platinum: true },
  { label: 'Priority Discovery', free: false, premium: false, gold: true, platinum: true },
  { label: 'Profile Boosts', free: false, premium: '1 / month', gold: '4 / month', platinum: '8 / month' },
  { label: 'Photo Privacy', free: true, premium: true, gold: true, platinum: true },
  { label: 'Verification Support', free: false, premium: 'Standard', gold: 'Priority', platinum: 'Fast-track' },
  { label: 'Dedicated Profile Review', free: false, premium: false, gold: false, platinum: true },
  { label: 'Support Priority', free: 'Standard', premium: 'Member care', gold: 'Priority care', platinum: 'Front-of-queue' },
];

const whyUpgrade = [
  {
    icon: MessageCircle,
    stat: '3×',
    statLabel: 'more conversations',
    title: 'Connect Directly',
    desc: 'Stop waiting. Premium members message serious verified members instantly — no interest-request bottleneck.',
  },
  {
    icon: Eye,
    stat: '5×',
    statLabel: 'more profile views',
    title: 'Get Noticed',
    desc: 'Profile boosts push you to the top of search results and daily recommendations when members are actively browsing.',
  },
  {
    icon: TrendingUp,
    stat: '50+',
    statLabel: 'curated matches/month',
    title: 'Reach More Matches',
    desc: 'Our compatibility engine surfaces profiles aligned with your values, lifestyle, and goals — not just anyone nearby.',
  },
  {
    icon: Zap,
    stat: '4 weeks',
    statLabel: 'average to first meeting',
    title: 'Find Faster',
    desc: 'Gold and Platinum members find meaningful matches in a fraction of the time compared to free browsing.',
  },
];

const testimonials = [
  {
    names: 'Priya & Arjun',
    location: 'Sydney, NSW',
    tier: 'Gold Member',
    quote: "Arjun upgraded to Gold and within three weeks we were having genuine conversations. Something that felt impossible on other platforms. We got engaged last December.",
    duration: 'Met in 6 weeks',
  },
  {
    names: 'Kavya & Rahul',
    location: 'Melbourne, VIC',
    tier: 'Premium Member',
    quote: "The advanced filters were the game changer. I found someone who shared my values. His boosted profile showed up first — and the rest is history.",
    duration: 'Met in 5 weeks',
  },
  {
    names: 'Ananya & Dev',
    location: 'Brisbane, QLD',
    tier: 'Platinum Member',
    quote: "As a busy professional I needed a platform that respected my time. Vivah's Platinum gave me curated introductions and a team that helped me present my best self.",
    duration: 'Met in 4 weeks',
  },
];

const faqs = [
  {
    q: 'Can I cancel my membership at any time?',
    a: 'Yes. All paid plans are billed monthly with no lock-in contracts. You can cancel at any time from your account settings and your access will continue until the end of your billing period.',
  },
  {
    q: 'Is there a free trial for Premium or Gold?',
    a: 'We offer a 7-day trial on selected plans for new members. The Essential (Free) plan is always available with no time limit.',
  },
  {
    q: 'How does billing work?',
    a: 'Plans are billed monthly via Stripe, our secure payment partner. We accept Visa, Mastercard, Amex, Apple Pay, Google Pay, and PayPal. Your payment details are never stored on our servers.',
  },
  {
    q: 'What is a profile boost?',
    a: "A profile boost temporarily places your profile at the top of search results and daily recommendations. Boosts last 24 hours and significantly increase the number of members who see your profile.",
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Absolutely. You can upgrade at any time and the change takes effect immediately. Downgrades take effect at the end of your current billing cycle. All plan changes are managed from your account settings.',
  },
  {
    q: 'What does the Platinum concierge service include?',
    a: 'Platinum members receive a dedicated profile review from our matchmaking team, personalised tips to improve your profile, and front-of-queue support for any queries. Our concierge team is here to maximise your chances of finding the right match.',
  },
];

const trustBadges = [
  { icon: ShieldCheck, label: 'Verified Profiles', sub: 'Every member manually reviewed' },
  { icon: Lock, label: 'Secure Payments', sub: 'Stripe-powered checkout' },
  { icon: Globe, label: 'Privacy Protected', sub: 'Your data stays yours' },
  { icon: Phone, label: 'Australian Support', sub: 'Local team, real humans' },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="size-5 text-brand-maroon mx-auto" strokeWidth={2.5} />;
  if (value === false) return <X className="size-4 text-gray-300 mx-auto" />;
  return <span className="text-sm font-semibold text-brand-charcoal">{value}</span>;
}

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
            <div className="flex justify-center mb-5">
              <Crown className="size-10 text-brand-gold" strokeWidth={1.5} />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
              Choose Your Plan
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-white leading-tight mb-6">
              Invest in Your<br />
              <span className="text-brand-gold">Perfect Match</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              From free browsing to dedicated concierge matchmaking — choose the plan that fits where you are in your journey. Every plan is built for serious, meaningful connections.
            </p>
            {/* Trust mini-strip */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {['No lock-in contracts', 'Cancel anytime', 'Secure Stripe checkout', 'Australian support'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-white/60 text-sm">
                  <Check className="size-3.5 text-brand-gold" strokeWidth={2.5} />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
            </svg>
          </div>
        </section>

        {/* PLAN CARDS */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl border-2 ${plan.color} flex flex-col p-7 shadow-sm ${plan.highlight ? 'shadow-[0_12px_40px_rgba(212,160,76,0.18)]' : 'hover:shadow-md'} transition`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap ${plan.highlight ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-maroon text-white'}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6 pt-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-maroon/60 mb-1">{plan.positioning}</p>
                    <h2 className="text-2xl font-playfair font-bold text-brand-charcoal mb-3">{plan.name}</h2>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold font-playfair text-brand-charcoal">{plan.price}</span>
                      {plan.period && <span className="text-gray-400 text-base mb-1">{plan.period}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{plan.priceNote}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-brand-charcoal">
                        <Check className={`size-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-brand-gold' : 'text-brand-maroon'}`} strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                        <X className="size-4 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <PlanCTA
                    tierKey={plan.id.toUpperCase() as 'FREE' | 'PREMIUM' | 'GOLD' | 'PLATINUM'}
                    label={plan.buttonLabel}
                    style={plan.buttonStyle}
                  />
                </div>
              ))}
            </div>

            <p className="text-center text-gray-400 text-sm mt-8">
              All prices in AUD. Annual and quarterly billing options available — save up to 30%.
            </p>
          </div>
        </section>

        {/* WHY UPGRADE */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Why Upgrade</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                Find Your Match Faster
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
                <div className="size-1.5 rotate-45 bg-brand-gold" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyUpgrade.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-brand-ivory rounded-2xl border border-gray-100 p-7 flex flex-col gap-4">
                    <div className="size-12 rounded-xl bg-white border border-brand-maroon/10 flex items-center justify-center text-brand-maroon shadow-sm">
                      <Icon className="size-6" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-playfair text-brand-maroon">{item.stat}</p>
                      <p className="text-xs text-gray-500 font-semibold">{item.statLabel}</p>
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-base">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Side by Side</p>
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal">
                Plan Comparison
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-5 border-b border-gray-100">
                <div className="p-5 col-span-1" />
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-5 text-center border-l border-gray-100 ${plan.highlight ? 'bg-brand-gold/5' : ''}`}
                  >
                    <p className="font-bold text-brand-charcoal text-base">{plan.name}</p>
                    <p className="text-brand-maroon font-bold text-lg font-playfair">{plan.price}{plan.period}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {comparisonRows.map((row, idx) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-5 border-b border-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                >
                  <div className="p-4 pl-5 col-span-1 flex items-center">
                    <span className="text-sm font-semibold text-brand-charcoal">{row.label}</span>
                  </div>
                  {(['free', 'premium', 'gold', 'platinum'] as const).map((key) => (
                    <div
                      key={key}
                      className={`p-4 flex items-center justify-center border-l border-gray-50 ${key === 'gold' ? 'bg-brand-gold/5' : ''}`}
                    >
                      <ComparisonCell value={row[key]} />
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div className="grid grid-cols-5 pt-6 pb-6 border-t border-gray-100">
                <div className="col-span-1" />
                {plans.map((plan) => (
                  <div key={plan.id} className={`px-3 text-center border-l border-gray-100 ${plan.highlight ? 'bg-brand-gold/5' : ''}`}>
                    <PlanCTA
                      tierKey={plan.id.toUpperCase() as 'FREE' | 'PREMIUM' | 'GOLD' | 'PLATINUM'}
                      label={plan.id === 'free' ? 'Start Free' : 'Choose'}
                      style={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition ${plan.buttonStyle}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.12),transparent_55%)]" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">Member Stories</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white">
                Real Results
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.names}
                  className="bg-white/8 border border-white/10 rounded-2xl p-7 flex flex-col gap-5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  <p className="text-white/80 text-base leading-relaxed italic flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{t.names}</p>
                      <p className="text-white/50 text-xs">{t.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-gold text-xs font-bold">{t.tier}</p>
                      <p className="text-white/50 text-xs">{t.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/success-stories"
                className="inline-flex items-center gap-2 text-brand-gold font-bold text-base hover:underline"
              >
                Read All Success Stories <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* TRUST BADGES */}
        <section className="py-14 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {trustBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-4">
                    <div className="shrink-0 size-11 rounded-xl bg-brand-ivory border border-brand-maroon/10 flex items-center justify-center text-brand-maroon">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-bold text-brand-charcoal text-sm">{badge.label}</p>
                      <p className="text-gray-400 text-xs">{badge.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Got Questions?</p>
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-brand-charcoal">
                Membership FAQs
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7">
                  <h3 className="font-bold text-brand-charcoal text-base sm:text-lg mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-500 text-base mt-8">
              Still have questions?{' '}
              <Link href="/help" className="text-brand-maroon font-bold hover:underline">
                Visit our Help Center
              </Link>
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Sparkles className="size-8 text-brand-gold mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
              Ready to Find Your Match?
            </h2>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Join thousands of Australian Indian singles who are finding meaningful connections every day. Start free — upgrade when you are ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Create Free Profile <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/membership#plans"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Compare Plans <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
