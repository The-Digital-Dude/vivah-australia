import type { Storage } from '@google-cloud/storage';

// Direct-to-bucket uploads: the API mints a short-lived V4 signed PUT URL, the
// browser uploads straight to GCS, then calls the matching `/complete` endpoint.
// Public objects (profile photo, public/matches-only galleries) are made
// public-read so their URLs are permanent; private objects stay locked down and
// are served through short-lived signed read URLs.
//
// The @google-cloud/storage SDK is loaded lazily (dynamic import) so the heavy
// gRPC/protobuf dependency tree is only pulled in when GCS is actually
// configured — keeping local dev and the test runner light.

const UPLOAD_TTL_MS = 10 * 60 * 1000;
const READ_TTL_MS = 5 * 60 * 1000;

function envValue(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export interface GcsConfig {
  bucket: string;
  projectId?: string;
  publicBaseUrl: string;
}

export function gcsConfig(): GcsConfig | null {
  const bucket = envValue('GCS_BUCKET');
  if (!bucket) {
    return null;
  }

  const projectId = envValue('GCP_PROJECT_ID');
  const publicBaseUrl =
    envValue('GCS_PUBLIC_BASE_URL')?.replace(/\/+$/, '') ??
    `https://storage.googleapis.com/${bucket}`;

  return projectId ? { bucket, projectId, publicBaseUrl } : { bucket, publicBaseUrl };
}

export function isGcsConfigured() {
  return gcsConfig() !== null;
}

let cachedStorage: Storage | null = null;

async function getStorage(): Promise<Storage> {
  if (cachedStorage) {
    return cachedStorage;
  }

  const { Storage } = await import('@google-cloud/storage');
  const projectId = envValue('GCP_PROJECT_ID');
  const inlineJson = envValue('GCS_CREDENTIALS_JSON');
  const clientEmail = envValue('GCS_CLIENT_EMAIL');
  const privateKey = envValue('GCS_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (inlineJson) {
    cachedStorage = new Storage({
      ...(projectId ? { projectId } : {}),
      credentials: JSON.parse(inlineJson) as Record<string, unknown>,
    });
  } else if (clientEmail && privateKey) {
    cachedStorage = new Storage({
      ...(projectId ? { projectId } : {}),
      credentials: { client_email: clientEmail, private_key: privateKey },
    });
  } else {
    // Application Default Credentials: a GOOGLE_APPLICATION_CREDENTIALS key file,
    // or workload identity / impersonation when running on GCP. In the keyless
    // case, signing falls back to the IAM SignBlob API automatically.
    cachedStorage = new Storage(projectId ? { projectId } : {});
  }

  return cachedStorage;
}

async function bucketRef() {
  const config = gcsConfig();
  if (!config) {
    throw new Error('GCS is not configured');
  }
  const storage = await getStorage();
  return storage.bucket(config.bucket);
}

export function publicUrl(storageKey: string) {
  const config = gcsConfig();
  if (!config) {
    throw new Error('GCS is not configured');
  }
  const encodedKey = storageKey.split('/').map(encodeURIComponent).join('/');
  return `${config.publicBaseUrl}/${encodedKey}`;
}

export async function signedUploadUrl(
  storageKey: string,
  contentType: string,
  options: { publicRead?: boolean } = {},
) {
  // When publicRead is set, the object is made public-read at upload time via an
  // ACL header the client must echo. Used for surfaces with no completion step
  // (e.g. CMS cover images) where we can't call makeObjectPublic afterwards.
  const extensionHeaders = options.publicRead ? { 'x-goog-acl': 'public-read' } : undefined;
  const file = (await bucketRef()).file(storageKey);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + UPLOAD_TTL_MS,
    contentType,
    ...(extensionHeaders ? { extensionHeaders } : {}),
  });
  return url;
}

export async function signedReadUrl(storageKey: string, ttlMs: number = READ_TTL_MS) {
  const file = (await bucketRef()).file(storageKey);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + ttlMs,
  });
  return url;
}

export async function makeObjectPublic(storageKey: string) {
  await (await bucketRef()).file(storageKey).makePublic();
}

export async function makeObjectPrivate(storageKey: string) {
  // Drop the public-read grant; the owner service account retains access.
  await (await bucketRef()).file(storageKey).makePrivate();
}

export async function objectExists(storageKey: string) {
  const [exists] = await (await bucketRef()).file(storageKey).exists();
  return exists;
}

export async function deleteObject(storageKey: string) {
  await (await bucketRef()).file(storageKey).delete({ ignoreNotFound: true });
}
