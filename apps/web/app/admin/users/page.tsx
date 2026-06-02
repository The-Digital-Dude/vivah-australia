'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
  createdAt: string;
  profile?: {
    displayId?: string;
    firstName?: string;
    lastName?: string;
    verificationLevel?: string;
    approvalStatus?: string;
  } | null;
}

interface UserDetail {
  user?: UserItem;
  profile?: UserItem['profile'];
  notes?: Array<{ id: string; note: string; authorId: string; createdAt: string }>;
}

export default function AdminUsersPage() {
  const memberRequest = useMemberRequest();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [verificationLevel, setVerificationLevel] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [noteUser, setNoteUser] = useState<UserItem | null>(null);
  const [noteContent, setNoteContent] = useState('');

  function path(nextPage = page) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', '10'); // Unified to match standard Table pagination size
    if (query.trim()) params.set('q', query.trim());
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (verificationLevel) params.set('verificationLevel', verificationLevel);
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

  const columns: Column<UserItem>[] = [
    {
      header: 'Member details',
      accessor: (user) => (
        <div>
          <p className="font-bold text-neutral-900">
            {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
              'Unnamed member'}
          </p>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">{user.email ?? user.id}</p>
        </div>
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
          className="rounded-xl border border-neutral-250 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#7A1F2B]"
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
          className="rounded-xl border border-neutral-250 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#7A1F2B]"
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
        className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or display ID"
          className="h-11 rounded-xl border border-neutral-250 bg-white px-4 text-sm placeholder-neutral-400 outline-none focus:border-[#7A1F2B]"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-11 rounded-xl border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
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
          className="h-11 rounded-xl border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
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
          className="h-11 rounded-xl border border-neutral-250 bg-white px-3 text-sm text-neutral-700"
        >
          <option value="">All Account Statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-xl bg-[#7A1F2B] hover:bg-[#651925] px-6 text-sm font-bold text-white shadow-sm transition">
          Search
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#7A1F2B]" />
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

      {/* USER DETAIL INSPECT PANELS */}
      {detail ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-150 pb-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">User Audit details</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Account ID: {detail.user?.email ?? 'Member'} · Role: {detail.user?.role} · Status: {detail.user?.status}
              </p>
              <p className="text-xs text-neutral-500">
                Display code: {detail.profile?.displayId ?? 'No display ID'} · Level Badge: {detail.profile?.verificationLevel ?? 'No level badge'}
              </p>
            </div>
            <button
              onClick={() => setDetail(null)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
              type="button"
            >
              Close Details
            </button>
          </div>

          <div className="space-y-3">
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
        </section>
      ) : null}

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
              Add note to user <strong className="text-[#7A1F2B]">{noteUser.email}</strong>.
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
                className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[100px]"
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
                className="rounded-xl bg-[#7A1F2B] hover:bg-[#651925] px-4 py-2 text-xs font-bold text-white shadow-sm"
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
