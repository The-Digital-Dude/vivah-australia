import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  MessageCircle,
  Phone,
  Flag,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Safety Guidelines | Vivah Australia',
  description:
    'Safety guidelines for matrimonial matchmaking on Vivah Australia. Learn how to protect yourself, spot red flags, and report concerns.',
};

const PRINCIPLES = [
  {
    icon: Lock,
    title: 'Protect Your Personal Information',
    body: 'Never share your home address, financial details, or private phone number early in a conversation. Keep all communication within the secure Vivah in-app messaging system until you feel ready.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100',
  },
  {
    icon: ShieldCheck,
    title: 'Prioritise Verified Profiles',
    body: 'Connect preferentially with Gold or Silver verified members who have had their government ID and location confirmed by our team. Verification badges are awarded after manual review.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: Eye,
    title: 'Trust Your Instincts',
    body: 'If something about a profile or conversation feels wrong, trust that feeling. You are never obliged to continue a conversation or share more information than you are comfortable with.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconBg: 'bg-amber-100',
  },
  {
    icon: Users,
    title: 'Meet Safely in Public',
    body: 'For your first few in-person meetings, always choose well-lit, public spaces — cafes, restaurants, or community events. Always tell a trusted family member or friend where you are going.',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-100',
  },
];

const DOS = [
  'Complete your profile verification to increase trust from other members',
  'Use the in-app message system for all early conversations',
  'Report any suspicious behaviour immediately using the report button',
  'Inform a family member before meeting someone for the first time',
  'Block and report members who make you uncomfortable',
  'Review a member\'s verification badges before sharing personal details',
  'Take your time — a serious match will respect your pace',
];

const DONTS = [
  'Share your home address, workplace, or financial information early',
  'Send money or gift cards to someone you have only met online',
  'Move conversations to external apps before you feel safe',
  'Share private photos unless you are fully comfortable',
  'Ignore red flags because a profile looks impressive',
  'Meet someone in a private or unfamiliar location for a first meeting',
  'Feel pressured to rush the relationship or decision process',
];

const RED_FLAGS = [
  {
    icon: AlertTriangle,
    title: 'Asks for Money or Gifts',
    body: 'Any request for money, gift cards, bank transfers, or financial assistance is a serious warning sign, regardless of the story given.',
  },
  {
    icon: MessageCircle,
    title: 'Pushes to Leave the App',
    body: 'Urgent requests to move to WhatsApp, phone, or another platform very early in a conversation can be a tactic to escape platform moderation.',
  },
  {
    icon: Eye,
    title: 'Inconsistent or Vague Details',
    body: 'If a member\'s story keeps changing, their photos seem professional or AI-generated, or they avoid video calls — these are signs worth investigating.',
  },
  {
    icon: Phone,
    title: 'Excessive Pressure',
    body: 'Love-bombing (overwhelming affection very early), pressure to make quick decisions, or emotional manipulation are red flags in any format.',
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Your Safety First
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Safety Guidelines
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Vivah Australia is built on trust and verification — but personal safety also requires
            awareness and smart habits. Here is what to know.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: ShieldCheck, label: 'Manual verification team' },
              { icon: Flag, label: 'One-tap reporting' },
              { icon: Lock, label: 'Encrypted messaging' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                <Icon className="size-3.5 text-brand-gold" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Four Core Principles ──────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Core Principles
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Stay Safe on Vivah
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {PRINCIPLES.map(({ icon: Icon, title, body, color, iconBg }) => (
              <div key={title} className={`rounded-[28px] border p-7 ${color}`}>
                <div className={`size-12 rounded-2xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-lg mb-3">{title}</h3>
                <p className="text-sm leading-relaxed opacity-80">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Do's and Don'ts ───────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-8 lg:px-12 border-y border-gray-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
              Best Practices
            </p>
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal">
              Do This. Not That.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle className="size-5 text-emerald-600" />
                <h3 className="font-bold text-brand-charcoal text-base">Recommended Actions</h3>
              </div>
              <ul className="space-y-3">
                {DOS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                    <CheckCircle className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-5">
                <XCircle className="size-5 text-red-500" />
                <h3 className="font-bold text-brand-charcoal text-base">What to Avoid</h3>
              </div>
              <ul className="space-y-3">
                {DONTS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                    <XCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Red Flags ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 mb-3">
              Warning Signs
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Recognise Red Flags
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              If you encounter any of these behaviours, block the member and report them immediately.
              Our moderation team reviews every report.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RED_FLAGS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[24px] border border-red-100 bg-red-50 p-6"
              >
                <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                  <Icon className="size-5 text-red-600" />
                </div>
                <h3 className="font-bold text-red-800 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-red-700/80 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Report Section ────────────────────────────────────────────── */}
      <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
                We Have Your Back
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-5">
                Report Concerns Immediately
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-6">
                Every Vivah profile has a one-tap report button. Our moderation team reviews every
                report within 24 hours and takes action on verified concerns — including permanent
                bans and, where appropriate, referral to relevant authorities.
              </p>
              <PremiumButton href="/contact" variant="gold">
                Contact Safety Team
                <ArrowRight className="size-4" />
              </PremiumButton>
            </div>

            <div className="grid gap-4">
              {[
                { step: '1', title: 'Find the member profile', body: 'Open the profile of the member you wish to report.' },
                { step: '2', title: 'Tap the report button', body: 'Use the three-dot menu or report icon on their profile card.' },
                { step: '3', title: 'Select a reason', body: 'Choose the reason that best describes the behaviour or concern.' },
                { step: '4', title: 'Our team investigates', body: 'We review all reports within 24 hours and take appropriate action.' },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/8 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="size-8 shrink-0 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-brand-charcoal">
                    {step}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Links Strip ───────────────────────────────────────────────── */}
      <section className="bg-brand-ivory py-14 px-6 sm:px-8 lg:px-12 border-t border-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-gray-500 mb-4">Related policies and guides</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              ['Verification Policy', '/verification-policy'],
              ['Community Guidelines', '/community-guidelines'],
              ['Privacy Policy', '/privacy'],
              ['Contact Safety Team', '/contact'],
              ['Help Center', '/help'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href!}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
