import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, Heart, Lock, MapPin, Search, Sparkles, Users } from 'lucide-react';
import { ProfileMatchCard, PublicFooter, PublicHeader, type ProfileMatchCardProfile } from '@/app/components';
import { CommunityStatsStrip } from '@/app/components/home/community-stats-strip';
import { FaqSection } from '@/app/components/home/faq-section';
import { HeroSearchForm } from '@/app/components/home/hero-search-form';
import { HowItWorksSection } from '@/app/components/home/how-it-works-section';
import { MinimalPricingSection } from '@/app/components/home/minimal-pricing-section';
import { SuccessStoriesSlider } from '@/app/components/home/success-stories-slider';
import { TrustVerificationStrip } from '@/app/components/home/trust-verification-strip';
import { loadHomepageData } from '@/lib/homepage-data';
import { AnimatedWordPlay } from './animated-word-play';

type VariantKey = 'premium' | 'search' | 'story';

const variantCopy: Record<
  VariantKey,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    navLabel: string;
  }
> = {
  premium: {
    eyebrow: 'Premium Trust-First',
    title: 'Premium trust-first homepage',
    subtitle:
      'Dark-luxe and membership-led: gold accents, concierge tone, and plans presented up front.',
    navLabel: 'Premium Home',
  },
  search: {
    eyebrow: 'Search-First',
    title: 'Search-first matchmaker homepage',
    subtitle:
      'Utility-first and crisp: live profiles, filters, and metrics before anything decorative.',
    navLabel: 'Search Home',
  },
  story: {
    eyebrow: 'Story-Led',
    title: 'Story-led emotional homepage',
    subtitle:
      'Warm romance: rose tones, polaroid stories, and emotion before features.',
    navLabel: 'Story Home',
  },
};

const variantImages = {
  premium: '/home/hero-vivah-australia.png',
  search: '/success-stories/couple-sydney.jpg',
  story: '/success-stories/couple-melbourne.jpg',
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  const selected = isVariantKey(variant) ? variantCopy[variant] : variantCopy.premium;

  return {
    title: `${selected.title} | Vivah Australia`,
    description: selected.subtitle,
  };
}

export default async function HomepageVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;

  if (!isVariantKey(variant)) {
    notFound();
  }

  const data = await loadHomepageData();
  const profiles = data.featuredProfiles.slice(0, 3).map(toMatchCardProfile);
  const selected = variantCopy[variant];

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#2f2f2f]">
      <PublicHeader />
      <section className="border-b border-[#a10e4d]/10 bg-[#fff9f5] px-8 py-4 sm:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-sm font-semibold text-[#5f5f5f]">
          <span className="text-[#d4a04c]">Homepage variants:</span>
          <span className="rounded-full bg-white px-3 py-1 text-[#a10e4d] shadow-sm">
            {selected.navLabel}
          </span>
          <span className="font-normal text-[#5f5f5f]">— {selected.subtitle}</span>
        </div>
      </section>

      {variant === 'premium' ? (
        <>
          <PremiumVariantHero data={data} />
          <div className="pt-12">
            <CommunityStatsStrip />
          </div>
          <MinimalPricingSection />
          <TrustVerificationStrip />
          <SuccessStoriesSlider />
          <FaqSection />
        </>
      ) : null}

      {variant === 'search' ? (
        <>
          <SearchVariantHero data={data} />
          <section className="px-8 pt-4 sm:px-12 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <HeroSearchForm />
            </div>
          </section>
          <section className="px-8 pb-20 pt-4 sm:px-12 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
                    Live profiles
                  </p>
                  <h2 className="mt-2 font-playfair text-3xl font-bold text-[#2f2f2f] sm:text-4xl">
                    Browse matches from the live API
                  </h2>
                </div>
                <div className="hidden rounded-full border border-[#a10e4d]/12 bg-white px-4 py-2 text-sm font-semibold text-[#a10e4d] shadow-sm md:block">
                  {data.featuredProfiles.length} profiles loaded
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <ProfileMatchCard key={profile.id} profile={profile} compact />
                ))}
              </div>
            </div>
          </section>
          <HowItWorksSection />
          <TrustVerificationStrip />
          <MinimalPricingSection />
          <FaqSection />
        </>
      ) : null}

      {variant === 'story' ? (
        <>
          <StoryVariantHero data={data} />
          <SuccessStoriesSlider />
          {/* rose pull-quote band */}
          <section className="relative overflow-hidden bg-[linear-gradient(135deg,#A10E4D_0%,#E74C7C_100%)] px-8 py-16 text-center sm:px-12 lg:px-16">
            <Heart className="absolute left-[8%] top-[20%] size-6 animate-pulse fill-white/15 text-white/15" />
            <Heart className="absolute bottom-[22%] right-[7%] size-8 animate-pulse fill-white/10 text-white/10" />
            <div className="mx-auto max-w-3xl">
              <p className="font-cormorant text-3xl font-semibold italic leading-snug text-white sm:text-4xl">
                &ldquo;We didn&apos;t just find each other — our families found each other too.&rdquo;
              </p>
              <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                <span className="h-px w-12 bg-[#F7D88A]/70" />
                <Heart className="size-3.5 fill-[#F7D88A] text-[#F7D88A]" />
                <span className="h-px w-12 bg-[#F7D88A]/70" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#F7D88A]">
                New couples across Australia, every month
              </p>
            </div>
          </section>
          <section className="px-8 pb-20 pt-4 sm:px-12 lg:px-16">
            <div className="mx-auto max-w-7xl rounded-[34px] border border-[#a10e4d]/10 bg-[linear-gradient(135deg,#fffdf9_0%,#fff3ea_100%)] p-8 shadow-[0_24px_60px_rgba(161,14,77,0.07)] sm:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
                    Why this works
                  </p>
                  <h2 className="mt-3 font-playfair text-4xl font-bold text-[#2f2f2f] sm:text-5xl">
                    Emotion first, then trust, then action.
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f5f5f]">
                    This layout keeps the storytelling and reassurance close together so families
                    can feel comfortable before diving into filters or pricing.
                  </p>
                </div>
                <div className="grid gap-3">
                  {['Real success stories', 'Verification signals', 'Family-friendly tone'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-[#a10e4d]/8 bg-white px-4 py-4 text-sm font-semibold text-[#2f2f2f]"
                    >
                      <Sparkles className="size-4 text-[#a10e4d]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <HowItWorksSection />
          <TrustVerificationStrip />
          <CommunityStatsStrip />
          <MinimalPricingSection />
          <FaqSection />
        </>
      ) : null}

      <PublicFooter />
    </main>
  );
}

function PremiumVariantHero({ data }: Readonly<{ data: Awaited<ReturnType<typeof loadHomepageData>> }>) {
  const luxeItems = [
    { label: 'Gold Verification', icon: BadgeCheck },
    { label: 'Concierge Support', icon: Users },
    { label: 'Private by Design', icon: Lock },
    { label: 'Australia-wide', icon: MapPin },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(150deg,#3D0620_0%,#6B0934_48%,#8B0C42_100%)]">
      {/* gold atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.20),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,160,76,0.10),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      {/* gold hairlines top + bottom */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4A04C]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4A04C]/60 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-8 py-20 sm:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-16 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D4A04C]/45 bg-[#D4A04C]/10 px-5 py-2">
            <Sparkles className="size-3.5 text-[#D4A04C]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F7D88A]">
              The Premium Experience
            </span>
          </div>
          <h1 className="mt-7 font-playfair text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            Where serious intentions
            <span className="mt-1 block text-[#D4A04C]">meet refined matchmaking.</span>
          </h1>
          <div className="my-7 flex items-center gap-3">
            <span className="h-px w-16 bg-gradient-to-r from-[#D4A04C] to-transparent" />
            <span className="size-1.5 rotate-45 bg-[#D4A04C]" />
            <span className="h-px w-16 bg-gradient-to-l from-[#D4A04C] to-transparent" />
          </div>
          <p className="max-w-lg text-base leading-7 text-white/70">
            {data.home.hero?.subtitle ||
              'An elevated matrimonial experience for members who value discretion, verification, and introductions with real intent.'}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {luxeItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-[#D4A04C]/25 bg-white/5 px-3 py-4 text-center backdrop-blur-sm"
              >
                <Icon className="mx-auto size-5 text-[#D4A04C]" />
                <p className="mt-2.5 text-xs font-semibold leading-4 text-white/85">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/membership"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D4A04C] px-8 py-3.5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(212,160,76,0.40)] transition hover:-translate-y-0.5 hover:bg-[#C4913C]"
            >
              Explore Premium Plans
            </a>
            <a
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              Create Your Profile
            </a>
          </div>
        </div>

        {/* gold-framed portrait */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[48px] bg-[radial-gradient(circle_at_center,rgba(212,160,76,0.22),transparent_65%)] blur-2xl" />
          <div className="absolute -inset-2 rounded-[44px] border border-[#D4A04C]/40" />
          <div className="relative overflow-hidden rounded-[40px] border-2 border-[#D4A04C]/60 p-2">
            <div className="relative aspect-[0.96] overflow-hidden rounded-[32px]">
              <Image
                src={variantImages.premium}
                alt="Vivah Australia couple"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(61,6,32,0.55)_100%)]" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[#D4A04C]/40 bg-black/30 px-5 py-3.5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F7D88A]">Gold members</p>
              <p className="mt-1 text-sm font-medium text-white/90">
                Priority visibility &amp; concierge introductions
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchVariantHero({ data }: Readonly<{ data: Awaited<ReturnType<typeof loadHomepageData>> }>) {
  const previewProfiles = data.featuredProfiles.slice(0, 3).map(toMatchCardProfile);
  const metrics = [
    ['15,000+', 'Verified profiles'],
    ['6', 'Trust checks per member'],
    ['8', 'Cities covered'],
    ['24h', 'Support response'],
  ] as const;

  return (
    <section className="border-b border-[#2f2f2f]/10 bg-white">
      {/* metrics bar — utility-first signal */}
      <div className="border-b border-[#2f2f2f]/10 bg-[#FAFAF8] px-8 py-3 sm:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2">
          {metrics.map(([val, lbl]) => (
            <div key={lbl} className="flex items-baseline gap-2">
              <span className="font-playfair text-lg font-bold text-[#A10E4D]">{val}</span>
              <span className="text-xs font-medium text-[#5f5f5f]">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-8 py-14 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-16">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#A10E4D]">
            Search-first matchmaking
          </p>
          <h1 className="mt-4 font-playfair text-4xl font-bold leading-[1.1] text-[#2f2f2f] sm:text-5xl">
            Find exactly who
            <br />
            you&apos;re looking for.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#5f5f5f]">
            Precise filters, live verified profiles, and compatibility signals — discovery tools up
            front so serious members can browse faster.
          </p>
          <ul className="mt-6 grid gap-2.5">
            {['Filter by age, community, city & values', 'Every profile individually verified', 'Privacy controls on by default'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-[#2f2f2f]">
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#A10E4D]/10">
                    <Search className="size-3 text-[#A10E4D]" />
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/matches"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a10e4d] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_26px_rgba(161,14,77,0.22)] transition hover:bg-[#8e0d43]"
            >
              <Search className="size-4" />
              Search Matches
            </a>
            <a
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2f2f2f]/15 bg-white px-7 py-3 text-sm font-bold text-[#2f2f2f] transition hover:border-[#A10E4D]/40 hover:text-[#A10E4D]"
            >
              Create Your Profile
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {previewProfiles.map((profile) => (
            <ProfileMatchCard key={profile.id} profile={profile} compact />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryVariantHero({ data }: Readonly<{ data: Awaited<ReturnType<typeof loadHomepageData>> }>) {
  return (
    <section className="relative overflow-hidden border-b border-[#E74C7C]/15 bg-[linear-gradient(160deg,#FFF1F5_0%,#FFE9EF_55%,#FFF6F0_100%)] px-8 py-16 sm:px-12 lg:px-16">
      {/* soft rose atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,76,124,0.14),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,160,76,0.12),transparent_45%)]" />
      {/* scattered hearts */}
      <Heart className="absolute left-[5%] top-[14%] size-5 animate-pulse fill-[#E74C7C]/30 text-[#E74C7C]/30" />
      <Heart className="absolute right-[8%] top-[20%] size-4 animate-pulse fill-[#D4A04C]/35 text-[#D4A04C]/35" />
      <Heart className="absolute bottom-[18%] left-[12%] size-3.5 animate-pulse fill-[#E74C7C]/25 text-[#E74C7C]/25" />
      <Heart className="absolute bottom-[12%] right-[5%] size-6 animate-pulse fill-[#E74C7C]/20 text-[#E74C7C]/20" />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E74C7C]/30 bg-white/80 px-4 py-2 backdrop-blur-sm">
            <Heart className="size-3.5 fill-[#E74C7C] text-[#E74C7C]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#A10E4D]">
              Real stories of love
            </span>
          </div>
          <div className="mt-6">
            <AnimatedWordPlay
              eyebrow=""
              prefix="People trust"
              words={['stories', 'families', 'warmth', 'memories']}
              suffix=" before they trust features."
              body={
                data.home.hero?.subtitle ||
                'Success stories and reassurance come first, so the experience feels warm, human, and family friendly.'
              }
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#E74C7C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_38px_rgba(231,76,124,0.35)] transition hover:-translate-y-0.5 hover:bg-[#D63D6D]"
            >
              <Heart className="size-4 fill-white" />
              Start Your Journey
            </a>
            <a
              href="/blog"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E74C7C]/35 bg-white px-7 py-3.5 text-sm font-bold text-[#A10E4D] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF1F5]"
            >
              See Success Stories
            </a>
          </div>
        </div>

        {/* tilted polaroid */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rotate-2 rounded-2xl bg-white p-4 pb-16 shadow-[0_30px_70px_rgba(161,14,77,0.16)] transition duration-300 hover:rotate-0">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={variantImages.story}
                alt="Vivah Australia success story"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </div>
            <p className="absolute bottom-5 left-0 right-0 text-center font-cormorant text-2xl font-semibold italic text-[#2f2f2f]">
              Neha &amp; Chirag — Melbourne, 2025 ♥
            </p>
          </div>
          {/* small second polaroid peeking behind */}
          <div className="absolute -left-6 -top-6 -z-10 hidden h-36 w-32 -rotate-6 rounded-xl bg-white p-2 shadow-[0_18px_44px_rgba(161,14,77,0.12)] lg:block">
            <div className="h-full w-full rounded-md bg-[#FFE9EF]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function toMatchCardProfile(item: Awaited<ReturnType<typeof loadHomepageData>>['featuredProfiles'][number]): ProfileMatchCardProfile {
  return {
    id: item._id ?? item.id ?? item.displayId,
    slug: item.slug,
    name: item.personal?.firstName,
    age: item.personal?.age,
    city: [item.location?.city, item.location?.state].filter(Boolean).join(', ') || 'Australia',
    community: item.religion?.religion,
    occupation: item.employment?.occupation,
    verificationLevel: item.verification?.level,
    isBoosted: item.isBoosted,
  };
}

function isVariantKey(value: string): value is VariantKey {
  return value === 'premium' || value === 'search' || value === 'story';
}
