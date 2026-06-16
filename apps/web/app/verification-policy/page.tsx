import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';

const slug = 'verification-policy';
const fallback = {
  title: 'Verification Policy',
  description: 'Understand the Vivah Australia trust ladder and how verification badges are reviewed and granted.',
  eyebrow: 'Profile Verification',
  body: `We are committed to building the most trusted South Asian matrimonial community in Australia. Our verification policy defines the trust ladder that governs how member badges are awarded.

Why Verification Matters
Verification builds confidence for both members and their families. Knowing that the person you are connecting with has been reviewed by our team removes uncertainty and allows conversations to happen with genuine trust.

The Vivah Verification Ladder

1. Basic Verification
Achieved immediately upon confirming your email address and mobile number via OTP. This is the minimum level required to send and receive interests.

2. Silver Badge
Granted after our admin team manually reviews and approves a valid government-issued photo ID — such as an Australian driver licence, passport, or equivalent international ID. Processing takes 1–3 business days.

3. Gold Badge
Awarded when members additionally verify their current address (via utility bill or tenancy agreement) or current professional employment (via employment letter or pay stub). Gold verification confirms both identity and residency.

4. Platinum / Fully Verified
Our highest trust level. Awarded after a comprehensive verification check by our dedicated support agents, confirming that all profile details — identity, photo, occupation, education, and address — are consistent, accurate, and current.

Document Handling
All verification documents are handled with strict confidentiality. Documents are reviewed by trained team members and stored in encrypted, access-controlled cloud storage. Documents are never shared with other members or third parties.

Verification Review Time
- Basic: Instant
- Silver: 1–3 business days
- Gold: 2–5 business days
- Platinum: 3–7 business days

Revoking Badges
Verification badges may be revoked if a member provides false information, updates their profile in a way that conflicts with verified details, or violates our community guidelines.

Contact
For verification enquiries, contact support@vivahaustralia.com.au.`,
};

const BADGE_TIERS = [
  { level: 'Basic',    desc: 'Email & mobile OTP confirmed',            time: 'Instant',      color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { level: 'Silver',   desc: 'Government-issued photo ID reviewed',      time: '1–3 days',     color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { level: 'Gold',     desc: 'Address or employment proof confirmed',    time: '2–5 days',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { level: 'Platinum', desc: 'Full profile consistency check completed', time: '3–7 days',     color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function VerificationPolicyPage() {
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
            <ShieldCheck className="size-5 text-brand-gold" />
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

      {/* Badge tier summary */}
      <section className="py-12 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {BADGE_TIERS.map(({ level, desc, time, color }) => (
              <div key={level} className={`rounded-[18px] border p-5 flex items-start gap-4 ${color}`}>
                <CheckCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">{level} Verification</p>
                  <p className="text-xs mt-0.5 opacity-80">{desc}</p>
                  <p className="text-xs mt-1 font-semibold opacity-60">Review time: {time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Full policy text */}
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-12">
            {renderPolicyBody(body)}
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Verification question?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our team reviews all verification documents within 3–7 days.</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0">
              Contact Support <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/verification-policy" />
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
        const prevTrimmed = i > 0 ? lines[i - 1].trim() : null;
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
    ['Refund Policy',         '/refund-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Verification Policy',   '/verification-policy'],
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
