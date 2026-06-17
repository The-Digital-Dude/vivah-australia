'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/auth-context';
import { useMemberRequest, type MemberApiResult } from '@/lib/member-api';

export interface EntitlementPlan {
  name: string;
  code: string;
  priceCents: number;
  currency: string;
  interval: string;
  limits: Record<string, number>;
}

export interface EntitlementSubscription {
  id: string;
  status: string;
  startsAt: string;
  endsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface EntitlementUsage {
  key: string;
  count: number;
  periodStart: string;
  periodEnd: string;
}

export interface EntitlementOverview {
  plan?: EntitlementPlan | null;
  subscription?: EntitlementSubscription | null;
  usage: EntitlementUsage[];
}

interface EntitlementState {
  cachedToken: string | null;
  data: EntitlementOverview | null;
  promise: Promise<EntitlementOverview | null> | null;
}

const entitlementCache: EntitlementState = {
  cachedToken: null,
  data: null,
  promise: null,
};

export function clearEntitlementCache() {
  entitlementCache.cachedToken = null;
  entitlementCache.data = null;
  entitlementCache.promise = null;
}

function resolveLimit(plan: EntitlementPlan | null | undefined, key: string) {
  const limits = plan?.limits ?? {};
  let limit = Number(limits[key] ?? 0);

  if (limit === 0 && key === 'profileBoostsMonthly' && limits.profileBoosts !== undefined) {
    limit = Number(limits.profileBoosts);
  }

  if (limit === 0 && key === 'monthlyInterests' && limits.interestsPerMonth !== undefined) {
    limit = Number(limits.interestsPerMonth);
  }

  return limit;
}

const MAX_TIMEOUT_MS = 2_147_000_000;

async function loadEntitlement(
  token: string,
  memberRequest: (path: string) => Promise<MemberApiResult>,
  force = false,
) {
  if (!force && entitlementCache.cachedToken === token && entitlementCache.data) {
    return entitlementCache.data;
  }

  if (!force && entitlementCache.cachedToken === token && entitlementCache.promise) {
    return entitlementCache.promise;
  }

  entitlementCache.cachedToken = token;
  entitlementCache.promise = memberRequest('/api/me/subscription').then((result) => {
    if (!result.ok) {
      throw new Error(result.message || 'Could not load subscription overview.');
    }

    const data = (result.data as EntitlementOverview | undefined) ?? {
      plan: null,
      subscription: null,
      usage: [],
    };
    entitlementCache.data = data;
    entitlementCache.promise = null;
    return data;
  }).catch((error) => {
    entitlementCache.promise = null;
    throw error;
  });

  return entitlementCache.promise;
}

export function useEntitlement() {
  const { token } = useAuth();
  const memberRequest = useMemberRequest();
  const [data, setData] = useState<EntitlementOverview | null>(
    token && entitlementCache.cachedToken === token ? entitlementCache.data : null,
  );
  const [loading, setLoading] = useState(Boolean(token) && !data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      clearEntitlementCache();
      setData(null);
      setError(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const next = await loadEntitlement(token, memberRequest, true);
      setData(next);
      setError(null);
      return next;
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Could not load subscription overview.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [memberRequest, token]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!token) {
        clearEntitlementCache();
        if (active) {
          setData(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (entitlementCache.cachedToken === token && entitlementCache.data) {
        if (active) {
          setData(entitlementCache.data);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        const next = await loadEntitlement(token, memberRequest);
        if (active) {
          setData(next);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load subscription overview.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [memberRequest, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh, token]);

  useEffect(() => {
    if (!token || !data?.subscription?.currentPeriodEnd) {
      return;
    }

    const periodEnd = new Date(data.subscription.currentPeriodEnd).getTime();
    if (Number.isNaN(periodEnd)) {
      return;
    }

    const delayMs = periodEnd - Date.now() + 15 * 1000;
    if (delayMs <= 0) {
      void refresh();
      return;
    }

    const timeout = window.setTimeout(() => {
      void refresh();
    }, Math.min(delayMs, MAX_TIMEOUT_MS));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [data?.subscription?.currentPeriodEnd, refresh, token]);

  const usageByKey = useMemo(() => {
    const usage = new Map<string, number>();
    for (const entry of data?.usage ?? []) {
      usage.set(entry.key, entry.count);
    }
    return usage;
  }, [data?.usage]);

  const isPaid = Boolean(data?.plan && data.plan.code !== 'FREE');

  const canUse = useCallback(
    (key: string, amount = 1) => {
      const limit = resolveLimit(data?.plan, key);
      if (limit === -1) {
        return true;
      }
      const used = usageByKey.get(key) ?? 0;
      return used + amount <= limit;
    },
    [data?.plan, usageByKey],
  );

  return {
    data,
    plan: data?.plan ?? null,
    subscription: data?.subscription ?? null,
    usage: data?.usage ?? [],
    isPaid,
    canUse,
    loading,
    error,
    refresh,
  };
}
