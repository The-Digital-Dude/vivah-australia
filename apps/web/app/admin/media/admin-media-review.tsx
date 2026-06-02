'use client';

import { useEffect, useState } from 'react';
import { mediaReviewSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';
import { AlertCircle, ShieldAlert, Check, X, ClipboardSignature } from 'lucide-react';

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
    
    if (result.ok) {
      await loadMedia();
    }
  }

  return (
    <div className="space-y-6">
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION', ''].map((option) => (
            <button
              key={option}
              onClick={() => {
                setStatus(option);
                void loadMedia(option);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                status === option
                  ? 'bg-[#7A1F2B] text-white shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {option === '' ? 'ALL MEDIA' : option.replace('_', ' ')}
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

      {/* MEDIA GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => (
          <article
            key={item._id}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow"
          >
            {/* Image container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 border-b border-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.assetUrl}
                alt={item.originalFilename}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
              <div className="absolute left-3 top-3">
                <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                  {item.visibility}
                </span>
              </div>
            </div>

            {/* Info details */}
            <div className="p-5 space-y-3.5">
              <div>
                <h3 className="text-sm font-bold text-neutral-800 truncate" title={item.originalFilename}>
                  {item.originalFilename}
                </h3>
                <p className="text-xs text-neutral-450 mt-1">
                  Owner: <span className="font-semibold text-neutral-700">{item.profileId?.displayId ?? 'Unlinked'}</span>
                </p>
                <p className="text-[11px] text-neutral-400">
                  Category: {item.category}
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
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => setReviewItem({ item, targetStatus: 'APPROVED' })}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setReviewItem({ item, targetStatus: 'NEEDS_RESUBMISSION' })}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-neutral-250 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                    type="button"
                  >
                    <span>Resubmit</span>
                  </button>
                  <button
                    onClick={() => setReviewItem({ item, targetStatus: 'REJECTED' })}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-200 text-rose-700 px-3 text-xs font-bold hover:bg-rose-50 transition"
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
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white">
            <span className="text-3xl">📸</span>
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Media Queue Empty</h3>
            <p className="mt-1 text-xs text-neutral-450">No uploads currently require moderation.</p>
          </div>
        )}
      </div>

      {/* FORM DIALOG / MODAL (No window.prompt anymore!) */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setReviewItem(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Submit Media Moderation
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Select details for updating asset moderation to{' '}
              <strong className="text-[#7A1F2B]">{reviewItem.targetStatus}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 border border-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reviewItem.item.assetUrl}
                  alt={reviewItem.item.originalFilename}
                  className="h-full w-full object-cover"
                />
              </div>

              {reviewItem.targetStatus !== 'APPROVED' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Reason for member feedback *
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why this image was rejected or needs changes..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#7A1F2B] min-h-[80px]"
                  />
                </div>
              )}
            </div>

            {/* Audit / accountability warning */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Moderation Standard:</strong> Your decision will update the client profile visibility. This event will be recorded in systemic audit logs.
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
    </div>
  );
}
