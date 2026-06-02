'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { FileCheck, Sparkles, AlertCircle, Eye, Check, X, ShieldAlert } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [reviewItem, setReviewItem] = useState<{ id: string; targetStatus: string } | null>(null);
  const [memberReason, setMemberReason] = useState('');
  const [internalNote, setInternalNote] = useState('');

  async function load(nextStatus = status) {
    setLoading(true);
    const result = await memberRequest(`/api/admin/verifications?status=${nextStatus}`);
    if (result.ok) {
      setRequests((result.data as { requests?: VerificationItem[] }).requests ?? []);
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }

  async function submitReview() {
    if (!reviewItem) return;
    const { id, targetStatus } = reviewItem;

    const result = await memberRequest(`/api/admin/verifications/${id}/review`, {
      method: 'PATCH',
      body: {
        status: targetStatus,
        ...(memberReason ? { reason: memberReason } : {}),
        ...(internalNote ? { adminNote: internalNote } : {}),
      },
    });

    setMessage(result.message);
    setReviewItem(null);
    setMemberReason('');
    setInternalNote('');
    
    if (result.ok) {
      setDetail(null);
      await load();
    }
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
    } else {
      setMessage(result.message);
    }
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
      title="Trust & Verification Queue"
      subtitle="Review identity documentation, residency papers, employment records, and badge upgrades."
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        {/* TABS */}
        <div className="flex flex-wrap gap-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'].map((option) => (
            <button
              key={option}
              onClick={() => {
                setStatus(option);
                void load(option);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                status === option
                  ? 'bg-[#7A1F2B] text-white shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {option.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void recalculateBadges()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#7A1F2B]/20 px-4 py-2 text-sm font-bold text-[#7A1F2B] hover:bg-[#F8E8E8] transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>Recalculate Badges</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#7A1F2B]" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* REQUESTS LIST */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white"
              />
            ))
          ) : requests.length > 0 ? (
            requests.map((item) => (
              <div
                key={item._id}
                className={`rounded-2xl border p-5 shadow-sm transition hover:shadow bg-white ${
                  detail?._id === item._id ? 'border-[#7A1F2B] ring-1 ring-[#7A1F2B]/10' : 'border-neutral-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
                      {item.type}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-neutral-900">
                      Request ID: {item._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-xs text-neutral-450 mt-1">
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
                        {item.priority?.label ?? 'NORMAL'} PRIORITY
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Score: {item.priority?.score ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => void viewRequest(item._id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                      type="button"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setReviewItem({ id: item._id, targetStatus: 'APPROVED' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, targetStatus: 'NEEDS_RESUBMISSION' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                          type="button"
                        >
                          <span>Resubmit</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, targetStatus: 'REJECTED' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 text-rose-700 px-3 text-xs font-bold hover:bg-rose-50 transition"
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white">
              <span className="text-3xl">🎉</span>
              <h3 className="mt-3 text-sm font-bold text-neutral-800">Queue is Clear</h3>
              <p className="mt-1 text-xs text-neutral-450">No verification requests found in this status category.</p>
            </div>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div>
          {detail ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{detail.type} Details</h3>
                  <p className="text-xs text-neutral-500 mt-1">Requester User: {detail.userId}</p>
                </div>
                <button
                  onClick={() => setDetail(null)}
                  className="rounded-lg border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Attached Documents</h4>
                  <div className="mt-2.5 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-700 truncate">{doc.documentType}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {doc.encrypted ? 'Encrypted Vault Storage' : 'Standard Secure Storage'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void previewDocument(detail._id, doc._id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#7A1F2B]/10 px-2.5 text-[11px] font-bold text-[#7A1F2B] hover:bg-[#F8E8E8] bg-white transition shrink-0"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">No document artifacts attached.</p>
                    )}
                  </div>
                </div>

                {detail.reviewReason && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Review Reason (Member Facing)</h4>
                    <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                      {detail.reviewReason}
                    </p>
                  </div>
                )}

                {detail.adminNote && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Internal Audit Note</h4>
                    <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                      {detail.adminNote}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="hidden lg:flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-neutral-400 bg-white">
              <FileCheck className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-xs">Select a request on the left to inspect secure files and details.</p>
            </div>
          )}
        </div>
      </div>

      {/* FORM DIALOG / MODAL (No window.prompt anymore!) */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            onClick={() => setReviewItem(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          {/* Modal Container */}
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Submit Verification Review
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Select details for updating request status to{' '}
              <strong className="text-[#7A1F2B]">{reviewItem.targetStatus}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              {reviewItem.targetStatus !== 'APPROVED' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Reason for member *
                  </label>
                  <textarea
                    required
                    value={memberReason}
                    onChange={(e) => setMemberReason(e.target.value)}
                    placeholder="Describe why this request requires changes..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[80px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Internal operator note (Optional)
                </label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Internal comments for auditing logs..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[60px]"
                />
              </div>
            </div>

            {/* Audit / accountability warning */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Accountability Notice:</strong> This action will be tied to your operator ID and recorded in the audit logs.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewItem(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitReview()}
                className="rounded-xl bg-[#7A1F2B] hover:bg-[#651925] px-4 py-2 text-xs font-bold text-white shadow-sm"
                type="button"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
