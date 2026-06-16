'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { mediaSignUploadSchema, mediaUpdateSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

interface MediaItem {
  id: string;
  assetUrl: string;
  thumbnailUrl?: string;
  videoPosterUrl?: string;
  category: string;
  uploadStatus: string;
  visibility: string;
  approvalStatus: string;
  originalFilename: string;
  isPrimary: boolean;
  moderationReason?: string;
  mediaType?: string;
  durationSeconds?: number;
}

interface MediaListResponse {
  media: MediaItem[];
}

interface SignedUploadResponse {
  media: MediaItem;
  upload: {
    provider: 'cloudinary' | 'gcs';
    method: 'POST' | 'PUT';
    url: string;
    expiresAt: string;
    fields: Record<string, string>;
  };
}

function dataAs<T>(data: unknown): T {
  return data as T;
}

function previewAssetUrl(item: MediaItem) {
  if (item.mediaType === 'VIDEO' || item.category === 'VIDEO_INTRO') {
    return item.videoPosterUrl ?? item.thumbnailUrl ?? item.assetUrl;
  }

  return item.thumbnailUrl ?? item.assetUrl;
}

async function getVideoDurationSeconds(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const durationSeconds = await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error('Could not read video duration'));
      video.src = objectUrl;
    });

    return Math.ceil(durationSeconds);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
    let assetUrl = `http://localhost:4000/api/mock-gcs-storage/${signedBody.upload.fields.storageKey}`;
    let storageKey = signedBody.upload.fields.storageKey;
    let durationSeconds: number | undefined;

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
    } else if (signedBody.upload.provider === 'gcs') {
      const uploadResponse = await fetch(signedBody.upload.url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        setMessage('Local upload failed.');
        setPending(false);
        return;
      }

      assetUrl = signedBody.upload.url.split('?')[0] ?? assetUrl;
    }

    if (parsed.data.category === 'VIDEO_INTRO') {
      try {
        durationSeconds = await getVideoDurationSeconds(file);
      } catch {
        setMessage('Could not read the selected video duration.');
        setPending(false);
        return;
      }
    }

    const completed = await memberRequest('/api/me/media/complete', {
      method: 'POST',
      body: {
        mediaId: signedBody.media.id,
        assetUrl,
        storageKey,
        bytes: file.size,
        durationSeconds,
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
    <div className="grid gap-5">
      <form
        className="rounded-2xl border border-[#A10E4D]/10 bg-white p-4"
        onSubmit={(event) => void upload(event)}
      >
        <p className="mb-4 text-sm font-bold text-[#2F2F2F]">Upload photo or video</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="grid gap-1.5 text-xs font-semibold text-[#6B7280]">
            Gallery
            <select
              name="category"
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-[#FFF9F5] px-3 text-sm text-[#2F2F2F] outline-none focus:border-[#A10E4D]"
            >
              <option value="PROFILE_PHOTO">Profile photo</option>
              <option value="PUBLIC_GALLERY">Public gallery</option>
              <option value="PRIVATE_GALLERY">Private gallery</option>
              <option value="VIDEO_INTRO">Video intro</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#6B7280]">
            Visibility
            <select
              name="visibility"
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-[#FFF9F5] px-3 text-sm text-[#2F2F2F] outline-none focus:border-[#A10E4D]"
            >
              <option value="PUBLIC">Public</option>
              <option value="MATCHES_ONLY">Matches only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#6B7280]">
            File
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
              required
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-[#FFF9F5] px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              className="h-10 rounded-xl bg-[#A10E4D] px-4 text-sm font-bold text-white disabled:opacity-60 whitespace-nowrap"
              disabled={pending}
            >
              {pending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">Uploads require moderation approval before becoming visible.</p>
      </form>

      {message ? (
        <p className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm text-[#7A1E3A]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#A10E4D]/10 bg-white overflow-hidden"
          >
            <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center">
              {item.mediaType === 'VIDEO' || item.category === 'VIDEO_INTRO' ? (
                <video
                  src={item.assetUrl}
                  poster={item.videoPosterUrl ?? item.thumbnailUrl ?? item.assetUrl}
                  controls
                  className="size-full object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewAssetUrl(item)} alt={item.originalFilename} className="size-full object-cover" />
              )}
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-[#FFF0F3] px-2 py-0.5 text-[#7A1E3A]">{item.category.replaceAll('_', ' ')}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">{item.visibility}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">{item.approvalStatus}</span>
                {item.isPrimary && <span className="rounded-full bg-[#FFF1D2] px-2 py-0.5 text-[#7A1E3A]">Primary</span>}
              </div>
              {item.moderationReason && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">{item.moderationReason}</p>
              )}
              <div className="mt-2 flex gap-1.5">
                <button className="flex-1 rounded-xl border border-[#A10E4D]/15 py-2 text-xs font-semibold text-[#2F2F2F] transition hover:bg-[#FFF9F5]" onClick={() => void updateMedia(item, item.visibility, true)}>
                  Set primary
                </button>
                <button className="flex-1 rounded-xl border border-[#A10E4D]/15 py-2 text-xs font-semibold text-[#2F2F2F] transition hover:bg-[#FFF9F5]" onClick={() => void updateMedia(item, item.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE', item.isPrimary)}>
                  Toggle privacy
                </button>
                <button className="rounded-xl bg-[#A10E4D] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#890B40]" onClick={() => void getAccess(item)}>
                  Access
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
