'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { AlertCircle, ShieldAlert, Check, X, ClipboardSignature, Eye, ShieldCheck } from 'lucide-react';

interface ProfileItem {
  _id: string;
  displayId: string;
  personal?: { firstName?: string; lastName?: string };
  moderation: {
    approvalStatus: string;
    rejectionReason?: string;
    lastReviewSnapshot?: { previous?: unknown; current?: unknown };
  };
  verification?: { level?: string };
  completionPercentage: number;
  updatedAt: string;
}

export default function AdminProfilesPage() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('PENDING');
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [detail, setDetail] = useState<ProfileItem | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [reviewItem, setReviewItem] = useState<{ id: string; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);

  async function load(nextStatus = status) {
    setLoading(true);
    const result = await memberRequest(`/api/admin/profiles?status=${nextStatus}`);
    if (result.ok) {
      setProfiles((result.data as { profiles?: ProfileItem[] }).profiles ?? []);
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }

  async function submitReview() {
    if (!reviewItem) return;
    const { id, action } = reviewItem;

    // Enforce rejection reason
    if (action !== 'APPROVE' && !reason.trim()) {
      setMessage('A justification reason must be provided to the member for rejections or changes requested.');
      return;
    }

    const result = await memberRequest(`/api/admin/profiles/${id}/review`, {
      method: 'PATCH',
      body: {
        action,
        ...(action !== 'APPROVE' && reason ? { reason } : {}),
        ...(internalNote ? { internalNote } : {}),
      },
    });

    setMessage(result.message);
    setReviewItem(null);
    setReason('');
    setInternalNote('');
    setConfirmApprove(false);

    if (result.ok) {
      setDetail(null);
      await load();
    }
  }

  async function viewProfile(id: string) {
    const result = await memberRequest(`/api/admin/profiles/${id}`);
    if (result.ok) {
      setDetail((result.data as { profile?: ProfileItem }).profile ?? null);
    } else {
      setMessage(result.message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Profile Moderation Queue"
      subtitle="Moderation workflow for verifying fields validity, inspecting change history drafts, and approving display visibility."
    >
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'].map((option) => (
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
          ) : profiles.length > 0 ? (
            profiles.map((item) => (
              <div
                key={item._id}
                className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md bg-white ${
                  detail?._id === item._id ? 'border-[#A10E4D] ring-2 ring-[#A10E4D]/10' : 'border-[#2F2F2F]/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[10px] font-bold text-neutral-600">
                        {item.displayId}
                      </span>
                      <AdminStatusBadge status={item.moderation.approvalStatus} />
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 mt-1">
                      {item.personal?.firstName ? `${item.personal.firstName} ${item.personal.lastName ?? ''}` : 'Unnamed Profile'}
                    </h3>
                    <p className="text-[10px] text-neutral-450">
                      Last Updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="rounded-full bg-[#FFF9F5] border border-[#D4A04C]/30 px-2 py-0.5 text-[9px] font-extrabold text-[#D4A04C]">
                        {item.verification?.level ?? 'NONE'} TRUST
                      </span>
                      <span className="text-[9px] text-neutral-450 font-bold">
                        {item.completionPercentage}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => void viewProfile(item._id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition bg-white shadow-sm"
                      type="button"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Compare Draft</span>
                    </button>
                    {item.moderation.approvalStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setReviewItem({ id: item._id, action: 'APPROVE' });
                            setConfirmApprove(false);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, action: 'REQUEST_CHANGES' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition bg-white shadow-sm"
                          type="button"
                        >
                          <span>Request Edits</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: item._id, action: 'REJECT' })}
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
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white shadow-sm">
              <span className="text-3xl">📇</span>
              <h3 className="mt-3 text-sm font-bold text-neutral-800">Queue is Clear</h3>
              <p className="mt-1 text-xs text-neutral-450">No profiles currently awaiting review in this state.</p>
            </div>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div>
          {detail ? (
            <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900">Draft Comparison</h3>
                  <p className="text-[10px] text-neutral-450 mt-1 font-mono">Profile ID: {detail._id}</p>
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
                <SnapshotComparison snapshot={detail.moderation.lastReviewSnapshot} />

                {detail.moderation.rejectionReason && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Previous Review Feedback</h4>
                    <p className="mt-1.5 text-xs text-neutral-650 bg-neutral-50 p-2.5 rounded-xl border border-neutral-150 leading-relaxed font-medium">
                      {detail.moderation.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="hidden lg:flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400 bg-white shadow-sm">
              <ClipboardSignature className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-xs">Select a profile on the left to inspect detail draft changes.</p>
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
              {reviewItem.action === 'APPROVE' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Approve Member Profile
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-[#A10E4D]" />
                  Modify Profile Moderation State
                </>
              )}
            </h3>
            
            <p className="text-xs text-neutral-500 mt-1">
              Applying review decision <strong className="text-[#A10E4D] uppercase">{reviewItem.action}</strong> to user profile.
            </p>

            <div className="mt-4 space-y-4">
              {reviewItem.action === 'APPROVE' ? (
                <div className="flex items-start gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                  <input
                    type="checkbox"
                    id="confirm-prof-app"
                    checked={confirmApprove}
                    onChange={(e) => setConfirmApprove(e.target.checked)}
                    className="mt-1 h-3.5 w-3.5 rounded text-[#A10E4D] focus:ring-[#A10E4D]/20 cursor-pointer"
                  />
                  <label htmlFor="confirm-prof-app" className="text-xs text-neutral-600 font-semibold cursor-pointer select-none">
                    I confirm that I have reviewed the profile fields comparison, verified compliance, and authorize publishing this member to public search discovery indexes.
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Reason for member feedback *
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide clear reasons/instructions for the user to update their profile..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[80px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Internal audit logs note (Optional)
                </label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Internal notes for auditing trails..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[60px]"
                />
              </div>
            </div>

            {/* Compliance warning footer */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50/50 border border-amber-250 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-805 leading-relaxed">
                <strong>Accountability Notice:</strong> Approving or requesting edits modifies system database indices instantly. Actions will be logged under your operator signature.
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
                disabled={reviewItem.action === 'APPROVE' && !confirmApprove}
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

function SnapshotComparison({
  snapshot,
}: Readonly<{ snapshot: { previous?: unknown; current?: unknown } | undefined }>) {
  if (!snapshot?.previous && !snapshot?.current) {
    return (
      <p className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-xs text-neutral-450 italic">
        No previous review snapshot is available yet.
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      <Snapshot title="Previous Draft Values" value={snapshot.previous} />
      <Snapshot title="Proposed Draft Changes" value={snapshot.current} />
    </div>
  );
}

function Snapshot({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <div className="rounded-xl border border-neutral-150 bg-neutral-50/50 p-3.5">
      <h5 className="text-xs font-bold text-neutral-700">{title}</h5>
      <pre className="mt-2 max-h-40 overflow-auto text-[10px] font-mono leading-relaxed text-neutral-600 bg-white p-2 rounded-lg border border-neutral-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}
