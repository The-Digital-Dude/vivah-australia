'use client';

import { useEffect, useState } from 'react';
import { mediaReviewSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

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

  async function review(item: ReviewMediaItem, approvalStatus: string) {
    const reason =
      approvalStatus === 'APPROVED'
        ? undefined
        : (window.prompt('Reason for member feedback') ?? undefined);
    const parsed = mediaReviewSchema.safeParse({ approvalStatus, reason });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest(`/api/admin/media/${item._id}/review`, {
      method: 'PATCH',
      body: parsed.data,
    });
    setMessage(result.message);
    await loadMedia();
  }

  return (
    <div className="min-h-screen bg-[#FFF8F1] px-5 py-8 text-[#232323]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#7A1E3A]/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#C94F7C]">Admin CRM</p>
            <h1 className="mt-2 text-4xl font-semibold">Media approval queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5E6470]">
              Review uploaded profile photos, public gallery media, and private gallery media before
              member-facing display.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Queue
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                void loadMedia(event.target.value);
              }}
              className="h-11 rounded-md border border-[#7A1E3A]/20 bg-white px-3"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_RESUBMISSION">Needs resubmission</option>
              <option value="">All</option>
            </select>
          </label>
        </div>

        {message ? (
          <p className="mt-5 rounded-md bg-white p-3 text-sm text-[#7A1E3A]">{message}</p>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {media.map((item) => (
            <article key={item._id} className="rounded-md border border-[#7A1E3A]/10 bg-white p-4">
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.assetUrl}
                  alt={item.originalFilename}
                  className="size-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h2 className="font-semibold">{item.originalFilename}</h2>
                <p className="mt-1 text-sm text-[#5E6470]">
                  {[item.profileId?.displayId, item.category, item.visibility]
                    .filter(Boolean)
                    .join(' | ')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                  <span className="rounded-md bg-[#FFF8F1] px-2 py-1 text-[#7A1E3A]">
                    {item.approvalStatus}
                  </span>
                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">
                    {item.uploadStatus}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button
                  className="rounded-md bg-[#1F9D68] px-3 py-2 text-sm font-bold text-white"
                  onClick={() => void review(item, 'APPROVED')}
                >
                  Approve
                </button>
                <button
                  className="rounded-md bg-[#F59E0B] px-3 py-2 text-sm font-bold text-white"
                  onClick={() => void review(item, 'NEEDS_RESUBMISSION')}
                >
                  Resubmit
                </button>
                <button
                  className="rounded-md bg-[#DC2626] px-3 py-2 text-sm font-bold text-white"
                  onClick={() => void review(item, 'REJECTED')}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
