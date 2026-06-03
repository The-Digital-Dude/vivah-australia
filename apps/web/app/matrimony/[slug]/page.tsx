import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLandingPage } from '@/lib/public-api';
import type { FeaturedProfile } from '@/lib/public-api';
import { MapPin, Heart, Shield, ArrowRight, CheckCircle, Users } from 'lucide-react';

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
    <Link href={href} className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#A10E4D]/30 transition-all duration-200">
      {/* Avatar */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A10E4D]/10 to-[#E74C7C]/10 text-2xl font-black text-[#A10E4D] shadow-inner">
        {name.charAt(0)}
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base font-extrabold text-neutral-900">{name}</span>
          {isVerified && <CheckCircle className="size-4 text-emerald-500 flex-shrink-0" />}
        </div>
        {age && <p className="text-sm font-semibold text-neutral-500">{age} years old</p>}
        {(city || state) && (
          <p className="flex items-center justify-center gap-1 text-xs text-neutral-400 font-semibold">
            <MapPin className="size-3" />
            {[city, state].filter(Boolean).join(', ')}
          </p>
        )}
        {religion && (
          <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
            {religion}
          </span>
        )}
        {occupation && (
          <p className="text-[11px] text-neutral-400 font-medium truncate">{occupation}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-[#A10E4D] group-hover:gap-2 transition-all">
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
  const subheadline = page.heroSubheadline ?? `Connect with verified ${page.religion ? page.religion + ' ' : ''}singles${page.city ? ` in ${page.city}` : ' across Australia'} looking for a life partner.`;
  const cityLabel = page.city ?? 'Australia';
  const communityLabel = page.religion ? `${page.religion} Community` : 'South Asian Community';

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1F0A14] via-[#3D0D24] to-[#A10E4D] py-24 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Location badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm">
            <MapPin className="size-4 text-[#D4A04C]" />
            <span>{cityLabel} • {communityLabel}</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 font-medium">
            {subheadline}
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            {[
              { label: 'Verified Members', value: '10,000+' },
              { label: 'Cities Covered', value: '8+' },
              { label: 'Success Stories', value: '500+' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-[#D4A04C]">{s.value}</div>
                <div className="mt-0.5 text-xs font-semibold text-white/60 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#D4A04C] hover:bg-[#c0903d] px-8 py-3.5 text-base font-bold text-white shadow-xl transition-all duration-200 hover:scale-105"
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
      </section>

      {/* ── PROFILE GRID ────────────────────────────────────────────────── */}
      {profiles.length > 0 && (
        <section className="bg-neutral-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-[#A10E4D]">Live Profiles</p>
              <h2 className="mt-2 text-3xl font-extrabold text-neutral-900">
                {page.religion ? `${page.religion} Singles` : 'Active Members'} in {cityLabel}
              </h2>
              <p className="mt-3 text-base text-neutral-500">Real, verified profiles actively seeking partners.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {profiles.map((profile, i) => (
                <ProfileCard key={profile._id ?? i} profile={profile} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#A10E4D] hover:bg-[#890B40] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Users className="size-5" />
                See All Profiles in {cityLabel}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CUSTOM BODY ──────────────────────────────────────────────────── */}
      {page.customBody && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed">
              <p className="text-base whitespace-pre-wrap font-medium">{page.customBody}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── WHY VIVAH ────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[#A10E4D]">Why Vivah Australia</p>
            <h2 className="mt-2 text-3xl font-extrabold text-neutral-900">
              Australia's Most Trusted Matrimonial Platform
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
                <div key={card.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#A10E4D]/10 to-[#E74C7C]/10">
                    <Icon className="size-6 text-[#A10E4D]" />
                  </div>
                  <h3 className="text-base font-extrabold text-neutral-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold leading-tight">
            Ready to Find Your Life Partner in {cityLabel}?
          </h2>
          <p className="mt-4 text-lg text-white/80 font-medium">
            Join thousands of {communityLabel} members already using Vivah Australia.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white hover:bg-neutral-100 px-8 py-3.5 text-base font-bold text-[#A10E4D] shadow-xl transition-all duration-200 hover:scale-105"
            >
              Create Free Profile
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 hover:bg-white/20 px-8 py-3.5 text-base font-bold text-white transition-all duration-200"
            >
              View Premium Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
