'use client';

import { useCallback } from 'react';
import { useAuth } from '@/app/auth-context';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface MemberApiResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

export function useMemberRequest() {
  const { refreshAccessToken, token } = useAuth();

  return useCallback(
    async function memberRequest(
      path: string,
      options: {
        method?: string;
        body?: Record<string, unknown>;
      } = {},
    ): Promise<MemberApiResult> {
      if (!token) {
        return {
          ok: false,
          message: 'Not authenticated. Please log in.',
        };
      }

      const sendRequest = (accessToken: string) =>
        fetch(`${apiBaseUrl}${path}`, {
          method: options.method ?? 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        });

      let response = await sendRequest(token);

      if (response.status === 401) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          response = await sendRequest(refreshedToken);
        }
      }

      const data = response.status === 204 ? {} : ((await response.json()) as { message?: string });

      return {
        ok: response.ok,
        message: data.message ?? (response.ok ? 'Saved' : 'Request failed'),
        data,
      };
    },
    [refreshAccessToken, token],
  );
}

export async function logoutRefreshToken(refreshToken: string) {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });
}

// Legacy export for backward compatibility (without hook - for non-client components)
export async function memberRequest(
  path: string,
  options: {
    token?: string;
    method?: string;
    body?: Record<string, unknown>;
  } = {},
): Promise<MemberApiResult> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    credentials: 'include',
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const data = response.status === 204 ? {} : ((await response.json()) as { message?: string });

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Saved' : 'Request failed'),
    data,
  };
}

export function csvList(value: FormDataEntryValue | null) {
  return typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return Number(value);
}

export function formString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function validationMessage(issues: Array<{ message: string }>) {
  return issues[0]?.message ?? 'Please check the highlighted details and try again.';
}
