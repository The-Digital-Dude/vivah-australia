'use client';

import { useEffect, useState } from 'react';
import { mediaReviewSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { AlertCircle, ShieldAlert, Check, X, FileImage } from 'lucide-react';

interface ReviewMediaItem {
  _id: string;
  assetUrl: string;
  originalFilename: string;
  category: string;
  visibility: string;
  approvalStatus: string;
  uploadStatus: string;
  moderationReason?: string;
  profileId?: {
    displayId?: string;
    personal?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

function dataAs<T>(data: unknown): T {
  return data as T;
}

export default function AdminMediaReview() {
  const memberRequest = useMemberRequest();
  const [media, setMedia] = useState<ReviewMediaItem[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState<string | null>(null);

  // Dialog State
  const [reviewItem, setReviewItem] = useState<{ item: ReviewMediaItem; targetStatus: string } | null>(null);
  const [reason, setReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);

  async function loadMedia(nextStatus = status) {
    const query = nextStatus ? `?status=${encodeURIComponent(nextStatus)}` : '';
    const result = await memberRequest(`/api/admin/media${query}`);

    if (result.ok) {
      setMedia(dataAs<{ media: ReviewMediaItem[] }>(result.data).media);
    } else {
      setMessage(result.message);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  async function submitReview() {
    if (!reviewItem) return;
    const { item, targetStatus } = reviewItem;

    // Enforce rejection reason
    if (targetStatus !== 'APPROVED' && !reason.trim()) {
      setMessage('A justification reason must be provided to the member for rejections or resubmissions.');
      return;
    }

    const parsed = mediaReviewSchema.safeParse({
      approvalStatus: targetStatus,
      reason: targetStatus === 'APPROVED' ? undefined : reason,
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest(`/api/admin/media/${item._id}/review`, {
      method: 'PATCH',
      body: parsed.data,
    });

    setMessage(result.message);
    setReviewItem(null);
    setReason('');
    setConfirmApprove(false);
    
    if (result.ok) {
      await loadMedia();
    }
  }

  return (
    <div className="space-y-6">
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option);
                void loadMedia(option);
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

      {/* MEDIA GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => (
          <article
            key={item._id}
            className="overflow-hidden rounded-2xl border border-[#2F2F2F]/10 bg-white shadow-sm transition hover:shadow-md duration-200"
          >
            {/* Image container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-50 border-b border-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.assetUrl}
                alt={item.originalFilename}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                  {item.visibility}
                </span>
                <span className="rounded-lg bg-neutral-900/60 px-2.5 py-1 text-[9px] font-bold text-[#D4A04C] uppercase tracking-wider backdrop-blur-sm">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Info details */}
            <div className="p-5 space-y-3.5">
              <div>
                <h3 className="text-sm font-bold text-neutral-800 truncate" title={item.originalFilename}>
                  {item.originalFilename}
                </h3>
                <p className="text-[10px] text-neutral-450 mt-1 font-medium">
                  Owner: <span className="font-semibold text-neutral-700">{item.profileId?.displayId ?? 'Unlinked'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <AdminStatusBadge status={item.approvalStatus} />
                <span className="rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                  {item.uploadStatus}
                </span>
              </div>

              {/* Action Buttons */}
              {item.approvalStatus === 'PENDING' && (
                <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setReviewItem({ item, targetStatus: 'APPROVED' });
                      setConfirmApprove(false);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setReviewItem({ item, targetStatus: 'NEEDS_RESUBMISSION' })}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-neutral-250 px-2 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition bg-white"
                    type="button"
                  >
                    <span>Resubmit</span>
                  </button>
                  <button
                    onClick={() => setReviewItem({ item, targetStatus: 'REJECTED' })}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-200 text-rose-700 px-2 text-xs font-bold hover:bg-rose-50 transition bg-white"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}

        {media.length === 0 && (
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-350 p-8 text-center bg-white shadow-sm">
            <FileImage className="h-8 w-8 text-neutral-300" />
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Media Queue Empty</h3>
            <p className="mt-1 text-xs text-neutral-450">No uploads currently require moderation.</p>
          </div>
        )}
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
                  <Check className="h-5 w-5 text-emerald-600" />
                  Approve Image Asset
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-[#A10E4D]" />
                  Modify Image Asset Status
                </>
              )}
            </h3>
            
            <p className="text-xs text-neutral-500 mt-1">
              Select details for updating asset moderation to <strong className="text-[#A10E4D] uppercase">{reviewItem.targetStatus}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 border border-neutral-100 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reviewItem.item.assetUrl}
                  alt={reviewItem.item.originalFilename}
                  className="h-full w-full object-cover"
                />
              </div>

              {reviewItem.targetStatus === 'APPROVED' ? (
                <div className="flex items-start gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                  <input
                    type="checkbox"
                    id="confirm-media-app"
                    checked={confirmApprove}
                    onChange={(e) => setConfirmApprove(e.target.checked)}
                    className="mt-1 h-3.5 w-3.5 rounded text-[#A10E4D] focus:ring-[#A10E4D]/20 cursor-pointer"
                  />
                  <label htmlFor="confirm-media-app" className="text-xs text-neutral-600 font-semibold cursor-pointer select-none">
                    I confirm that this photo complies with Vivah Australia's profile display guidelines (face is clear, respectful, no contact info).
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
                    placeholder="Describe why this image was rejected or needs changes..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[80px]"
                  />
                </div>
              )}
            </div>

            {/* Audit compliance footer */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50/50 border border-amber-250 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Audit Compliance:</strong> Approving photos updates client visibility states instantly. Rejection events are registered in operator audit logs.
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
    </div>
  );
}
