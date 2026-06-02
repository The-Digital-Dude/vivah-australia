'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { AlertCircle, ShieldAlert, Check, X, ClipboardSignature } from 'lucide-react';

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
      subtitle="Review member profile details, verify fields validity, and compare active drafts before publishing."
    >
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'].map((option) => (
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
      </div>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#7A1F2B]" />
          <span>{message}</span>
        </div>
      )}

      {/* SPLIT LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white"
              />
            ))
          ) : profiles.length > 0 ? (
            profiles.map((profile) => (
              <div
                key={profile._id}
                className={`rounded-2xl border p-5 shadow-sm transition hover:shadow bg-white ${
                  detail?._id === profile._id ? 'border-[#7A1F2B] ring-1 ring-[#7A1F2B]/10' : 'border-neutral-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      {[profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
                        'Unnamed Member'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Display Code: <span className="font-semibold text-neutral-700">{profile.displayId}</span> · {profile.completionPercentage}% complete
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <AdminStatusBadge status={profile.moderation.approvalStatus} />
                      <span className="rounded-full bg-neutral-50 border border-neutral-250 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                        {profile.verification?.level ?? 'NO BADGE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => void viewProfile(profile._id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                      type="button"
                    >
                      <span>View</span>
                    </button>
                    {profile.moderation.approvalStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setReviewItem({ id: profile._id, action: 'APPROVE' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: profile._id, action: 'NEEDS_CHANGES' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-neutral-705 hover:bg-neutral-50 transition"
                          type="button"
                        >
                          <span>Needs Changes</span>
                        </button>
                        <button
                          onClick={() => setReviewItem({ id: profile._id, action: 'REJECT' })}
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
              <span className="text-3xl">🗂️</span>
              <h3 className="mt-3 text-sm font-bold text-neutral-800">Queue is Clear</h3>
              <p className="mt-1 text-xs text-neutral-450">No profiles currently require review in this queue status.</p>
            </div>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div>
          {detail ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {[detail.personal?.firstName, detail.personal?.lastName].filter(Boolean).join(' ') ||
                      'Member Profile'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">Display ID: {detail.displayId}</p>
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
                {detail.moderation.rejectionReason && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Rejection Feedback</h4>
                    <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                      {detail.moderation.rejectionReason}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Draft Snapshot Comparison</h4>
                  <SnapshotComparison snapshot={detail.moderation.lastReviewSnapshot} />
                </div>
              </div>
            </section>
          ) : (
            <div className="hidden lg:flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-neutral-400 bg-white">
              <ClipboardSignature className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-xs">Select a profile card to inspect detailed draft snapshots.</p>
            </div>
          )}
        </div>
      </div>

      {/* FORM DIALOG */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setReviewItem(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Submit Profile Review
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Select details for updating profile moderation to{' '}
              <strong className="text-[#7A1F2B]">{reviewItem.action}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              {reviewItem.action !== 'APPROVE' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Reason for member feedback *
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide clear reasons/instructions for the user to update their profile..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[80px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Internal audit note (Optional)
                </label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Internal audit trail context..."
                  className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[60px]"
                />
              </div>
            </div>

            {/* Audit / accountability warning */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-805 leading-relaxed">
                <strong>Accountability Notice:</strong> Approving or requesting edits will write to public search indexes and generate immediate user notifications.
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
      <Snapshot title="Previous values" value={snapshot.previous} />
      <Snapshot title="Current values" value={snapshot.current} />
    </div>
  );
}

function Snapshot({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5">
      <h5 className="text-xs font-bold text-neutral-700">{title}</h5>
      <pre className="mt-2 max-h-40 overflow-auto text-[10px] font-mono leading-relaxed text-neutral-500 bg-white p-2 rounded-lg border border-neutral-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}
