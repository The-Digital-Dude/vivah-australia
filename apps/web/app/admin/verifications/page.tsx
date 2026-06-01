'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface VerificationItem {
  _id: string;
  userId: string;
  type: string;
  status: string;
  reviewReason?: string;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('PENDING');
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [message, setMessage] = useState('');

  async function load(nextStatus = status) {
    const result = await memberRequest(`/api/admin/verifications?status=${nextStatus}`);
    if (result.ok) setRequests((result.data as { requests?: VerificationItem[] }).requests ?? []);
    else setMessage(result.message);
  }

  async function review(id: string, nextStatus: string) {
    const reason =
      nextStatus === 'APPROVED' ? undefined : (window.prompt('Reason for member') ?? undefined);
    const result = await memberRequest(`/api/admin/verifications/${id}/review`, {
      method: 'PATCH',
      body: { status: nextStatus, ...(reason ? { reason } : {}) },
    });
    setMessage(result.message);
    if (result.ok) await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Verification requests"
      subtitle="Review identity, address, employment, visa, police clearance, and facial verification requests."
    >
      <div className="mb-4 flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'].map((option) => (
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
        {requests.map((item) => (
          <article key={item._id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.type}</h2>
                <p className="text-sm text-[#5E6470]">
                  {item.status} · {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => void review(item._id, 'APPROVED')}
                >
                  Approve
                </button>
                <button
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
                  onClick={() => void review(item._id, 'NEEDS_RESUBMISSION')}
                >
                  Resubmit
                </button>
                <button
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
                  onClick={() => void review(item._id, 'REJECTED')}
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
