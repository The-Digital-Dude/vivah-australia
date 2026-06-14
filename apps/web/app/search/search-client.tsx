'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Filter,
  Heart,
  Loader2,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const RELIGIONS = [
  'Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Parsi', 'Jewish',
];
const CITIES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra',
];

interface PublicProfile {
  _id: string;
  displayId: string;
  slug?: string;
  personal?: { firstName?: string; age?: number; gender?: string };
  location?: { city?: string; state?: string };
  religion?: { religion?: string };
  employment?: { occupation?: string };
  verification?: { level?: string };
  stats?: { lastActiveAt?: string };
  isBoosted?: boolean;
}

interface Filters {
  gender: string;
  ageMin: string;
  ageMax: string;
  religion: string;
  city: string;
}

const defaultFilters: Filters = {
  gender: '',
  ageMin: '',
  ageMax: '',
  religion: '',
  city: '',
};

function ProfileCard({ profile }: { profile: PublicProfile }) {
  const name = profile.personal?.firstName ?? 'Member';
  const age = profile.personal?.age;
  const city = profile.location?.city;
  const state = profile.location?.state;
  const religion = profile.religion?.religion;
  const occupation = profile.employment?.occupation;
  const level = profile.verification?.level;
  const href = profile.slug ? `/profiles/${profile.slug}` : `/profiles/${profile.displayId}`;
  const isVerified = level && level !== 'UNVERIFIED' && level !== 'NONE';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-brand-maroon/25 transition-all duration-200 overflow-hidden">
      {profile.isBoosted && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
          <Sparkles className="h-2.5 w-2.5" />
          Featured
        </div>
      )}

      <div className="p-5">
        {/* Avatar */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-maroon/10 text-2xl font-black text-brand-maroon">
          {initial}
        </div>

        {/* Name + verification */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-base font-bold text-brand-charcoal">{name}</span>
            {isVerified && <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
          </div>

          {age && (
            <p className="text-sm font-medium text-gray-500">{age} years old</p>
          )}

          {(city ?? state) && (
            <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              {[city, state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {religion && (
            <span className="rounded-full bg-brand-maroon/8 px-2.5 py-0.5 text-[11px] font-semibold text-brand-maroon">
              {religion}
            </span>
          )}
          {occupation && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
              {occupation}
            </span>
          )}
        </div>

        {/* Gated CTA */}
        <div className="mt-4 rounded-xl bg-brand-ivory border border-brand-maroon/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-maroon">
            <Lock className="h-3.5 w-3.5" />
            Sign in to view full profile
          </div>
        </div>

        <Link
          href={href}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-maroon/90 transition"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-maroon/10 px-3 py-1 text-xs font-semibold text-brand-maroon">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-brand-maroon/70 transition">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const initialFilters: Filters = {
    gender: searchParams.get('gender') ?? '',
    ageMin: searchParams.get('ageMin') ?? '',
    ageMax: searchParams.get('ageMax') ?? '',
    religion: searchParams.get('religion') ?? '',
    city: searchParams.get('city') ?? '',
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [pending, setPending] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProfiles = useCallback(async (f: Filters) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '12' });
    if (f.gender) params.set('gender', f.gender);
    if (f.ageMin) params.set('ageMin', f.ageMin);
    if (f.ageMax) params.set('ageMax', f.ageMax);
    if (f.religion) params.set('religion', f.religion);
    if (f.city) params.set('city', f.city);

    try {
      const res = await fetch(`${apiBase}/api/public/matches?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { profiles?: PublicProfile[] };
        setProfiles(data.profiles ?? []);
      }
    } catch {
      // network error — leave previous results
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfiles(initialFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfiles]);

  function applyFilters() {
    setFilters(pending);
    void fetchProfiles(pending);
    setShowFilters(false);
  }

  function clearFilters() {
    setPending(defaultFilters);
    setFilters(defaultFilters);
    void fetchProfiles(defaultFilters);
  }

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== '');
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" />
            Verified profiles only
          </div>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">
            Browse Matrimonial Profiles
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            Thousands of verified Indian Australians looking for a meaningful connection.
            Filter by religion, city, age and more.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 pb-20">

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => { setPending(filters); setShowFilters(true); }}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-maroon/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand-charcoal shadow-sm hover:border-brand-maroon/40 transition"
          >
            <Filter className="h-4 w-4 text-brand-maroon" />
            Filters
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-maroon text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>

          {hasFilters && (
            <>
              {filters.gender && (
                <FilterTag
                  label={filters.gender === 'MALE' ? 'Men' : 'Women'}
                  onRemove={() => { const f = { ...filters, gender: '' }; setFilters(f); setPending(f); void fetchProfiles(f); }}
                />
              )}
              {(filters.ageMin || filters.ageMax) && (
                <FilterTag
                  label={`Age ${filters.ageMin || '18'}–${filters.ageMax || '60'}`}
                  onRemove={() => { const f = { ...filters, ageMin: '', ageMax: '' }; setFilters(f); setPending(f); void fetchProfiles(f); }}
                />
              )}
              {filters.religion && (
                <FilterTag
                  label={filters.religion}
                  onRemove={() => { const f = { ...filters, religion: '' }; setFilters(f); setPending(f); void fetchProfiles(f); }}
                />
              )}
              {filters.city && (
                <FilterTag
                  label={filters.city}
                  onRemove={() => { const f = { ...filters, city: '' }; setFilters(f); setPending(f); void fetchProfiles(f); }}
                />
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-brand-maroon" />
            <p className="text-sm text-gray-400 font-medium">Finding profiles…</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Search className="h-12 w-12 text-brand-maroon/30" />
            <h2 className="text-lg font-bold text-brand-charcoal">No profiles found</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Try adjusting your filters to see more results.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm font-semibold text-brand-maroon hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-500 font-medium">
              Showing {profiles.length} profiles
              {hasFilters ? ' matching your filters' : ''}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((profile) => (
                <ProfileCard key={profile._id ?? profile.displayId} profile={profile} />
              ))}
            </div>
          </>
        )}

        {/* Join CTA */}
        <section className="mt-16 rounded-3xl bg-brand-maroon p-8 sm:p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.2),transparent_55%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 mb-4">
              <Heart className="h-3.5 w-3.5 text-brand-gold" />
              Join 10,000+ members
            </div>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-white">
              Ready to find your match?
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Create a free verified profile today and connect with compatible matches across Australia.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <PremiumButton href="/register" size="lg">
                Create Free Profile
              </PremiumButton>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-brand-charcoal">Filter profiles</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Gender */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Looking for
                </legend>
                <div className="flex gap-2">
                  {[
                    { value: '', label: 'All' },
                    { value: 'FEMALE', label: 'Women' },
                    { value: 'MALE', label: 'Men' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPending((p) => ({ ...p, gender: value }))}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        pending.gender === value
                          ? 'border-brand-maroon bg-brand-maroon text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-maroon/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Age range */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Age range
                </legend>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={18}
                    max={80}
                    placeholder="18"
                    value={pending.ageMin}
                    onChange={(e) => setPending((p) => ({ ...p, ageMin: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-brand-charcoal outline-none focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10"
                  />
                  <span className="text-sm text-gray-400 font-medium flex-shrink-0">to</span>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    placeholder="60"
                    value={pending.ageMax}
                    onChange={(e) => setPending((p) => ({ ...p, ageMax: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-brand-charcoal outline-none focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/10"
                  />
                </div>
              </fieldset>

              {/* Religion */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Religion
                </legend>
                <div className="flex flex-wrap gap-2">
                  {RELIGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPending((p) => ({ ...p, religion: p.religion === r ? '' : r }))}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        pending.religion === r
                          ? 'border-brand-maroon bg-brand-maroon text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-maroon/40'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* City */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  City
                </legend>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPending((p) => ({ ...p, city: p.city === c ? '' : c }))}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        pending.city === c
                          ? 'border-brand-maroon bg-brand-maroon text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-maroon/40'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Drawer footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => { setPending(defaultFilters); }}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 rounded-xl bg-brand-maroon py-3 text-sm font-semibold text-white hover:bg-brand-maroon/90 transition"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
