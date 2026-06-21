'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminDataTable } from '../components/admin-data-table';
import type { Column } from '../components/admin-data-table';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { AdminActionMenu } from '../components/admin-primitives';
import { AlertCircle, ShieldAlert } from 'lucide-react';

const roles = ['USER', 'PREMIUM_USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
const statuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED'];
const verificationLevels = ['NONE', 'BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'FULLY_VERIFIED'];

interface UserItem {
  id: string;
  email?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  mobileVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  profile?: {
    displayId?: string;
    firstName?: string;
    lastName?: string;
    verificationLevel?: string;
    approvalStatus?: string;
  } | null;
}

interface FullUser {
  id: string;
  email?: string;
  mobile?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  authProviders?: string[];
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  activeSessionCount?: number;
  termsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  marketingConsent?: boolean;
  notificationPreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

interface UserDetail {
  user?: FullUser;
  profile?: Record<string, unknown> | null;
  notes?: Array<{ id: string; note: string; authorId: string; createdAt: string }>;
}

interface PlanOption {
  id: string;
  code: string;
  name: string;
}

export default function AdminUsersPage() {
  const memberRequest = useMemberRequest();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [verificationLevel, setVerificationLevel] = useState('');
  const [planId, setPlanId] = useState('');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [noteUser, setNoteUser] = useState<UserItem | null>(null);
  const [noteContent, setNoteContent] = useState('');

  function startOfDayIso(value: string) {
    return new Date(`${value}T00:00:00.000Z`).toISOString();
  }

  function endOfDayIso(value: string) {
    return new Date(`${value}T23:59:59.999Z`).toISOString();
  }

  function path(nextPage = page) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', '10'); // Unified to match standard Table pagination size
    if (query.trim()) params.set('q', query.trim());
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (verificationLevel) params.set('verificationLevel', verificationLevel);
    if (planId) params.set('planId', planId);
    if (joinedFrom) params.set('joinedFrom', startOfDayIso(joinedFrom));
    if (joinedTo) params.set('joinedTo', endOfDayIso(joinedTo));
    const suffix = params.toString();
    return `/api/admin/users${suffix ? `?${suffix}` : ''}`;
  }

  async function load(nextPage = page) {
    setLoading(true);
    const result = await memberRequest(path(nextPage));
    if (result.ok) {
      const data = result.data as { users?: UserItem[]; pagination?: { total?: number } };
      setUsers(data.users ?? []);
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, nextStatus: string) {
    const result = await memberRequest(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: { status: nextStatus },
    });
    setMessage(result.message);
    if (result.ok) await load();
  }

  async function updateRole(id: string, nextRole: string) {
    const result = await memberRequest(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role: nextRole },
    });
    setMessage(result.message);
    if (result.ok) await load();
  }

  async function submitNote() {
    if (!noteUser || !noteContent.trim()) return;
    const result = await memberRequest(`/api/admin/users/${noteUser.id}/notes`, {
      method: 'PATCH',
      body: { note: noteContent },
    });
    setMessage(result.ok ? 'Audit note added successfully.' : result.message);
    setNoteUser(null);
    setNoteContent('');
    if (result.ok && detail?.user?.id === noteUser.id) {
      await showNotes(noteUser.id);
    }
  }

  async function showNotes(id: string) {
    const result = await memberRequest(`/api/admin/users/${id}`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const detail = result.data as UserDetail;
    setDetail(detail);
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void load(1);
  }

  useEffect(() => {
    void load();
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      const result = await memberRequest('/api/plans');
      if (!result.ok) {
        if (!cancelled) setMessage(result.message);
        return;
      }
      const data = result.data as { plans?: PlanOption[] };
      if (!cancelled) setPlans(data.plans ?? []);
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, [memberRequest]);

  const columns: Column<UserItem>[] = [
    {
      header: 'Member details',
      accessor: (user) => (
        <button
          type="button"
          onClick={() => void showNotes(user.id)}
          className="text-left group"
        >
          <p className="font-bold text-neutral-900 group-hover:text-[#A10E4D] group-hover:underline transition">
            {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
              'Unnamed member'}
          </p>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">{user.email ?? user.id}</p>
        </button>
      ),
    },
    {
      header: 'Display ID',
      accessor: (user) => <span className="font-semibold text-neutral-700">{user.profile?.displayId ?? '-'}</span>,
    },
    {
      header: 'Role config',
      accessor: (user) => (
        <select
          value={user.role}
          onChange={(event) => void updateRole(user.id, event.target.value)}
          className="rounded-xl border border-neutral-250 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {item.replace('_', ' ')}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Account status',
      accessor: (user) => (
        <select
          value={user.status}
          onChange={(event) => void updateStatus(user.id, event.target.value)}
          className="rounded-xl border border-neutral-250 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D]"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Trust badge',
      accessor: (user) => <AdminStatusBadge status={user.profile?.verificationLevel} />,
    },
    {
      header: 'Joined',
      accessor: (user) => <span className="text-neutral-450">{new Date(user.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <AdminActionMenu
          actions={[
            { label: 'Add note', onClick: () => setNoteUser(user) },
            { label: 'Inspect details', onClick: () => void showNotes(user.id) },
          ]}
        />
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="User Management"
      subtitle="Search, modify, and manage member credentials, credentials status, roles, and operational notes."
    >
      {/* FILTER TOOLBAR */}
      <form
        onSubmit={submitFilters}
        className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or display ID"
          className="h-9 rounded-lg border border-neutral-250 bg-white px-4 text-sm placeholder-neutral-400 outline-none focus:border-[#A10E4D]"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
        >
          <option value="">All Roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={verificationLevel}
          onChange={(event) => setVerificationLevel(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
        >
          <option value="">All Verification Levels</option>
          {verificationLevels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
        >
          <option value="">All Account Statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
        >
          <option value="">All Subscription Tiers</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={joinedFrom}
          onChange={(event) => setJoinedFrom(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
          aria-label="Joined from"
        />
        <input
          type="date"
          value={joinedTo}
          onChange={(event) => setJoinedTo(event.target.value)}
          className="h-9 rounded-lg border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
          aria-label="Joined to"
        />
        <button className="h-9 rounded-lg bg-[#A10E4D] hover:bg-[#890B40] px-6 text-sm font-bold text-white shadow-sm transition">
          Search
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      {/* DATA TABLE */}
      <AdminDataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyTitle="No members match search criteria"
        emptyDescription="Please adjust filters or retry your search query."
      />

      {/* USER DETAIL INSPECT MODAL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setDetail(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Details"
          />
          <div className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200 space-y-5">
            <div className="sticky -top-6 z-10 -mx-6 -mt-6 mb-1 flex items-start justify-between gap-4 border-b border-neutral-150 bg-white/95 backdrop-blur px-6 pt-6 pb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {fullProfileName(detail.profile)}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">{detail.user?.email ?? detail.user?.id}</p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                type="button"
              >
                Close
              </button>
            </div>

            {/* ACCOUNT */}
            {detail.user && (
              <DetailSection title="Account">
                <DetailGrid>
                  <DetailField label="User ID" value={detail.user.id} />
                  <DetailField label="Email" value={detail.user.email} />
                  <DetailField label="Mobile" value={detail.user.mobile} />
                  <DetailField label="Role" value={detail.user.role?.replace('_', ' ')} />
                  <DetailField label="Account status" value={detail.user.status} />
                  <DetailField label="Email verified" value={formatDetailValue(detail.user.emailVerified)} />
                  <DetailField label="Mobile verified" value={formatDetailValue(detail.user.mobileVerified)} />
                  <DetailField label="Auth providers" value={formatDetailValue(detail.user.authProviders)} />
                  <DetailField label="Google ID" value={detail.user.googleId} />
                  <DetailField label="Facebook ID" value={detail.user.facebookId} />
                  <DetailField label="Apple ID" value={detail.user.appleId} />
                  <DetailField label="Marketing consent" value={formatDetailValue(detail.user.marketingConsent)} />
                  <DetailField label="Failed login attempts" value={formatDetailValue(detail.user.failedLoginAttempts)} />
                  <DetailField label="Active sessions" value={formatDetailValue(detail.user.activeSessionCount)} />
                  <DetailField label="Locked until" value={formatDetailValue(detail.user.lockUntil)} />
                  <DetailField label="Password changed" value={formatDetailValue(detail.user.passwordChangedAt)} />
                  <DetailField label="Terms accepted" value={formatDetailValue(detail.user.termsAcceptedAt)} />
                  <DetailField label="Privacy accepted" value={formatDetailValue(detail.user.privacyAcceptedAt)} />
                  <DetailField label="Last login" value={detail.user.lastLoginAt ? new Date(detail.user.lastLoginAt).toLocaleString() : 'Never'} />
                  <DetailField label="Joined" value={formatDetailValue(detail.user.createdAt)} />
                  <DetailField label="Last updated" value={formatDetailValue(detail.user.updatedAt)} />
                  <DetailField label="Deleted" value={formatDetailValue(detail.user.isDeleted)} />
                  <DetailField label="Deleted at" value={formatDetailValue(detail.user.deletedAt)} />
                </DetailGrid>
                {detail.user.notificationPreferences && (
                  <ObjectBlock title="Notification preferences" data={detail.user.notificationPreferences} />
                )}
                {detail.user.metadata && <ObjectBlock title="Metadata" data={detail.user.metadata} />}
              </DetailSection>
            )}

            {/* PROFILE — every field */}
            {detail.profile ? (
              <ProfileSections profile={detail.profile} />
            ) : (
              <p className="text-xs text-neutral-500 italic">No profile record exists for this member.</p>
            )}

            {/* AUDIT NOTES */}
            <div className="space-y-3 border-t border-neutral-150 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Internal Audit Notes</h4>
              {detail.notes?.length ? (
                <div className="space-y-2">
                  {detail.notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
                      <p className="text-sm text-neutral-750 font-medium leading-relaxed">{note.note}</p>
                      <p className="text-[10px] text-neutral-400 mt-2 font-semibold">
                        Author: {note.authorId} · Created: {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">No notes exist for this member.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {noteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setNoteUser(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Add User Audit Note
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Add note to user <strong className="text-[#A10E4D]">{noteUser.email}</strong>.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Internal note text *
              </label>
              <textarea
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type note details..."
                className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[100px]"
              />
            </div>

            {/* Audit compliance warning */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Logging Standard:</strong> Internal notes are immutable and saved to the audit log context. Keep comments objective and business-oriented.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteUser(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitNote()}
                className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm"
                type="button"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="text-sm font-semibold text-neutral-800 mt-0.5 break-words">{value || '-'}</p>
    </div>
  );
}

function humanizeLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'string') {
    return isIsoDateString(value) ? new Date(value).toLocaleString() : value;
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatDetailValue(item)).join(', ') : '-';
  }
  return JSON.stringify(value) ?? '-';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fullProfileName(profile: Record<string, unknown> | null | undefined): string {
  const personal = isPlainObject(profile?.personal) ? profile.personal : {};
  const name = [personal.firstName, personal.lastName]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ');
  return name || 'Unnamed member';
}

function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">{children}</div>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-t border-neutral-150 pt-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">{title}</h4>
      {children}
    </div>
  );
}

function ObjectBlock({ title, data }: { title: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{title}</p>
      <DetailGrid>
        {entries.map(([key, value]) => (
          <DetailField key={key} label={humanizeLabel(key)} value={formatDetailValue(value)} />
        ))}
      </DetailGrid>
    </div>
  );
}

function ProfileSections({ profile }: { profile: Record<string, unknown> }) {
  const entries = Object.entries(profile);
  const scalars = entries.filter(([, value]) => !isPlainObject(value));
  const sections = entries.filter((entry): entry is [string, Record<string, unknown>] =>
    isPlainObject(entry[1]),
  );

  return (
    <>
      {scalars.length > 0 && (
        <DetailSection title="Profile overview">
          <DetailGrid>
            {scalars.map(([key, value]) => (
              <DetailField key={key} label={humanizeLabel(key)} value={formatDetailValue(value)} />
            ))}
          </DetailGrid>
        </DetailSection>
      )}
      {sections.map(([key, section]) => {
        const sectionEntries = Object.entries(section);
        const sectionScalars = sectionEntries.filter(([, value]) => !isPlainObject(value));
        const sectionNested = sectionEntries.filter(
          (entry): entry is [string, Record<string, unknown>] => isPlainObject(entry[1]),
        );
        return (
          <DetailSection key={key} title={humanizeLabel(key)}>
            {sectionScalars.length > 0 && (
              <DetailGrid>
                {sectionScalars.map(([childKey, value]) => (
                  <DetailField
                    key={childKey}
                    label={humanizeLabel(childKey)}
                    value={formatDetailValue(value)}
                  />
                ))}
              </DetailGrid>
            )}
            {sectionNested.map(([childKey, nested]) => (
              <ObjectBlock key={childKey} title={humanizeLabel(childKey)} data={nested} />
            ))}
          </DetailSection>
        );
      })}
    </>
  );
}
