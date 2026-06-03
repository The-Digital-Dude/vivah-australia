'use client';

import { useMemo } from 'react';
import {
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  PremiumButton,
  PremiumCard,
  ProfileMatchCard,
  PublicFooter,
  PublicHeader,
  SectionHeader,
  StaticPageHero,
} from '@/app/components';
import type { FeaturedProfile, PublicMatchPreviewResponse } from '@/lib/public-api';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatRelativeDate(value?: string) {
  if (!value) {
    return 'Recently active';
  }

  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function profileHref(profile: FeaturedProfile) {
  return `/profiles/${profile.slug || profile.id || profile._id || profile.displayId}`;
}

export default function PublicMatchesClient({
  preview,
  initialQuery,
}: Readonly<{
  preview: PublicMatchPreviewResponse;
  initialQuery: {
    gender?: string;
    city?: string;
    religion?: string;
    ageMin?: number;
    ageMax?: number;
    ageRange?: string;
    limit?: number;
  };
}>) {
  const activeFilters = useMemo(() => {
    const chips: string[] = [];

    if (initialQuery.gender) {
      chips.push(`Looking for ${initialQuery.gender === 'FEMALE' ? 'women' : 'men'}`);
    }
    if (initialQuery.ageRange) {
      chips.push(`Age ${initialQuery.ageRange.replace('-', ' - ')}`);
    }
    if (initialQuery.city) {
      chips.push(initialQuery.city);
    }
    if (initialQuery.religion && initialQuery.religion !== 'Any') {
      chips.push(initialQuery.religion);
    }

    return chips;
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F]">
      <PublicHeader />

      <StaticPageHero
        eyebrow="Match Preview"
        title="Explore a softer preview of serious Australian matrimonial matches"
        subtitle="Browse a limited set of verified profile previews before you create your free profile. Full compatibility, direct interests, and messaging stay protected for members."
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 rounded-[32px] border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.08)] sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                Search preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2F2F2F] sm:text-3xl">
                See who is active before you commit to signup
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7280]">
                This preview is intentionally limited. You can open restricted profile previews and
                browse a few strong matches, then unlock full details and direct actions once you
                join.
              </p>
            </div>

            <form action="/matches" className="grid gap-3 rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
                Looking for
                <select
                  name="gender"
                  defaultValue={initialQuery.gender ?? 'FEMALE'}
                  className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                >
                  <option value="FEMALE">A woman</option>
                  <option value="MALE">A man</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
                Age range
                <select
                  name="ageRange"
                  defaultValue={initialQuery.ageRange ?? '25-30'}
                  className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                >
                  <option value="25-30">25 - 30</option>
                  <option value="30-35">30 - 35</option>
                  <option value="35-40">35 - 40</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
                City
                <select
                  name="city"
                  defaultValue={initialQuery.city ?? 'Sydney'}
                  className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                >
                  <option value="Sydney">Sydney</option>
                  <option value="Melbourne">Melbourne</option>
                  <option value="Brisbane">Brisbane</option>
                  <option value="Perth">Perth</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
                Religion
                <select
                  name="religion"
                  defaultValue={initialQuery.religion ?? 'Any'}
                  className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                >
                  <option value="Any">Any</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                </select>
              </label>

              <PremiumButton type="submit" className="w-full sm:col-span-2">
                <Search className="size-4" />
                Refresh preview
              </PremiumButton>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-[#D4A04C]/30 bg-[#FFF8EC] px-3 py-1 text-xs font-semibold text-[#A10E4D]"
              >
                {chip}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-semibold text-[#A10E4D]">
              <Lock className="size-3.5" />
              Member actions stay protected
            </span>
          </div>
        </section>

        <section className="mt-8 grid gap-6">
          <SectionHeader
            eyebrow="Preview matches"
            title="A limited look at today’s active introductions"
            subtitle="You can browse a small set of profiles and open restricted previews. Full compatibility, direct interest sending, and messaging unlock after signup."
          />

          {preview.profiles.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {preview.profiles.map((profile) => (
                <ProfileMatchCard
                  key={profile.displayId}
                  profile={{
                    age: profile.personal?.age,
                    city: [profile.location?.city, profile.location?.state].filter(Boolean).join(', '),
                    id: profile.id || profile._id || profile.displayId,
                    isBoosted: profile.isBoosted,
                    matchScore: profile.isBoosted ? 94 : 88,
                    name: profile.personal?.firstName ?? 'Vivah member',
                    occupation: profile.employment?.occupation,
                    religion: profile.religion?.religion,
                    slug: profile.slug,
                    verificationLevel: profile.verification?.level,
                  }}
                  actions={
                    <div className="grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F7FBF8] px-2.5 py-1 text-xs font-semibold text-[#1F6F4A]">
                          <ShieldCheck className="size-3.5" />
                          {profile.verification?.level
                            ? `${profile.verification.level.replaceAll('_', ' ')} trust`
                            : 'Preview available'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8EC] px-2.5 py-1 text-xs font-semibold text-[#8B6714]">
                          <Sparkles className="size-3.5" />
                          {profile.stats?.lastActiveAt
                            ? `Active ${formatRelativeDate(profile.stats.lastActiveAt)}`
                            : 'Recently active'}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <PremiumButton href={profileHref(profile)} variant="secondary">
                          View preview
                        </PremiumButton>
                        <PremiumButton href="/register">
                          <UserPlus className="size-4" />
                          Create free profile
                        </PremiumButton>
                      </div>

                      <p className="text-xs font-medium text-[#6B7280]">
                        Sign in to see full compatibility, send interests, and unlock direct
                        messaging.
                      </p>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <PremiumCard className="rounded-[30px] border border-dashed border-[#D4A04C]/60 bg-white p-8 text-center">
              <Users className="mx-auto size-8 text-[#D4A04C]" />
              <h3 className="mt-4 text-xl font-semibold text-[#2F2F2F]">
                No preview matches for this combination
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6B7280]">
                Try a broader city or a wider age range. Once you join, member discovery gives you
                deeper search controls and more results.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <PremiumButton href="/matches" variant="secondary">
                  Reset preview
                </PremiumButton>
                <PremiumButton href="/register">Create free profile</PremiumButton>
              </div>
            </PremiumCard>
          )}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: 'Browse first',
              body: 'See a softer preview of active members before you commit to signup.',
              icon: Search,
            },
            {
              title: 'Trust stays visible',
              body: 'Verification and activity cues remain visible so the preview still feels meaningful.',
              icon: ShieldCheck,
            },
            {
              title: 'Unlock the full flow',
              body: 'Create your free profile to open full match details, send interests, and message accepted matches.',
              icon: LogIn,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <PremiumCard key={item.title} className="rounded-[28px] p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#A10E4D]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#2F2F2F]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6B7280]">{item.body}</p>
              </PremiumCard>
            );
          })}
        </section>

        <section className="mt-10 overflow-hidden rounded-[32px] border border-[#A10E4D]/10 bg-[linear-gradient(145deg,#A10E4D_0%,#890B40_48%,#D4A04C_100%)] p-6 text-white shadow-[0_24px_70px_rgba(122,31,43,0.18)] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                Ready to go deeper?
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                Create your free profile to unlock full discovery and direct introductions
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Your preview is intentionally capped. Joining unlocks richer search, full
                compatibility context, interests, messaging, and privacy-controlled photo access.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PremiumButton href="/register" variant="gold" className="min-w-[210px]">
                Create free profile
              </PremiumButton>
              <PremiumButton
                href="/login?next=/member/matches"
                variant="secondary"
                className={cx(
                  'min-w-[210px] border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white',
                )}
              >
                Log in to continue
              </PremiumButton>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
