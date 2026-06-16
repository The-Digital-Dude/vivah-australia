'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Bookmark,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { profileSearchQuerySchema, savedSearchCreateSchema } from '@vivah/shared';
import {
  EmptyState,
  FilterDrawer,
  MatchGridSkeleton,
  PremiumButton,
  PremiumCard,
  ProfileMatchCard,
} from '@/app/components';
import { csvList, optionalNumber, optionalString, useMemberRequest } from '@/lib/member-api';
import ProfileActions from '../profile-actions';

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
  lastActiveAt?: string;
  isBoosted?: boolean;
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

interface SavedSearch {
  _id?: string;
  id?: string;
  name: string;
  query: Record<string, unknown>;
  notifyOnNewMatches: boolean;
  updatedAt: string;
}

interface ProfileLocation {
  city?: string;
  state?: string;
}

type DiscoveryTab = 'recommended' | 'active' | 'verified' | 'newest' | 'nearby' | 'search' | 'saved';

const defaultFilters = {
  page: 1,
  pageSize: 12,
  sort: 'RECOMMENDED',
};

const quickFilterDefinitions = [
  {
    key: 'recentlyActive',
    label: 'Recently active',
    apply: () => ({ recentlyActive: true, sort: 'RECENTLY_ACTIVE' }),
  },
  {
    key: 'verifiedOnly',
    label: 'Verified only',
    apply: () => ({ verifiedOnly: true, sort: 'VERIFIED' }),
  },
  {
    key: 'maritalStatus',
    label: 'Never married',
    apply: () => ({ maritalStatus: ['NEVER_MARRIED'] }),
  },
  {
    key: 'motherTongue',
    label: 'Hindi speaking',
    apply: () => ({ motherTongue: ['Hindi'] }),
  },
  {
    key: 'visaStatus',
    label: 'Citizen / PR',
    apply: () => ({ visaStatus: ['Australian Citizen', 'Permanent Resident'] }),
  },
] as const;

const visaStatusSuggestions = [
  'Australian Citizen',
  'Permanent Resident',
  'Student Visa',
  'Temporary Skilled Visa',
  'Partner Visa',
  'Work Visa',
  'Graduate Visa',
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isDefaultQuery(query: Record<string, unknown>) {
  const entries = Object.entries(query).filter(([, value]) => {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  });

  return entries.every(([key, value]) => {
    const defaultValue = defaultFilters[key as keyof typeof defaultFilters];
    if (defaultValue === undefined) {
      return false;
    }
    return value === defaultValue;
  });
}

function countActiveFilters(query: Record<string, unknown>) {
  return Object.entries(query).filter(([key, value]) => {
    if (key === 'page' || key === 'pageSize' || key === 'sort') {
      return false;
    }
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  }).length;
}

function queryToParams(query: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params.set(key, String(value));
    }
  });

  return params;
}

function formatRelativeDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

function normalizeQuickFilterLabel(key: string, value: unknown) {
  if (key === 'verificationLevel' && typeof value === 'string') {
    return `Verification: ${value}`;
  }
  if (key === 'verifiedOnly' && value === true) {
    return 'Verified members';
  }
  if (key === 'maritalStatus' && Array.isArray(value)) {
    return `Status: ${value.join(', ').replaceAll('_', ' ')}`;
  }
  if (key === 'motherTongue' && Array.isArray(value)) {
    return `Language: ${value.join(', ')}`;
  }
  if (key === 'city' && Array.isArray(value)) {
    return `Local: ${value.join(', ')}`;
  }
  if (key === 'visaStatus' && Array.isArray(value)) {
    return `Visa: ${value.join(', ')}`;
  }
  if (key === 'recentlyActive' && value === true) {
    return 'Recently active';
  }

  return `${key}: ${String(value)}`;
}

export default function MatchDiscovery() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<MatchResponse | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [currentQuery, setCurrentQuery] = useState<Record<string, unknown>>(defaultFilters);
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('recommended');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileLocation, setProfileLocation] = useState<ProfileLocation | null>(null);
  const [quickCity, setQuickCity] = useState('');
  const [quickSort, setQuickSort] = useState('RECOMMENDED');

  const activeFilterCount = useMemo(() => countActiveFilters(currentQuery), [currentQuery]);

  const visibleQueryChips = useMemo(() => {
    return Object.entries(currentQuery)
      .filter(([key, value]) => {
        if (key === 'page' || key === 'pageSize' || key === 'sort') {
          return false;
        }
        if (value === undefined || value === null || value === '') {
          return false;
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return true;
      })
      .map(([key, value]) => ({ key, label: normalizeQuickFilterLabel(key, value) }));
  }, [currentQuery]);

  async function loadRecommended() {
    setLoading(true);
    setMessage(null);
    const result = await memberRequest('/api/matches/recommended?limit=24');
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const data = result.data as MatchResponse;
    setRecommended(data.results);
  }

  async function loadSavedSearches() {
    setLoading(true);
    setMessage(null);
    const result = await memberRequest('/api/matches/saved-searches');
    setLoading(false);
    if (result.ok) {
      setSavedSearches((result.data as { savedSearches?: SavedSearch[] }).savedSearches ?? []);
    }
  }

  async function runSearch(query: Record<string, unknown> = defaultFilters) {
    setLoading(true);
    setMessage(null);
    setCurrentQuery(query);
    setQuickCity(Array.isArray(query.city) ? String(query.city[0] ?? '') : '');
    setQuickSort(typeof query.sort === 'string' ? query.sort : 'RECOMMENDED');

    const result = await memberRequest(`/api/matches/search?${queryToParams(query).toString()}`);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setSearch(result.data as MatchResponse);
  }

  async function loadProfileLocation() {
    const result = await memberRequest('/api/me/profile');
    if (result.ok && result.data) {
      const profile = result.data as { profile?: { location?: ProfileLocation } };
      setProfileLocation(profile.profile?.location ?? null);
    }
  }

  useEffect(() => {
    void loadRecommended();
    void loadSavedSearches();
    void loadProfileLocation();
    void runSearch(defaultFilters);
  }, []);

  async function saveSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: optionalString(form.get('name')) ?? 'Saved search',
      query: currentQuery,
      notifyOnNewMatches: form.get('notifyOnNewMatches') === 'on',
    };
    const parsed = savedSearchCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Please name this search.');
      return;
    }
    const result = await memberRequest('/api/matches/saved-searches', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.message);
    if (result.ok) {
      await loadSavedSearches();
    }
  }

  async function deleteSavedSearch(searchId: string) {
    const result = await memberRequest(`/api/matches/saved-searches/${searchId}`, {
      method: 'DELETE',
    });
    setMessage(result.ok ? 'Saved search removed.' : result.message);
    if (result.ok) {
      await loadSavedSearches();
    }
  }

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
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
      visaStatus: csvList(form.get('visaStatus')),
      heightMinCm: optionalNumber(form.get('heightMinCm')),
      heightMaxCm: optionalNumber(form.get('heightMaxCm')),
      incomeMin: optionalNumber(form.get('incomeMin')),
      verificationLevel: optionalString(form.get('verificationLevel')),
      verifiedOnly: form.get('verifiedOnly') === 'on' ? true : undefined,
      recentlyActive: form.get('recentlyActive') === 'on' ? true : undefined,
    };
    const parsed = profileSearchQuerySchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Please check your filters.');
      return;
    }

    setActiveTab('search');
    setDrawerOpen(false);
    await runSearch(parsed.data);
  }

  async function applyPreset(tab: DiscoveryTab) {
    setActiveTab(tab);

    if (tab === 'recommended') {
      await loadRecommended();
      return;
    }

    if (tab === 'active') {
      await runSearch({ page: 1, pageSize: 12, sort: 'RECENTLY_ACTIVE', recentlyActive: true });
      return;
    }

    if (tab === 'verified') {
      await runSearch({ page: 1, pageSize: 12, sort: 'VERIFIED', verifiedOnly: true });
      return;
    }

    if (tab === 'newest') {
      await runSearch({ page: 1, pageSize: 12, sort: 'NEWEST' });
      return;
    }

    if (tab === 'nearby') {
      const city = profileLocation?.city;
      const state = profileLocation?.state;
      await runSearch({
        page: 1,
        pageSize: 12,
        sort: 'RECOMMENDED',
        ...(city ? { city: [city] } : {}),
        ...(state ? { state: [state] } : {}),
      });
      return;
    }

    if (tab === 'saved') {
      await loadSavedSearches();
    }
  }

  async function applyQuickFilter(queryPatch: Record<string, unknown>) {
    setActiveTab('search');
    await runSearch({
      ...defaultFilters,
      ...queryPatch,
    });
  }

  async function clearFilters() {
    setActiveTab('search');
    await runSearch(defaultFilters);
  }

  function renderFilterForm() {
    const advancedUnlocked = search?.limits?.advancedFilters ?? false;
    const queryValue = (key: string) =>
      typeof currentQuery[key] === 'string' ? String(currentQuery[key]) : undefined;
    const queryCsv = (key: string) =>
      Array.isArray(currentQuery[key]) ? (currentQuery[key] as string[]).join(', ') : undefined;
    const queryNumber = (key: string) =>
      typeof currentQuery[key] === 'number' ? String(currentQuery[key]) : undefined;
    const queryBoolean = (key: string) => currentQuery[key] === true;

    return (
      <form onSubmit={(event) => void handleFilterSubmit(event)} className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Advanced filters
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2F2F2F]">Refine your discovery</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Focus your search by age, location, community, education, profession, and trust
              signals.
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-[#A10E4D] px-2.5 py-1 text-xs font-bold text-white">
              {activeFilterCount} active
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Looking for"
            name="gender"
            options={['FEMALE', 'MALE']}
            defaultValue={queryValue('gender')}
          />
          <Select
            label="Sort results"
            name="sort"
            options={['RECOMMENDED', 'NEWEST', 'RECENTLY_ACTIVE', 'VERIFIED']}
            defaultValue={typeof currentQuery.sort === 'string' ? currentQuery.sort : 'RECOMMENDED'}
          />
          <Field
            label="Age min"
            name="ageMin"
            type="number"
            placeholder="25"
            defaultValue={queryNumber('ageMin')}
          />
          <Field
            label="Age max"
            name="ageMax"
            type="number"
            placeholder="36"
            defaultValue={queryNumber('ageMax')}
          />
          <Field
            label="City"
            name="city"
            placeholder="Melbourne, Sydney"
            defaultValue={queryCsv('city')}
          />
          <Field
            label="State"
            name="state"
            placeholder="VIC, NSW"
            defaultValue={queryCsv('state')}
          />
          <Field
            label="Religion"
            name="religion"
            placeholder="Hindu"
            defaultValue={queryCsv('religion')}
          />
          <Field
            label="Community"
            name="community"
            placeholder="Punjabi, Tamil"
            defaultValue={queryCsv('community')}
          />
          <Field
            label="Mother tongue"
            name="motherTongue"
            placeholder="Hindi, Gujarati"
            defaultValue={queryCsv('motherTongue')}
          />
          <Field
            label="Occupation"
            name="occupation"
            placeholder="Engineer, Doctor"
            defaultValue={queryCsv('occupation')}
          />
        </div>

        <details className="rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
            More filters
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Education"
              name="education"
              placeholder="Masters, MBA"
              defaultValue={queryCsv('education')}
            />
            <Field
              label="Marital status"
              name="maritalStatus"
              placeholder="NEVER_MARRIED"
              defaultValue={queryCsv('maritalStatus')}
            />
            <div className="relative">
              {!advancedUnlocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
                  <Link
                    href="/member/subscription"
                    className="flex items-center gap-2 rounded-full bg-[#A10E4D] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#8B0C42]"
                  >
                    <ShieldCheck className="size-4" />
                    Unlock Advanced Filters
                  </Link>
                </div>
              )}
              <div className={!advancedUnlocked ? 'pointer-events-none opacity-40' : ''}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Visa status"
                    name="visaStatus"
                    placeholder="Permanent Resident, Student Visa"
                    defaultValue={queryCsv('visaStatus')}
                  />
                  <Field
                    label="Height min"
                    name="heightMinCm"
                    type="number"
                    placeholder="155"
                    defaultValue={queryNumber('heightMinCm')}
                  />
                  <Field
                    label="Height max"
                    name="heightMaxCm"
                    type="number"
                    placeholder="185"
                    defaultValue={queryNumber('heightMaxCm')}
                  />
                  <Field
                    label="Income min"
                    name="incomeMin"
                    type="number"
                    placeholder="90000"
                    defaultValue={queryNumber('incomeMin')}
                  />
                  <Select
                    label="Verification level"
                    name="verificationLevel"
                    options={['BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'FULLY_VERIFIED']}
                    defaultValue={queryValue('verificationLevel')}
                  />
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-[#2F2F2F]">
                    <input
                      name="verifiedOnly"
                      type="checkbox"
                      defaultChecked={queryBoolean('verifiedOnly')}
                      className="size-4 rounded accent-[#A10E4D]"
                    />
                    Verified members only
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-[#2F2F2F]">
                    <input
                      name="recentlyActive"
                      type="checkbox"
                      defaultChecked={queryBoolean('recentlyActive')}
                      className="size-4 rounded accent-[#A10E4D]"
                    />
                    Recently active only
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {visaStatusSuggestions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        void applyQuickFilter({ ...currentQuery, page: 1, visaStatus: [value] })
                      }
                      className="rounded-full border border-[#D4A04C]/30 bg-white px-3 py-1 text-xs font-semibold text-[#A10E4D] transition hover:bg-[#FFF8EC]"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Results per page" name="pageSize" type="number" defaultValue="12" />
          <PremiumButton
            type="button"
            variant="secondary"
            onClick={() => {
              void clearFilters();
              setDrawerOpen(false);
            }}
            className="w-full self-end"
          >
            Clear all
          </PremiumButton>
          <PremiumButton type="submit" className="w-full self-end">
            <Search className="size-4" />
            Apply filters
          </PremiumButton>
        </div>
      </form>
    );
  }

  function renderSearchResultsGrid() {
    if (loading) {
      return <MatchGridSkeleton />;
    }

    if (!search || search.results.length === 0) {
      return (
        <PremiumCard className="rounded-[30px] border border-dashed border-[#D4A04C]/60 bg-white p-8 text-center">
          <Search className="mx-auto size-8 text-[#D4A04C]" />
          <h3 className="mt-4 text-xl font-semibold text-[#2F2F2F]">
            No matches for this combination yet
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6B7280]">
            Try widening your city, age, community, or visa preferences. In most cases, removing
            just one or two strict filters is enough to surface stronger results.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <PremiumButton onClick={() => void clearFilters()} variant="secondary">
              Clear all filters
            </PremiumButton>
            <PremiumButton
              onClick={() => void applyQuickFilter({ ...defaultFilters, sort: 'RECENTLY_ACTIVE' })}
            >
              Show recently active
            </PremiumButton>
          </div>
          {activeFilterCount > 0 ? (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#A10E4D]/70">
              {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'} may be
              narrowing your results
            </p>
          ) : null}
        </PremiumCard>
      );
    }

    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {search.results.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onProfileHidden={() => {
              void refreshCurrentView();
            }}
          />
        ))}
      </div>
    );
  }

  async function refreshCurrentView() {
    if (activeTab === 'recommended') {
      await loadRecommended();
      return;
    }

    if (activeTab === 'saved') {
      await loadSavedSearches();
      return;
    }

    await runSearch(currentQuery);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-[#A10E4D]/10 bg-white p-4">
        <div className="grid gap-3">
          {/* Quick search row */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={quickCity}
              onChange={(event) => setQuickCity(event.target.value)}
              placeholder="City or suburb…"
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-[#FFF9F5] px-4 text-sm outline-none focus:border-[#A10E4D]"
            />
            <select
              value={quickSort}
              onChange={(event) => setQuickSort(event.target.value)}
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-[#FFF9F5] px-4 text-sm outline-none focus:border-[#A10E4D]"
            >
              {['RECOMMENDED', 'NEWEST', 'RECENTLY_ACTIVE', 'VERIFIED'].map((option) => (
                <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <PremiumButton
                onClick={() => void applyQuickFilter({ ...defaultFilters, sort: quickSort, ...(quickCity.trim() ? { city: [quickCity.trim()] } : {}) })}
                className="h-10 px-4 text-sm"
              >
                <Search className="size-4" />
                Search
              </PremiumButton>
              <PremiumButton onClick={() => setDrawerOpen(true)} variant="secondary" className="h-10 px-3">
                <SlidersHorizontal className="size-4" />
                {activeFilterCount > 0 && <span className="rounded-full bg-[#A10E4D] px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
              </PremiumButton>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickFilterDefinitions.map((filter) => (
              <button key={filter.label} type="button" onClick={() => void applyQuickFilter({ ...defaultFilters, ...filter.apply() })}
                className="shrink-0 rounded-xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-3 py-1.5 text-xs font-semibold text-[#A10E4D] transition hover:bg-[#FFF0F3]">
                {filter.label}
              </button>
            ))}
            <button type="button" onClick={() => void applyPreset('nearby')}
              className="shrink-0 rounded-xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-3 py-1.5 text-xs font-semibold text-[#A10E4D] transition hover:bg-[#FFF0F3]">
              Local to you
            </button>
            {!isDefaultQuery(currentQuery) && (
              <button type="button" onClick={() => void clearFilters()}
                className="shrink-0 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                Clear
              </button>
            )}
          </div>

          {visibleQueryChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleQueryChips.map((chip) => (
                <span key={`${chip.key}-${chip.label}`} className="inline-flex items-center rounded-lg border border-[#D4A04C]/30 bg-[#FFF8EC] px-2.5 py-1 text-xs font-semibold text-[#A10E4D]">
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {[
          { key: 'recommended', label: 'Recommended', icon: Sparkles },
          { key: 'active', label: 'Active', icon: Clock3 },
          { key: 'verified', label: 'Verified', icon: ShieldCheck },
          { key: 'newest', label: 'New', icon: UserPlus },
          { key: 'nearby', label: 'Local to you', icon: MapPin },
          { key: 'saved', label: 'Saved', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => void applyPreset(tab.key as DiscoveryTab)}
              className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
                isActive ? 'bg-[#A10E4D] text-white' : 'text-[#6B7280] hover:bg-[#FFF0F3] hover:text-[#A10E4D]')}>
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF0F3] p-4 text-sm text-[#A10E4D]">
          {message}
        </p>
      ) : null}

      {(activeTab === 'search' || activeTab === 'active' || activeTab === 'verified' || activeTab === 'newest' || activeTab === 'nearby') && (
        <section>
          {renderSearchResultsGrid()}
        </section>
      )}

      {activeTab === 'recommended' && (
        <section>

          {loading ? (
            <MatchGridSkeleton />
          ) : recommended.length === 0 ? (
            <EmptyState title="No recommendations available">
              Update your partner preferences in your profile to unlock stronger recommendations.
            </EmptyState>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommended.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onProfileHidden={() => {
                    void refreshCurrentView();
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'saved' && (
        <section className="grid gap-4">

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="h-fit">
              <PremiumCard className="space-y-4 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#A10E4D]">
                  Save current query
                </h3>
                <form className="grid gap-3" onSubmit={(event) => void saveSearch(event)}>
                  <input
                    name="name"
                    placeholder="Name this search"
                    className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/40 px-4 text-sm outline-none transition focus:bg-white focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#2F2F2F]">
                    <input
                      name="notifyOnNewMatches"
                      type="checkbox"
                      className="size-4 rounded accent-[#A10E4D]"
                    />
                    Email notifications
                  </label>
                  <PremiumButton type="submit" variant="secondary" className="w-full">
                    Save search
                  </PremiumButton>
                </form>
              </PremiumCard>
            </aside>

            <div className="space-y-4">
              {savedSearches.length === 0 ? (
                <EmptyState title="No saved searches yet">
                  Your saved discovery setups will appear here once you save them.
                </EmptyState>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {savedSearches.map((savedSearch) => {
                    const id = savedSearch.id ?? savedSearch._id ?? savedSearch.name;
                    return (
                      <PremiumCard key={id} className="flex flex-col justify-between gap-4 p-5">
                        <div>
                          <h4 className="font-semibold text-[#2F2F2F]">{savedSearch.name}</h4>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {savedSearch.notifyOnNewMatches
                              ? 'Daily email alerts enabled'
                              : 'Alerts currently off'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <PremiumButton
                            onClick={() => {
                              setActiveTab('search');
                              void runSearch(savedSearch.query);
                            }}
                            className="h-9 px-4 text-xs"
                            variant="primary"
                          >
                            Run search
                          </PremiumButton>
                          <PremiumButton
                            onClick={() => void deleteSavedSearch(id)}
                            className="h-9 px-4 text-xs"
                            variant="danger"
                          >
                            Delete
                          </PremiumButton>
                        </div>
                      </PremiumCard>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Advanced filters">
        {renderFilterForm()}
      </FilterDrawer>

      <div
        className="fixed inset-x-0 z-30 px-4 md:hidden"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.25rem)' }}
      >
        <PremiumButton
          onClick={() => setDrawerOpen(true)}
          variant="secondary"
          className="mx-auto flex w-full max-w-sm items-center justify-center rounded-full border-[#A10E4D]/20 bg-white/95 shadow-[0_16px_36px_rgba(122,31,43,0.14)] backdrop-blur"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </PremiumButton>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  onProfileHidden,
}: Readonly<{
  profile: MatchCard;
  onProfileHidden?: () => void;
}>) {
  return (
    <ProfileMatchCard
      profile={{
        age: profile.age ?? 'Age hidden',
        city: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
        community: profile.community ?? profile.motherTongue,
        highlights: profile.matchReasons,
        id: profile.id,
        isBoosted: profile.isBoosted,
        lastActiveLabel: formatRelativeDate(profile.lastActiveAt),
        matchScore: profile.matchScore,
        name: profile.firstName ?? 'Vivah member',
        occupation: profile.occupation,
        photoUrl: profile.photoUrl,
        privacyHint: 'Private photos and direct introductions stay protected until you connect.',
        verificationLevel: profile.verificationLevel,
        slug: profile.id,
      }}
      actions={
        <ProfileActions
          profileId={profile.id}
          {...(onProfileHidden ? { onProfileHidden } : {})}
        />
      }
    />
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
  defaultValue?: string | undefined;
}>) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/40 px-4 text-sm outline-none transition duration-200 focus:bg-white focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: Readonly<{
  label: string;
  name: string;
  options: string[];
  defaultValue?: string | undefined;
}>) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/40 px-4 text-sm outline-none transition duration-200 focus:bg-white focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
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
