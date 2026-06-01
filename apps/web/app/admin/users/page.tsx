'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface UserItem {
  id: string;
  email?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const memberRequest = useMemberRequest();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const result = await memberRequest('/api/admin/users');
    if (result.ok) {
      setUsers((result.data as { users?: UserItem[] }).users ?? []);
    } else setMessage(result.message);
  }

  async function updateUser(id: string, body: Record<string, unknown>) {
    const result = await memberRequest(`/api/admin/users/${id}`, { method: 'PATCH', body });
    setMessage(result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Users"
      subtitle="Search and manage member account status, roles, and verification flags."
    >
      {message ? <p className="mb-4 text-sm text-[#7A1E3A]">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-[#5E6470]">
            <tr>
              <th className="py-3">Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-3 font-medium">{user.email ?? user.id}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.emailVerified ? 'Verified' : 'Pending'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="flex gap-2 py-3">
                  <button
                    className="rounded-md border px-3 py-2"
                    onClick={() => void updateUser(user.id, { status: 'SUSPENDED' })}
                  >
                    Suspend
                  </button>
                  <button
                    className="rounded-md border px-3 py-2"
                    onClick={() => void updateUser(user.id, { status: 'ACTIVE' })}
                  >
                    Activate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
