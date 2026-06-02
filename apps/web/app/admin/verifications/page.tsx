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
  documentUrls?: string[];
  adminNote?: string;
  priority?: { label: string; score: number; ageDays: number };
  createdAt: string;
}

interface VerificationDocument {
  _id: string;
  documentType: string;
  encrypted: boolean;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('PENDING');
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [detail, setDetail] = useState<VerificationItem | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [message, setMessage] = useState('');

  async function load(nextStatus = status) {
    const result = await memberRequest(`/api/admin/verifications?status=${nextStatus}`);
    if (result.ok) setRequests((result.data as { requests?: VerificationItem[] }).requests ?? []);
    else setMessage(result.message);
  }

  async function review(id: string, nextStatus: string) {
    const reason =
      nextStatus === 'APPROVED' ? undefined : (window.prompt('Reason for member') ?? undefined);
    const adminNote = window.prompt('Internal note') ?? undefined;
    const result = await memberRequest(`/api/admin/verifications/${id}/review`, {
      method: 'PATCH',
      body: {
        status: nextStatus,
        ...(reason ? { reason } : {}),
        ...(adminNote ? { adminNote } : {}),
      },
    });
    setMessage(result.message);
    if (result.ok) await load();
  }

  async function viewRequest(id: string) {
    const result = await memberRequest(`/api/admin/verifications/${id}`);
    if (result.ok) {
      const data = result.data as {
        request?: VerificationItem;
        documents?: VerificationDocument[];
      };
      setDetail(data.request ?? null);
      setDocuments(data.documents ?? []);
    } else setMessage(result.message);
  }

  async function previewDocument(requestId: string, documentId: string) {
    const result = await memberRequest(
      `/api/admin/verifications/${requestId}/documents/${documentId}/preview`,
    );
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const preview = (result.data as { preview?: { previewUrl?: string; expiresAt?: string } })
      .preview;
    setMessage(
      preview?.previewUrl
        ? `Secure preview prepared until ${new Date(preview.expiresAt ?? '').toLocaleTimeString()}.`
        : 'Secure preview prepared.',
    );
  }

  async function recalculateBadges() {
    const result = await memberRequest('/api/admin/verifications/recalculate-badges', {
      method: 'POST',
    });
    setMessage(result.message);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Verification requests"
      subtitle="Review identity, address, employment, visa, police clearance, and facial verification requests."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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
        <button
          type="button"
          onClick={() => void recalculateBadges()}
          className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-sm font-semibold text-[#7A1E3A]"
        >
          Recalculate badges
        </button>
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A1E3A]">
                  {item.priority?.label ?? 'NORMAL'} priority · score {item.priority?.score ?? 0}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
                  onClick={() => void viewRequest(item._id)}
                >
                  View
                </button>
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
      {detail ? (
        <section className="mt-6 rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{detail.type}</h2>
              <p className="mt-1 text-sm text-[#5E6470]">
                {detail.status} · user {detail.userId}
              </p>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-[#5E6470]">
            {documents.map((document) => (
              <div
                key={document._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3"
              >
                <span>
                  {document.documentType} · {document.encrypted ? 'Encrypted' : 'Stored'}
                </span>
                <button
                  type="button"
                  onClick={() => void previewDocument(detail._id, document._id)}
                  className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
                >
                  Secure preview
                </button>
              </div>
            ))}
            {documents.length === 0 ? <p>No secure documents attached.</p> : null}
            {detail.reviewReason ? <p>Reason: {detail.reviewReason}</p> : null}
            {detail.adminNote ? <p>Internal note: {detail.adminNote}</p> : null}
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
