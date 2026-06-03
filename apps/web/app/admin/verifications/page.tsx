'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { FileCheck, Sparkles, AlertCircle, Eye, Check, X, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AdminStatusBadge } from '../components/admin-status-badge';

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
  const [confirmApprove, setConfirmApprove] = useState(false);

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

    // Enforce rejection reason
    if (targetStatus !== 'APPROVED' && !memberReason.trim()) {
      setMessage('A justification reason must be provided to the member for rejections or resubmissions.');
      return;
    }

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
    setConfirmApprove(false);
    
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
    const preview = (result.data as { preview?: { previewUrl?: string; expiresAt?: string } }).preview;
    
    // Open preview URL in a safe new window tab
    if (preview?.previewUrl) {
      window.open(preview.previewUrl, '_blank');
      setMessage(`Secure temporary preview opened. Link expires soon.`);
    } else {
      setMessage('Secure document preview link could not be loaded.');
    }
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
      subtitle="Verify identity documentation, review residency status, and approve premium trust badges."
    >
      {/* TOOLBAR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option);
                void load(option);
                setDetail(null);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                status === option
                  ? 'bg-[#A10E4D] text-white shadow-sm'
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
          className="inline-flex items-center gap-2 rounded-xl border border-[#A10E4D]/20 px-4 py-2 text-xs font-bold text-[#A10E4D] hover:bg-[#FFF0F3] transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>Recalculate Badges</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-[#FFF9F5] border border-[#D4A04C]/30 p-3.5 text-xs font-semibold text-neutral-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-[#A10E4D]" />
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
                className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md bg-white ${
                  detail?._id === item._id ? 'border-[#A10E4D] ring-2 ring-[#A10E4D]/10' : 'border-[#2F2F2F]/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[10px] font-bold text-neutral-600">
                        {item.type}
                      </span>
                      <AdminStatusBadge status={item.status} />
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-neutral-900">
                      Request ID: {item._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-neutral-450 mt-1">
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-700">
                        {item.priority?.label ?? 'NORMAL'} PRIORITY
                      </span>
                      <span className="text-[9px] text-neutral-450 font-medium">
                        Score: {item.priority?.score ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => void viewRequest(item._id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition bg-white shadow-sm"
                      type="button"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Files</span>
                    </button>
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setReviewItem({ id: item._id, targetStatus: 'APPROVED' });
                            setConfirmApprove(false);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, targetStatus: 'NEEDS_RESUBMISSION' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition bg-white shadow-sm"
                          type="button"
                        >
                          <span>Request Changes</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, targetStatus: 'REJECTED' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 text-rose-700 px-3 text-xs font-bold hover:bg-rose-50/50 transition bg-white"
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
              <p className="mt-1 text-xs text-neutral-450">No verification requests found in this category.</p>
            </div>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div>
          {detail ? (
            <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900">{detail.type} Review</h3>
                  <p className="text-[10px] text-neutral-450 mt-1 font-mono">User ID: {detail.userId}</p>
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Secure Document Vault</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-150 bg-neutral-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-700 truncate">{doc.documentType}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">
                            {doc.encrypted ? 'AES-256 Encrypted Storage' : 'Standard Secure Storage'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void previewDocument(detail._id, doc._id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#A10E4D]/25 px-2.5 text-[10px] font-bold text-[#A10E4D] hover:bg-[#FFF0F3] bg-white transition shrink-0"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Decrypt & View</span>
                        </button>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">No document files attached.</p>
                    )}
                  </div>
                </div>

                {detail.reviewReason && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Review Reason (Member Facing)</h4>
                    <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 leading-relaxed">
                      {detail.reviewReason}
                    </p>
                  </div>
                )}

                {detail.adminNote && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Internal Audit Logs Note</h4>
                    <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 leading-relaxed">
                      {detail.adminNote}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="hidden lg:flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400 bg-white">
              <FileCheck className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-xs">Select a request on the left to inspect secure files and details.</p>
            </div>
          )}
        </div>
      </div>

      {/* FORM DIALOG / APPROVAL / REJECTION WORKFLOW */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setReviewItem(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
          />
          
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
              {reviewItem.targetStatus === 'APPROVED' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Approve Verification Request
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-[#A10E4D]" />
                  Modify Verification Request
                </>
              )}
            </h3>
            
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Applying state change to <strong className="text-[#A10E4D] uppercase">{reviewItem.targetStatus.replace('_', ' ')}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              {/* Approval confirmation checkbox */}
              {reviewItem.targetStatus === 'APPROVED' ? (
                <div className="flex items-start gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                  <input
                    type="checkbox"
                    id="confirm-app"
                    checked={confirmApprove}
                    onChange={(e) => setConfirmApprove(e.target.checked)}
                    className="mt-1 h-3.5 w-3.5 rounded text-[#A10E4D] focus:ring-[#A10E4D]/20 cursor-pointer"
                  />
                  <label htmlFor="confirm-app" className="text-xs text-neutral-600 font-semibold cursor-pointer">
                    I confirm that I have reviewed the decrypted documents and verified the member's authenticity.
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Reason for member *
                  </label>
                  <textarea
                    required
                    value={memberReason}
                    onChange={(e) => setMemberReason(e.target.value)}
                    placeholder="Provide a clear, detailed reason showing the member what needs correction..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[80px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Internal audit comment (Optional)
                </label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Audit reference comment for internal records..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[60px]"
                />
              </div>
            </div>

            {/* Compliance warning footer */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50/50 border border-amber-250 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Compliance Operator Warning:</strong> Decisions modify profile trust levels in real-time. Actions will be attributed to your audit signature.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewItem(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 bg-white transition"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitReview()}
                disabled={reviewItem.targetStatus === 'APPROVED' && !confirmApprove}
                className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] disabled:bg-neutral-350 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white shadow-md transition"
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
