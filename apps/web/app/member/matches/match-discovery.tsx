'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Bookmark,
  Heart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Clock,
  UserPlus,
} from 'lucide-react';
import { profileSearchQuerySchema, savedSearchCreateSchema } from '@vivah/shared';
import {
  ProfileMatchCard,
  FilterDrawer,
  PremiumButton,
  PremiumCard,
  EmptyState,
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

const defaultFilters = {
  page: 1,
  pageSize: 12,
  sort: 'RECOMMENDED',
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function MatchDiscovery() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<MatchResponse | null>(null);
  const [recommended, setRecommended] = useState<MatchCard[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [currentQuery, setCurrentQuery] = useState<Record<string, unknown>>(defaultFilters);
  const [activeTab, setActiveTab] = useState<
    'search' | 'recommended' | 'active' | 'newest' | 'saved'
  >('search');
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  async function refreshVisibleResults() {
    if (activeTab === 'recommended') {
      await loadRecommended();
      return;
    }

    await runSearch(currentQuery);
  }

  async function runSearch(query: Record<string, unknown> = defaultFilters) {
    setLoading(true);
    setMessage(null);
    setCurrentQuery(query);
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, String(item)));
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
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
    void loadSavedSearches();
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

  const renderFilterForm = (isMobile = false) => {
    return (
      <form
        onSubmit={(event) => {
          if (isMobile) {
            setDrawerOpen(false);
          }
          void submit(event);
        }}
        className="grid gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#7A1F2B]">Discovery</p>
            <h2 className="mt-1 text-lg font-semibold text-[#1A1A1A]">Search Filters</h2>
          </div>
          {!isMobile && <SlidersHorizontal className="size-5 text-[#D6A84F]" />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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

        <details className="rounded-2xl border border-[#7A1F2B]/10 bg-[#FCFAF7]/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#7A1F2B] outline-none">
            Advanced filters
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Field label="Height min" name="heightMinCm" type="number" placeholder="155" />
            <Field label="Height max" name="heightMaxCm" type="number" placeholder="185" />
            <Field label="Income min" name="incomeMin" type="number" placeholder="90000" />
            <Select
              label="Verification"
              name="verificationLevel"
              options={['BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'FULLY_VERIFIED']}
            />
            <label className="flex items-center gap-2.5 text-sm font-semibold text-[#1A1A1A]">
              <input
                name="recentlyActive"
                type="checkbox"
                className="size-4 rounded accent-[#7A1F2B]"
              />
              Recently active
            </label>
          </div>
        </details>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
          <Field label="Results per page" name="pageSize" type="number" defaultValue="12" />
          <PremiumButton type="submit" className="w-full lg:mt-2">
            <Search className="size-4" />
            Search Matches
          </PremiumButton>
        </div>
      </form>
    );
  };

  const renderResultsGrid = (cols = 'grid gap-4 md:grid-cols-2') => {
    if (loading) {
      return (
        <div className={cols}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (!search || search.results.length === 0) {
      return (
        <EmptyState title="No matches found">
          Try broadening age, city, or community filters to discover more profiles.
        </EmptyState>
      );
    }

    return (
      <div className={cols}>
        {search.results.map((profile, index) => (
            <ProfileCard
            key={profile.id}
            profile={profile}
            index={index}
            onProfileHidden={refreshVisibleResults}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-8">
      {/* ─── Premium Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-[#7A1F2B]/10 pb-px scrollbar-none gap-2">
        <button
          onClick={() => {
            setActiveTab('search');
            void runSearch(defaultFilters);
          }}
          className={cx(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
            activeTab === 'search'
              ? 'border-[#7A1F2B] text-[#7A1F2B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]',
          )}
        >
          <Search className="size-4" />
          Search & Browse
        </button>

        <button
          onClick={() => {
            setActiveTab('recommended');
            void loadRecommended();
          }}
          className={cx(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
            activeTab === 'recommended'
              ? 'border-[#7A1F2B] text-[#7A1F2B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]',
          )}
        >
          <Heart className="size-4" />
          Recommended
        </button>

        <button
          onClick={() => {
            setActiveTab('active');
            void runSearch({ sort: 'RECENTLY_ACTIVE', page: 1, pageSize: 12 });
          }}
          className={cx(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
            activeTab === 'active'
              ? 'border-[#7A1F2B] text-[#7A1F2B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]',
          )}
        >
          <Clock className="size-4" />
          Recently Active
        </button>

        <button
          onClick={() => {
            setActiveTab('newest');
            void runSearch({ sort: 'NEWEST', page: 1, pageSize: 12 });
          }}
          className={cx(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
            activeTab === 'newest'
              ? 'border-[#7A1F2B] text-[#7A1F2B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]',
          )}
        >
          <UserPlus className="size-4" />
          New Members
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            void loadSavedSearches();
          }}
          className={cx(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
            activeTab === 'saved'
              ? 'border-[#7A1F2B] text-[#7A1F2B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]',
          )}
        >
          <Bookmark className="size-4" />
          Saved Searches
        </button>
      </div>

      {/* ─── Tab Content ───────────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Desktop Filter Panel */}
          <aside className="hidden lg:block">
            <PremiumCard className="p-5">{renderFilterForm()}</PremiumCard>
          </aside>

          {/* Search Result Listing */}
          <div className="grid content-start gap-5">
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#7A1F2B]/10 bg-white px-3 py-1 text-xs font-semibold text-[#6B7280]"
                >
                  {chip}
                </span>
              ))}
            </div>

            {message ? (
              <p className="rounded-2xl border border-[#7A1F2B]/10 bg-[#F8E8E8] p-4 text-sm text-[#7A1F2B]">
                {message}
              </p>
            ) : null}

            {renderResultsGrid('grid gap-4 md:grid-cols-2')}

            {/* Mobile Filter Drawer Overlay */}
            <FilterDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              title="Search Filters"
            >
              {renderFilterForm(true)}
            </FilterDrawer>

            {/* Floating Mobile Filter Button */}
            <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
              <PremiumButton onClick={() => setDrawerOpen(true)} className="shadow-2xl">
                <SlidersHorizontal className="size-4" />
                Show Filters
              </PremiumButton>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommended' && (
        <div className="grid gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Compatible Matches</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Calculated automatically based on your profile preferences and background
              expectations.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <EmptyState title="No recommendations available">
              Update your partner preferences in your profile wizard to help us find matches for
              you.
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommended.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  onProfileHidden={refreshVisibleResults}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="grid gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Recently Active</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Members active within the last 24 hours, ordered by communication readiness.
            </p>
          </div>
          {renderResultsGrid('grid gap-4 md:grid-cols-2 lg:grid-cols-3')}
        </div>
      )}

      {activeTab === 'newest' && (
        <div className="grid gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">New Members</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Freshly joined members who recently completed their registration and verification.
            </p>
          </div>
          {renderResultsGrid('grid gap-4 md:grid-cols-2 lg:grid-cols-3')}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Saved Searches</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage and rerun your preferred filter combinations for targeted search.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Save Search Form on left */}
            <aside className="h-fit">
              <PremiumCard className="p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A1F2B]">
                  Save current query
                </h3>
                <form className="grid gap-3" onSubmit={(event) => void saveSearch(event)}>
                  <input
                    name="name"
                    placeholder="Name this search"
                    className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 text-sm outline-none transition focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                    <input
                      name="notifyOnNewMatches"
                      type="checkbox"
                      className="size-4 rounded accent-[#7A1F2B]"
                    />
                    Email notifications
                  </label>
                  <PremiumButton type="submit" variant="secondary" className="w-full">
                    Save search
                  </PremiumButton>
                </form>
              </PremiumCard>
            </aside>

            {/* Saved Searches list on right */}
            <div className="space-y-4">
              {savedSearches.length === 0 ? (
                <EmptyState title="No saved searches">
                  Your saved search configurations will appear here.
                </EmptyState>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {savedSearches.map((savedSearch) => {
                    const id = savedSearch.id ?? savedSearch._id ?? savedSearch.name;
                    return (
                      <PremiumCard key={id} className="flex flex-col justify-between gap-4 p-5">
                        <div>
                          <h4 className="font-semibold text-[#1A1A1A]">{savedSearch.name}</h4>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {savedSearch.notifyOnNewMatches
                              ? '📧 Daily email alerts enabled'
                              : '📧 Alerts off'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <PremiumButton
                            onClick={() => {
                              setActiveTab('search');
                              void runSearch(savedSearch.query);
                            }}
                            className="h-9 px-4 text-xs"
                            variant="primary"
                          >
                            Run Search
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
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  profile,
  compact = false,
  onProfileHidden,
}: Readonly<{
  profile: MatchCard;
  index: number;
  compact?: boolean;
  onProfileHidden?: () => void;
}>) {
  return (
    <ProfileMatchCard
      compact={compact}
      profile={{
        age: profile.age ?? 'Age hidden',
        city: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
        community: profile.community ?? profile.motherTongue,
        education: profile.education,
        id: profile.id,
        matchScore: profile.matchScore,
        name: profile.firstName ?? 'Vivah member',
        occupation: profile.occupation,
        photoUrl: profile.photoUrl,
        religion: profile.religion,
        verificationLevel: profile.verificationLevel,
      }}
      actions={
        !compact ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {profile.matchReasons.slice(0, 3).map((reason) => (
                <span
                  key={reason}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F7FBF8] px-2.5 py-1 text-xs font-semibold text-[#1F6F4A]"
                >
                  <ShieldCheck className="size-3.5" />
                  {reason}
                </span>
              ))}
            </div>
            <ProfileActions
              profileId={profile.id}
              {...(onProfileHidden ? { onProfileHidden } : {})}
            />
          </div>
        ) : (
          <ProfileActions
            profileId={profile.id}
            compact
            {...(onProfileHidden ? { onProfileHidden } : {})}
          />
        )
      }
    />
  );
}

function SkeletonCard() {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-4 rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 shadow-sm animate-pulse">
      <div className="aspect-[3/4] rounded-2xl bg-[#F8E8E8]" />
      <div className="grid content-start gap-3">
        <div className="h-5 w-2/3 rounded-lg bg-[#F8E8E8]" />
        <div className="h-4 w-1/2 rounded-lg bg-[#F8E8E8]" />
        <div className="h-4 w-5/6 rounded-lg bg-[#F8E8E8]" />
        <div className="h-7 w-24 rounded-full bg-[#F8E8E8]" />
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
    <label className="grid gap-1.5 text-sm font-semibold text-[#1A1A1A]">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 text-sm outline-none transition duration-200 focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
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
    <label className="grid gap-1.5 text-sm font-semibold text-[#1A1A1A]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 text-sm outline-none transition duration-200 focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
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
