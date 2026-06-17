import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Sparkles,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/app/components';

export const metadata: Metadata = {
  title: 'About Us | Vivah Australia',
  description:
    'Vivah Australia is the premier matrimonial platform for Indian singles and families across Australia — built on trust, culture, and meaningful connections.',
};

const stats = [
  { value: '10,000+', label: 'Registered Members' },
  { value: '5,000+', label: 'Verified Profiles' },
  { value: '500+', label: 'Success Stories' },
  { value: '8', label: 'States & Territories' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    desc: 'Every profile is manually verified by our team before going live. We maintain strict authenticity standards so you can browse with complete confidence.',
  },
  {
    icon: Heart,
    title: 'Cultural Sensitivity',
    desc: 'We deeply understand the nuances of Indian matrimony — from family expectations to community traditions. Our platform is built to honour your values, not override them.',
  },
  {
    icon: LockKeyhole,
    title: 'Privacy & Security',
    desc: 'Your personal details are never shared without consent. You control who sees your profile, your photos, and your contact information at every stage.',
  },
  {
    icon: Globe,
    title: 'Inclusive Community',
    desc: 'Hindu, Muslim, Sikh, Christian, Jain, Buddhist — all Indian and South Asian communities are welcome. We celebrate diversity while respecting individual traditions.',
  },
  {
    icon: Sparkles,
    title: 'Serious Intentions',
    desc: "Vivah Australia is not a dating app. It's a matrimonial platform built for people and families who are serious about finding a life partner.",
  },
  {
    icon: MapPin,
    title: 'Australia-Focused',
    desc: 'Built specifically for the Australian Indian diaspora — we understand the unique challenges of balancing Australian life with Indian matrimonial traditions.',
  },
];

const team = [
  {
    name: 'Rohan Mehta',
    role: 'Co-Founder & CEO',
    bio: 'A second-generation Indian-Australian who experienced the gap in quality matrimonial services firsthand. Rohan founded Vivah Australia to bridge culture and technology.',
    initial: 'R',
  },
  {
    name: 'Priya Sharma',
    role: 'Co-Founder & Head of Community',
    bio: 'With a background in social work and community building, Priya ensures every member feels safe, respected, and genuinely supported throughout their journey.',
    initial: 'P',
  },
  {
    name: 'Anil Kapoor',
    role: 'Head of Verification & Trust',
    bio: 'Former compliance officer with 12 years of experience, Anil leads our rigorous manual verification process that sets Vivah Australia apart from other platforms.',
    initial: 'A',
  },
];

const milestones = [
  { year: '2020', event: 'Vivah Australia founded in Sydney with a vision to serve the Australian Indian diaspora.' },
  { year: '2021', event: 'Launched our manual verification system — the first of its kind on an Australian matrimonial platform.' },
  { year: '2022', event: 'Reached 2,000 members across all Australian states and celebrated 100 success stories.' },
  { year: '2023', event: 'Introduced smart matchmaking algorithms and expanded community features.' },
  { year: '2024', event: 'Crossed 5,000 verified profiles and 500 confirmed engagements and marriages.' },
  { year: '2025', event: 'Launched the Premium and Elite membership tiers with dedicated matchmaking consultants.' },
];

const communities = [
  'Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Parsi', 'All Backgrounds Welcome',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
              Our Story
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-white leading-tight mb-6">
              Built for Australia&apos;s<br />Indian Community
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Vivah Australia was founded with one purpose — to create a safe, authentic, and culturally aware matrimonial platform for Indian singles and families who call Australia home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Join Our Community <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/success-stories"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Read Success Stories
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
            </svg>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-brand-ivory -mt-2">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center"
                >
                  <p className="text-3xl sm:text-4xl font-bold font-playfair text-brand-maroon mb-2">{s.value}</p>
                  <p className="text-sm font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">Our Mission</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal mb-6 leading-tight">
                Meaningful Connections.<br />Grounded in Culture.
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-5">
                Australia&apos;s Indian community deserves a matrimonial platform that truly understands them — one that respects cultural values while embracing the realities of modern Australian life.
              </p>
              <p className="text-gray-600 text-base leading-relaxed mb-5">
                We built Vivah Australia because we saw a gap. Existing platforms were either too generic, too outdated, or lacked the verification and safety standards that serious matrimonial introductions demand.
              </p>
              <p className="text-gray-600 text-base leading-relaxed mb-8">
                Today, we are Australia&apos;s most trusted Indian matrimonial platform — connecting singles from Sydney to Perth, Melbourne to Darwin, all through a foundation of trust, transparency, and cultural pride.
              </p>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-brand-maroon font-bold text-base hover:underline"
              >
                See How It Works <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Visual card */}
            <div className="bg-brand-maroon rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
              <div className="relative z-10">
                <Heart className="size-10 text-brand-gold mb-6" strokeWidth={1.5} />
                <blockquote className="text-white text-xl sm:text-2xl font-playfair font-bold leading-snug mb-6">
                  &ldquo;We don&apos;t just connect profiles. We connect people who share values, dreams, and a love for two cultures.&rdquo;
                </blockquote>
                <p className="text-brand-gold font-semibold text-sm">— The Vivah Australia Team</p>

                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                  {[
                    'Manual profile verification',
                    'Australia-wide community',
                    'All Indian communities',
                    'Privacy by design',
                    'Family-friendly platform',
                    'Serious intentions only',
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 shrink-0 text-brand-gold" />
                      <span className="text-white/80 text-sm font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">What We Stand For</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal mb-4">
                Our Core Values
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
                <div className="size-1.5 rotate-45 bg-brand-gold" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="bg-brand-ivory rounded-2xl border border-gray-100 p-7 flex flex-col gap-4 hover:shadow-md transition"
                  >
                    <div className="size-12 rounded-xl bg-white border border-brand-maroon/10 flex items-center justify-center text-brand-maroon shadow-sm">
                      <Icon className="size-6" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-lg">{v.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMMUNITIES */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">United by Culture</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal mb-4">
              A Home for Every Community
            </h2>
            <div className="flex items-center justify-center gap-2 mb-12">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-gold" />
              <div className="size-1.5 rotate-45 bg-brand-gold" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-gold" />
            </div>
            <p className="text-gray-600 text-base leading-relaxed max-w-2xl mx-auto mb-10">
              We serve all Indian and South Asian communities across Australia. Whether you are Hindu, Muslim, Sikh, or from any other background — you belong here.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {communities.map((c) => (
                <span
                  key={c}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold border transition ${
                    c === 'All Backgrounds Welcome'
                      ? 'bg-brand-maroon text-white border-brand-maroon'
                      : 'bg-white text-brand-charcoal border-gray-200 hover:border-brand-maroon/30 hover:bg-brand-ivory'
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* MILESTONES */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.12),transparent_55%)]" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-3">Our Journey</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white">
                From Vision to Community
              </h2>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[28px] sm:left-1/2 top-0 bottom-0 w-px bg-white/15 sm:-translate-x-px" />

              <div className="space-y-10">
                {milestones.map((m, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div key={m.year} className={`relative flex items-start gap-6 sm:gap-0 ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                      {/* Dot */}
                      <div className="absolute left-[22px] sm:left-1/2 sm:-translate-x-1/2 size-3.5 rounded-full bg-brand-gold border-2 border-brand-maroon mt-1.5 z-10" />

                      {/* Year bubble */}
                      <div className={`pl-12 sm:pl-0 sm:w-1/2 ${isEven ? 'sm:pr-10 sm:text-right' : 'sm:pl-10 sm:text-left'}`}>
                        <span className="inline-block bg-brand-gold text-brand-charcoal text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                          {m.year}
                        </span>
                        <p className="text-white/80 text-base leading-relaxed">{m.event}</p>
                      </div>

                      {/* Spacer */}
                      <div className="hidden sm:block sm:w-1/2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">The People Behind Vivah</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-brand-charcoal">
                Meet Our Team
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="size-20 rounded-full bg-brand-maroon flex items-center justify-center text-white text-2xl font-bold font-playfair mx-auto mb-5 shadow-lg">
                    {member.initial}
                  </div>
                  <h3 className="font-bold text-brand-charcoal text-lg mb-1">{member.name}</h3>
                  <p className="text-brand-gold text-sm font-semibold mb-4">{member.role}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL STRIP */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-brand-ivory border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-6">
              {[
                {
                  quote: "I was skeptical at first, but the verification process gave me so much confidence. Found my husband within 3 months.",
                  name: 'Aisha K.',
                  location: 'Melbourne',
                },
                {
                  quote: "As a family, we were searching for our son. The platform was respectful, easy to use and genuinely different from others.",
                  name: 'The Sharma Family',
                  location: 'Sydney',
                },
              ].map((t) => (
                <div key={t.name} className="flex-1 bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 text-brand-gold fill-brand-gold" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <p className="font-bold text-brand-charcoal text-sm">{t.name}</p>
                  <p className="text-gray-400 text-sm">{t.location}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Sparkles className="size-8 text-brand-gold mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
              Become Part of Our Story
            </h2>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Join thousands of Australian Indian singles and families who have found meaningful connections through Vivah Australia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded bg-brand-gold px-8 py-4 text-base font-bold text-brand-charcoal transition hover:bg-brand-gold/90"
              >
                Create Free Profile <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
