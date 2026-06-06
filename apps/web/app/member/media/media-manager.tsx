'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { mediaSignUploadSchema, mediaUpdateSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

interface MediaItem {
  id: string;
  assetUrl: string;
  category: string;
  uploadStatus: string;
  visibility: string;
  approvalStatus: string;
  originalFilename: string;
  isPrimary: boolean;
  moderationReason?: string;
  mediaType?: string;
}

interface MediaListResponse {
  media: MediaItem[];
}

interface SignedUploadResponse {
  media: MediaItem;
  upload: {
    provider: 'cloudinary' | 'mock';
    url: string;
    fields: Record<string, string>;
  };
}

function dataAs<T>(data: unknown): T {
  return data as T;
}

function signedAssetUrl(response: SignedUploadResponse) {
  const publicId = response.upload.fields.public_id;
  return `http://localhost:4000/api/mock-storage/${publicId}`;
}

export default function MediaManager() {
  const memberRequest = useMemberRequest();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadMedia() {
    const result = await memberRequest('/api/me/media');
    if (result.ok) {
      setMedia(dataAs<MediaListResponse>(result.data).media);
    } else {
      setMessage(result.message);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const file = form.get('file');

    if (!(file instanceof File)) {
      setMessage('Choose a media file to upload.');
      setPending(false);
      return;
    }

    const payload = {
      category: form.get('category'),
      visibility: form.get('visibility'),
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    };
    const parsed = mediaSignUploadSchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const signed = await memberRequest('/api/me/media/sign-upload', {
      method: 'POST',
      body: parsed.data,
    });

    if (!signed.ok) {
      setMessage(signed.message);
      setPending(false);
      return;
    }

    const signedBody = dataAs<SignedUploadResponse>(signed.data);
    let assetUrl = signedAssetUrl(signedBody);
    let storageKey = signedBody.upload.fields.public_id;

    if (signedBody.upload.provider === 'cloudinary') {
      const cloudinaryForm = new FormData();
      Object.entries(signedBody.upload.fields).forEach(([key, value]) => {
        cloudinaryForm.append(key, value);
      });
      cloudinaryForm.append('file', file);
      const uploadResponse = await fetch(signedBody.upload.url, {
        method: 'POST',
        body: cloudinaryForm,
      });
      const uploadJson = (await uploadResponse.json()) as {
        secure_url?: string;
        public_id?: string;
        message?: string;
      };

      if (!uploadResponse.ok || !uploadJson.secure_url) {
        setMessage(uploadJson.message ?? 'Cloudinary upload failed.');
        setPending(false);
        return;
      }

      assetUrl = uploadJson.secure_url;
      storageKey = uploadJson.public_id ?? storageKey;
    }

    const completed = await memberRequest('/api/me/media/complete', {
      method: 'POST',
      body: {
        mediaId: signedBody.media.id,
        assetUrl,
        storageKey,
        bytes: file.size,
      },
    });

    setMessage(completed.message);
    setPending(false);
    event.currentTarget.reset();
    await loadMedia();
  }

  async function updateMedia(item: MediaItem, nextVisibility: string, isPrimary: boolean) {
    const parsed = mediaUpdateSchema.safeParse({
      visibility: nextVisibility,
      isPrimary,
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest(`/api/me/media/${item.id}`, {
      method: 'PATCH',
      body: parsed.data,
    });
    setMessage(result.message);
    await loadMedia();
  }

  async function getAccess(item: MediaItem) {
    const result = await memberRequest(`/api/me/media/${item.id}/access`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const body = dataAs<{ access: { url: string; expiresAt: string } }>(result.data);
    setMessage(
      `Signed access ready until ${new Date(body.access.expiresAt).toLocaleTimeString()}: ${body.access.url}`,
    );
  }

  return (
    <div className="grid gap-8">
      <form
        className="grid gap-5 rounded-[32px] border border-[#A10E4D]/10 bg-[linear-gradient(180deg,#FFF9F5_0%,#FFFFFF_100%)] p-6 shadow-[0_18px_45px_rgba(122,31,43,0.06)]"
        onSubmit={(event) => void upload(event)}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
            Photo manager
          </p>
          <h2 className="mt-3 font-playfair text-3xl font-semibold text-[#2F2F2F]">
            Curate the images members remember
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            Upload public, private, and profile photos while keeping approval status, primary
            images, and visibility choices easy to manage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Gallery
            <select
              name="category"
              className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
            >
              <option value="PROFILE_PHOTO">Profile photo</option>
              <option value="PUBLIC_GALLERY">Public gallery</option>
              <option value="PRIVATE_GALLERY">Private gallery</option>
              <option value="VIDEO_INTRO">Video introduction</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Visibility
            <select
              name="visibility"
              className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
            >
              <option value="PUBLIC">Public</option>
              <option value="MATCHES_ONLY">Matches only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Media file
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
              required
              className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-[26px] border-2 border-dashed border-[#A10E4D]/14 bg-white/80 p-5">
            <p className="text-sm font-semibold text-[#2F2F2F]">Upload guidance</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#6B7280]">
              <li>Use bright, recent solo photos for your main profile image.</li>
              <li>Keep private images for deeper trust once a conversation becomes serious.</li>
              <li>Uploads still require moderation approval before they become publicly visible.</li>
            </ul>
          </div>
          <div className="rounded-[26px] border border-[#D4A04C]/20 bg-[#FFF8EC] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B7832E]">
              Visibility note
            </p>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              Public images improve discovery, private images support trust after interest is
              exchanged, and your primary photo becomes the first impression used across the app.
            </p>
          </div>
        </div>

        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#A10E4D] px-5 text-sm font-bold text-white shadow-[0_18px_35px_rgba(161,14,77,0.18)] disabled:opacity-60 sm:w-auto"
          disabled={pending}
        >
          {pending ? 'Preparing upload...' : 'Upload for review'}
        </button>
      </form>

      {message ? (
        <p className="rounded-[24px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-4 text-sm text-[#7A1E3A]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {media.map((item) => (
          <article
            key={item.id}
            className="rounded-[28px] border border-[#A10E4D]/10 bg-white p-4 shadow-[0_18px_45px_rgba(122,31,43,0.05)]"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-[22px] bg-neutral-100 flex items-center justify-center">
              {item.mediaType === 'VIDEO' || item.category === 'VIDEO_INTRO' ? (
                <video
                  src={item.assetUrl}
                  controls
                  className="size-full object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.assetUrl}
                  alt={item.originalFilename}
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
              <span className="rounded-full bg-[#FFF0F3] px-3 py-1 text-[#7A1E3A]">
                {item.category}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
                {item.visibility}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
                {item.approvalStatus}
              </span>
              {item.isPrimary ? (
                <span className="rounded-full bg-[#FFF1D2] px-3 py-1 text-[#7A1E3A]">Primary</span>
              ) : null}
            </div>
            {item.moderationReason ? (
              <p className="mt-3 rounded-[18px] bg-red-50 px-3 py-2 text-sm text-red-700">
                {item.moderationReason}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                className="rounded-2xl border border-[#A10E4D]/15 px-3 py-2.5 text-sm font-semibold text-[#2F2F2F]"
                onClick={() => void updateMedia(item, item.visibility, true)}
              >
                Make primary
              </button>
              <button
                className="rounded-2xl border border-[#A10E4D]/15 px-3 py-2.5 text-sm font-semibold text-[#2F2F2F]"
                onClick={() =>
                  void updateMedia(
                    item,
                    item.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE',
                    item.isPrimary,
                  )
                }
              >
                Toggle privacy
              </button>
              <button
                className="rounded-2xl bg-[#A10E4D] px-3 py-2.5 text-sm font-semibold text-white"
                onClick={() => void getAccess(item)}
              >
                Signed access
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
