'use client';

import { useEffect, useState, type FormEvent } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

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
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [message, setMessage] = useState('');

  function path(nextPage = page) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', '25');
    if (query.trim()) params.set('q', query.trim());
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (verificationLevel) params.set('verificationLevel', verificationLevel);
    const suffix = params.toString();
    return `/api/admin/users${suffix ? `?${suffix}` : ''}`;
  }

  async function load(nextPage = page) {
    const result = await memberRequest(path(nextPage));
    if (result.ok) {
      const data = result.data as { users?: UserItem[]; pagination?: { total?: number } };
      setUsers(data.users ?? []);
      setTotal(data.pagination?.total ?? 0);
    } else {
      setMessage(result.message);
    }
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

  async function addNote(id: string) {
    const note = window.prompt('Add an internal admin note');
    if (!note?.trim()) return;
    const result = await memberRequest(`/api/admin/users/${id}/notes`, {
      method: 'PATCH',
      body: { note },
    });
    setMessage(result.ok ? 'Note added.' : result.message);
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

  return (
    <AdminShell
      title="Users"
      subtitle="Search by name, email, or display ID and manage member status, roles, and internal notes."
    >
      <form
        onSubmit={submitFilters}
        className="mb-5 grid gap-3 rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4 md:grid-cols-[1fr_160px_160px_180px_auto]"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or display ID"
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm outline-none focus:border-[#7A1E3A]"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
        >
          <option value="">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={verificationLevel}
          onChange={(event) => setVerificationLevel(event.target.value)}
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
        >
          <option value="">All verification</option>
          {verificationLevels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {message ? <p className="mb-4 text-sm text-[#7A1E3A]">{message}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b text-[#5E6470]">
            <tr>
              <th className="py-3">Member</th>
              <th>Display ID</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Joined</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-3">
                  <p className="font-medium">
                    {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
                      'Unnamed member'}
                  </p>
                  <p className="text-[#5E6470]">{user.email ?? user.id}</p>
                </td>
                <td>{user.profile?.displayId ?? '-'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) => void updateRole(user.id, event.target.value)}
                    className="rounded-md border px-2 py-2"
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={user.status}
                    onChange={(event) => void updateStatus(user.id, event.target.value)}
                    className="rounded-md border px-2 py-2"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{user.profile?.verificationLevel ?? '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="flex gap-2 py-3">
                  <button
                    className="rounded-md border px-3 py-2"
                    onClick={() => void addNote(user.id)}
                  >
                    Add
                  </button>
                  <button
                    className="rounded-md border px-3 py-2"
                    onClick={() => void showNotes(user.id)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-[#5E6470]">
        <span>
          Page {page} · {total} users
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-2 disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <button
            className="rounded-md border px-3 py-2 disabled:opacity-50"
            disabled={page * 25 >= total}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
      {detail ? (
        <section className="mt-6 rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">User details</h2>
              <p className="mt-1 text-sm text-[#5E6470]">
                {detail.user?.email ?? 'Member'} · {detail.user?.role} · {detail.user?.status}
              </p>
              <p className="mt-1 text-sm text-[#5E6470]">
                {detail.profile?.displayId ?? 'No display ID'} ·{' '}
                {detail.profile?.verificationLevel ?? 'No badge'}
              </p>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            <h3 className="text-sm font-semibold">Internal notes</h3>
            {detail.notes?.length ? (
              detail.notes.map((note) => (
                <p key={note.id} className="rounded-md bg-white p-3 text-sm text-[#5E6470]">
                  {note.note}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#5E6470]">No notes yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
