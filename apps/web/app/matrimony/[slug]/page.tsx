import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLandingPage } from '@/lib/public-api';
import type { FeaturedProfile } from '@/lib/public-api';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { MapPin, Heart, Shield, ArrowRight, CheckCircle, Users, Star } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await getLandingPage(slug);

  if (!page) {
    return { title: 'Not Found' };
  }

  return {
    title: `${page.title} | Vivah Australia`,
    description: page.metaDescription ?? `Find ${page.city ?? ''} ${page.religion ?? ''} matrimony matches on Vivah Australia — Australia's trusted South Asian matrimonial platform.`,
    openGraph: {
      title: `${page.title} | Vivah Australia`,
      description: page.metaDescription ?? '',
      url: `https://vivahaustralia.com.au/matrimony/${slug}`,
      siteName: 'Vivah Australia',
    },
  };
}

function ProfileCard({ profile }: { profile: FeaturedProfile }) {
  const name = profile.personal?.firstName ?? 'Member';
  const age = profile.personal?.age;
  const city = profile.location?.city;
  const state = profile.location?.state;
  const religion = profile.religion?.religion;
  const occupation = profile.employment?.occupation;
  const level = profile.verification?.level;
  const href = profile.slug ? `/profiles/${profile.slug}` : `/profiles/${profile.displayId}`;
  const isVerified = level && level !== 'UNVERIFIED';

  return (
    <Link
      href={href}
      className="group block rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-maroon/30 transition-all duration-200"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-maroon/10 text-2xl font-black text-brand-maroon shadow-inner">
        {name.charAt(0)}
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base font-extrabold text-brand-charcoal">{name}</span>
          {isVerified && <CheckCircle className="size-4 text-emerald-500 flex-shrink-0" />}
        </div>
        {age && <p className="text-sm font-semibold text-gray-500">{age} years old</p>}
        {(city || state) && (
          <p className="flex items-center justify-center gap-1 text-xs text-gray-400 font-semibold">
            <MapPin className="size-3" />
            {[city, state].filter(Boolean).join(', ')}
          </p>
        )}
        {religion && (
          <span className="inline-block rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-charcoal">
            {religion}
          </span>
        )}
        {occupation && (
          <p className="text-[11px] text-gray-400 font-medium truncate">{occupation}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-brand-maroon group-hover:gap-2 transition-all">
        View Profile <ArrowRight className="size-3.5" />
      </div>
    </Link>
  );
}

export default async function MatrimonyLandingPage({ params }: Props) {
  const { slug } = await params;
  const { page, profiles } = await getLandingPage(slug);

  if (!page || !page.active) {
    notFound();
  }

  const headline = page.heroHeadline ?? page.title;
  const subheadline =
    page.heroSubheadline ??
    `Connect with verified ${page.religion ? page.religion + ' ' : ''}singles${page.city ? ` in ${page.city}` : ' across Australia'} looking for a life partner.`;
  const cityLabel = page.city ?? 'Australia';
  const communityLabel = page.religion ? `${page.religion} Community` : 'South Asian Community';

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm text-white">
            <MapPin className="size-4 text-brand-gold" />
            <span>{cityLabel} · {communityLabel}</span>
          </div>

          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 font-medium">
            {subheadline}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { label: 'Verified Members', value: '10,000+' },
              { label: 'Cities Covered',   value: '8+' },
              { label: 'Success Stories',  value: '500+' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-brand-gold">{s.value}</div>
                <div className="mt-0.5 text-xs font-semibold text-white/60 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-gold hover:bg-[#c0903d] px-8 py-3.5 text-base font-bold text-white shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Heart className="size-5" />
              Create Your Profile — Free
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all duration-200"
            >
              Browse Matches
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Profile Grid ────────────────────────────────────────────────── */}
      {profiles.length > 0 && (
        <section className="bg-brand-ivory py-20 px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-2">
                Live Profiles
              </p>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
                {page.religion ? `${page.religion} Singles` : 'Active Members'}{' '}
                <span className="text-brand-maroon">in {cityLabel}</span>
              </h2>
              <p className="mt-3 text-base text-gray-500">Real, verified profiles actively seeking partners.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {profiles.map((profile, i) => (
                <ProfileCard key={profile._id ?? i} profile={profile} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-maroon hover:bg-[#890B40] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Users className="size-5" />
                See All Profiles in {cityLabel}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Custom Body ──────────────────────────────────────────────────── */}
      {page.customBody && (
        <section className="bg-white py-20 px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[28px] bg-brand-ivory border border-gray-100 shadow-sm p-8 sm:p-12">
              <div className="prose prose-base max-w-none text-gray-700 leading-8 whitespace-pre-wrap">
                {page.customBody}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Why Vivah ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-maroon mb-2">
              Why Vivah Australia
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Australia's Most Trusted{' '}
              <span className="text-brand-maroon">Matrimonial Platform</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Fully Verified Members',
                body: 'Every profile is manually reviewed. Government ID verification ensures you only interact with genuine members.',
              },
              {
                icon: Heart,
                title: 'Serious Relationships Only',
                body: 'Our platform is designed for members looking for genuine life partners — not casual connections.',
              },
              {
                icon: Users,
                title: 'Strong Australian Community',
                body: `Thousands of ${communityLabel} members across ${cityLabel} and all major Australian cities.`,
              },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[22px] border border-gray-100 bg-brand-ivory p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-maroon/10">
                    <Icon className="size-6 text-brand-maroon" />
                  </div>
                  <h3 className="text-base font-bold text-brand-charcoal">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ───────────────────────────────────────────── */}
      <section className="bg-brand-maroon py-14 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-5 fill-brand-gold text-brand-gold" />
            ))}
          </div>
          <p className="font-playfair text-xl sm:text-2xl text-white font-semibold leading-snug">
            "We found each other through Vivah Australia. The verification process gave our families full confidence."
          </p>
          <p className="mt-4 text-sm font-semibold text-white/50">Priya & Arjun — {cityLabel}</p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            Begin Your Journey
          </p>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Ready to Find Your Life Partner{' '}
            <span className="text-brand-gold">in {cityLabel}?</span>
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed max-w-xl mx-auto">
            Join thousands of {communityLabel} members already using Vivah Australia to find meaningful, lasting relationships.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <PremiumButton href="/register" variant="gold">
              Create Free Profile
              <ArrowRight className="size-4" />
            </PremiumButton>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 px-8 py-3.5 text-base font-bold text-white transition-all duration-200"
            >
              View Premium Plans
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
