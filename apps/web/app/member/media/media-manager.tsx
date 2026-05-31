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
      setMessage('Choose an image file to upload.');
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
        className="grid gap-4 rounded-md border border-[#7A1E3A]/10 bg-[#FFF8F1] p-5"
        onSubmit={(event) => void upload(event)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Gallery
            <select name="category" className="h-11 rounded-md border border-[#7A1E3A]/20 px-3">
              <option value="PROFILE_PHOTO">Profile photo</option>
              <option value="PUBLIC_GALLERY">Public gallery</option>
              <option value="PRIVATE_GALLERY">Private gallery</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Visibility
            <select name="visibility" className="h-11 rounded-md border border-[#7A1E3A]/20 px-3">
              <option value="PUBLIC">Public</option>
              <option value="MATCHES_ONLY">Matches only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#232323]">
            Photo
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="h-11 rounded-md border border-[#7A1E3A]/20 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-sm text-[#5E6470]">
          JPEG, PNG, or WebP only. Maximum size is 10MB. Uploads require admin approval before
          public display.
        </p>
        <button
          className="h-11 rounded-md bg-[#7A1E3A] px-5 text-sm font-bold text-white disabled:opacity-60"
          disabled={pending}
        >
          {pending ? 'Preparing upload...' : 'Upload for review'}
        </button>
      </form>

      {message ? (
        <p className="rounded-md bg-[#FDECEF] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {media.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.assetUrl}
                alt={item.originalFilename}
                className="size-full object-cover"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
              <span className="rounded-md bg-[#FFF8F1] px-2 py-1 text-[#7A1E3A]">
                {item.category}
              </span>
              <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">
                {item.visibility}
              </span>
              <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">
                {item.approvalStatus}
              </span>
              {item.isPrimary ? (
                <span className="rounded-md bg-[#D6A84F]/20 px-2 py-1 text-[#7A1E3A]">Primary</span>
              ) : null}
            </div>
            {item.moderationReason ? (
              <p className="mt-3 text-sm text-red-700">{item.moderationReason}</p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold"
                onClick={() => void updateMedia(item, item.visibility, true)}
              >
                Make primary
              </button>
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold"
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
                className="rounded-md bg-[#7A1E3A] px-3 py-2 text-sm font-semibold text-white"
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
