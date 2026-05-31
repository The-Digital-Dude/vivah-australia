'use client';

const authApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface AuthApiResult {
  ok: boolean;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    [key: string]: unknown;
  };
}

export async function postAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthApiResult> {
  const response = await fetch(`${authApiBaseUrl}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 204) {
    return { ok: true, message: 'Done', data: {} };
  }

  const data = (await response.json()) as {
    message?: string;
    data?: { accessToken?: string; refreshToken?: string; [key: string]: unknown };
    [key: string]: unknown;
  };

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Done' : 'Request failed'),
    data: data.data ?? data,
  };
}
