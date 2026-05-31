'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Heart, Search, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { profileSearchQuerySchema } from '@vivah/shared';
import { csvList, optionalNumber, optionalString, useMemberRequest } from '@/lib/member-api';

interface MatchCard {
  id: string;
  firstName?: string;
  age?: number;
  heightCm?: number;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  education?: string;
  religion?: string;
  community?: string;
  motherTongue?: string;
  maritalStatus?: string;
  verificationLevel: string;
  photoUrl?: string;
  matchScore: number;
  matchReasons: string[];
}

interface MatchResponse {
  results: MatchCard[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  limits: {
    planCode: string;
    searchPageSize: number;
    recommendationLimit: number;
    advancedFilters: boolean;
  };
}

const defaultFilters = {
  page: 1,
  pageSize: 12,
  sort: 'RECOMMENDED',
};

export default function MatchDiscovery() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<MatchResponse | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);

  const activeChips = useMemo(() => {
    if (!search?.pagination) {
      return [];
    }

    return [
      `${search.pagination.total} approved profiles`,
      `${search.limits.planCode} search`,
      `Page size ${search.pagination.pageSize}`,
      search.limits.advancedFilters ? 'Advanced filters enabled' : 'Basic filters only',
    ];
  }, [search]);

  async function loadRecommended() {
    const result = await memberRequest('/api/matches/recommended?limit=12');

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const data = result.data as MatchResponse;
    setRecommended(data.results);
  }

  async function runSearch(query = defaultFilters) {
    setLoading(true);
    setMessage(null);
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, String(item)));
      } else if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });

    const result = await memberRequest(`/api/matches/search?${params.toString()}`);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setSearch(result.data as MatchResponse);
  }

  useEffect(() => {
    void runSearch();
    void loadRecommended();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      page: 1,
      pageSize: optionalNumber(form.get('pageSize')) ?? 12,
      sort: optionalString(form.get('sort')) ?? 'RECOMMENDED',
      gender: optionalString(form.get('gender')),
      ageMin: optionalNumber(form.get('ageMin')),
      ageMax: optionalNumber(form.get('ageMax')),
      religion: csvList(form.get('religion')),
      community: csvList(form.get('community')),
      motherTongue: csvList(form.get('motherTongue')),
      country: csvList(form.get('country')),
      state: csvList(form.get('state')),
      city: csvList(form.get('city')),
      education: csvList(form.get('education')),
      occupation: csvList(form.get('occupation')),
      maritalStatus: csvList(form.get('maritalStatus')),
      heightMinCm: optionalNumber(form.get('heightMinCm')),
      heightMaxCm: optionalNumber(form.get('heightMaxCm')),
      incomeMin: optionalNumber(form.get('incomeMin')),
      verificationLevel: optionalString(form.get('verificationLevel')),
      recentlyActive: form.get('recentlyActive') === 'on' ? true : undefined,
    };
    const parsed = profileSearchQuerySchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Please check your filters.');
      return;
    }

    await runSearch(parsed.data);
  }

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-lg border border-[#F0D6DA] bg-[#FFF8F1]">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.05fr_1.6fr] lg:p-6">
          <form
            onSubmit={(event) => void submit(event)}
            className="grid content-start gap-4 rounded-lg border border-white bg-white/80 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
                  Discovery
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#232323]">Search filters</h2>
              </div>
              <SlidersHorizontal className="size-5 text-[#C94F7C]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Looking for" name="gender" options={['FEMALE', 'MALE']} />
              <Select
                label="Sort"
                name="sort"
                options={['RECOMMENDED', 'NEWEST', 'RECENTLY_ACTIVE', 'VERIFIED']}
                defaultValue="RECOMMENDED"
              />
              <Field label="Age min" name="ageMin" type="number" placeholder="25" />
              <Field label="Age max" name="ageMax" type="number" placeholder="36" />
              <Field label="City" name="city" placeholder="Melbourne, Sydney" />
              <Field label="State" name="state" placeholder="VIC, NSW" />
              <Field label="Religion" name="religion" placeholder="Hindu" />
              <Field label="Community" name="community" placeholder="Indian" />
              <Field label="Mother tongue" name="motherTongue" placeholder="Hindi" />
              <Field label="Occupation" name="occupation" placeholder="Engineer" />
            </div>

            <details className="rounded-md border border-[#F0D6DA] bg-[#FFF8F1] p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[#7A1E3A]">
                Advanced filters
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Height min" name="heightMinCm" type="number" placeholder="155" />
                <Field label="Height max" name="heightMaxCm" type="number" placeholder="185" />
                <Field label="Income min" name="incomeMin" type="number" placeholder="90000" />
                <Select
                  label="Verification"
                  name="verificationLevel"
                  options={['BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'FULLY_VERIFIED']}
                />
                <label className="flex items-center gap-2 text-sm font-medium text-[#232323]">
                  <input
                    name="recentlyActive"
                    type="checkbox"
                    className="size-4 accent-[#7A1E3A]"
                  />
                  Recently active
                </label>
              </div>
            </details>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Results per page" name="pageSize" type="number" defaultValue="12" />
              <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#7A1E3A] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#65172F]">
                <Search className="size-4" />
                Search
              </button>
            </div>
          </form>

          <div className="grid content-start gap-5">
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#F0D6DA] bg-white px-3 py-1 text-xs font-semibold text-[#5E6470]"
                >
                  {chip}
                </span>
              ))}
            </div>

            {message ? (
              <p className="rounded-md border border-[#F59E0B]/30 bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">
                {message}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
                : search?.results.map((profile, index) => (
                    <ProfileCard key={profile.id} profile={profile} index={index} />
                  ))}
            </div>

            {!loading && search?.results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#D6A84F] bg-white p-6 text-center">
                <Sparkles className="mx-auto size-6 text-[#D6A84F]" />
                <h3 className="mt-3 text-lg font-semibold text-[#232323]">No matches found</h3>
                <p className="mt-2 text-sm text-[#5E6470]">
                  Try broadening age, city, or community filters.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
              Recommended
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#232323]">Rule-based matches</h2>
          </div>
          <Heart className="size-5 text-[#C94F7C]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommended.map((profile, index) => (
            <ProfileCard key={profile.id} profile={profile} index={index} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileCard({
  profile,
  index,
  compact = false,
}: Readonly<{ profile: MatchCard; index: number; compact?: boolean }>) {
  const initials = profile.firstName?.slice(0, 1).toUpperCase() ?? 'V';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      className="overflow-hidden rounded-lg border border-[#F0D6DA] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="grid grid-cols-[96px_1fr] gap-4 p-4">
        <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-md bg-[#FDECEF] text-3xl font-semibold text-[#7A1E3A]">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl}
              alt={`${profile.firstName ?? 'Member'} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#232323]">
                {profile.firstName ?? 'Vivah member'}, {profile.age ?? 'Age hidden'}
              </h3>
              <p className="mt-1 text-sm text-[#5E6470]">
                {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
              </p>
            </div>
            <span className="rounded-full bg-[#FDECEF] px-2.5 py-1 text-xs font-bold text-[#7A1E3A]">
              {profile.matchScore}%
            </span>
          </div>

          <div className="mt-3 grid gap-1 text-sm text-[#5E6470]">
            <p>{[profile.occupation, profile.education].filter(Boolean).join(' • ')}</p>
            <p>
              {[profile.religion, profile.community, profile.motherTongue]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8F1] px-2.5 py-1 text-xs font-semibold text-[#5E6470]">
              <BadgeCheck className="size-3.5 text-[#1F9D68]" />
              {profile.verificationLevel.replaceAll('_', ' ')}
            </span>
            {profile.maritalStatus ? (
              <span className="rounded-full bg-[#FFF8F1] px-2.5 py-1 text-xs font-semibold text-[#5E6470]">
                {profile.maritalStatus.replaceAll('_', ' ')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="border-t border-[#F0D6DA] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {profile.matchReasons.slice(0, 3).map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center gap-1 rounded-full bg-[#F7FBF8] px-2.5 py-1 text-xs font-medium text-[#1F6F4A]"
              >
                <ShieldCheck className="size-3.5" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-4 rounded-lg border border-[#F0D6DA] bg-white p-4">
      <div className="aspect-[3/4] animate-pulse rounded-md bg-[#FDECEF]" />
      <div className="grid content-start gap-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-[#FDECEF]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#FDECEF]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[#FDECEF]" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-[#FDECEF]" />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
}: Readonly<{
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#232323]">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 rounded-md border border-[#E8D5D8] bg-white px-3 text-sm outline-none transition focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: Readonly<{ label: string; name: string; options: string[]; defaultValue?: string }>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#232323]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="h-10 rounded-md border border-[#E8D5D8] bg-white px-3 text-sm outline-none transition focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}
