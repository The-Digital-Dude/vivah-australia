'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface ProfileItem {
  _id: string;
  displayId: string;
  personal?: { firstName?: string; lastName?: string };
  moderation: { approvalStatus: string; rejectionReason?: string };
  completionPercentage: number;
  updatedAt: string;
}

export default function AdminProfilesPage() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('PENDING');
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [message, setMessage] = useState('');

  async function load(nextStatus = status) {
    const result = await memberRequest(`/api/admin/profiles?status=${nextStatus}`);
    if (result.ok) setProfiles((result.data as { profiles?: ProfileItem[] }).profiles ?? []);
    else setMessage(result.message);
  }

  async function review(id: string, action: string) {
    const reason =
      action === 'APPROVE' ? undefined : (window.prompt('Reason for member') ?? undefined);
    const result = await memberRequest(`/api/admin/profiles/${id}/review`, {
      method: 'PATCH',
      body: { action, ...(reason ? { reason } : {}) },
    });
    setMessage(result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Profile moderation"
      subtitle="Review submitted member profiles before they appear in search."
    >
      <div className="mb-4 flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'].map((option) => (
          <button
            key={option}
            onClick={() => {
              setStatus(option);
              void load(option);
            }}
            className={`rounded-md border px-3 py-2 text-sm ${status === option ? 'bg-[#7A1E3A] text-white' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
      {message ? <p className="mb-4 text-sm text-[#7A1E3A]">{message}</p> : null}
      <div className="grid gap-3">
        {profiles.map((profile) => (
          <article key={profile._id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {profile.personal?.firstName ?? 'Member'} {profile.personal?.lastName ?? ''}
                </h2>
                <p className="text-sm text-[#5E6470]">
                  {profile.displayId} · {profile.completionPercentage}% complete
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => void review(profile._id, 'APPROVE')}
                >
                  Approve
                </button>
                <button
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
                  onClick={() => void review(profile._id, 'NEEDS_CHANGES')}
                >
                  Needs changes
                </button>
                <button
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
                  onClick={() => void review(profile._id, 'REJECT')}
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
