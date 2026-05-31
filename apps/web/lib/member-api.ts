'use client';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface MemberApiResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

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
