import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearEntitlementCache, useEntitlement } from './use-entitlement';

const memberRequestMock = vi.fn();

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    token: 'member-token',
  }),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

function Harness() {
  const entitlement = useEntitlement();

  return (
    <div>
      <p>plan:{entitlement.plan?.code ?? 'NONE'}</p>
      <p>paid:{String(entitlement.isPaid)}</p>
      <p>boost:{String(entitlement.canUse('profileBoostsMonthly'))}</p>
      <p>interests:{String(entitlement.canUse('monthlyInterests'))}</p>
      <p>loading:{String(entitlement.loading)}</p>
      <p>error:{entitlement.error ?? 'none'}</p>
    </div>
  );
}

describe('useEntitlement', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    clearEntitlementCache();
    vi.useRealTimers();
  });

  it('returns paid state and available usage for a paid plan', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        plan: {
          code: 'GOLD',
          name: 'Gold',
          priceCents: 9900,
          currency: 'AUD',
          interval: 'MONTH',
          limits: {
            profileBoostsMonthly: 2,
            monthlyInterests: 50,
          },
        },
        subscription: {
          id: 'sub-1',
          status: 'ACTIVE',
          startsAt: '2026-06-01T00:00:00.000Z',
          currentPeriodEnd: '2026-07-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
        },
        usage: [{ key: 'profileBoostsMonthly', count: 1, periodStart: '2026-06-01T00:00:00.000Z', periodEnd: '2026-07-01T00:00:00.000Z' }],
      },
    });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('plan:GOLD')).toBeTruthy();
    });

    expect(screen.getByText('paid:true')).toBeTruthy();
    expect(screen.getByText('boost:true')).toBeTruthy();
    expect(screen.getByText('interests:true')).toBeTruthy();
    expect(memberRequestMock).toHaveBeenCalledWith('/api/me/subscription');
  });

  it('returns free state for a free plan', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        plan: {
          code: 'FREE',
          name: 'Free',
          priceCents: 0,
          currency: 'AUD',
          interval: 'MONTH',
          limits: {
            profileBoostsMonthly: 0,
            monthlyInterests: 0,
          },
        },
        subscription: null,
        usage: [],
      },
    });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('plan:FREE')).toBeTruthy();
    });

    expect(screen.getByText('paid:false')).toBeTruthy();
    expect(screen.getByText('boost:false')).toBeTruthy();
    expect(screen.getByText('interests:false')).toBeTruthy();
  });

  it('returns false from canUse when usage has hit the limit', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        plan: {
          code: 'PREMIUM',
          name: 'Premium',
          priceCents: 4900,
          currency: 'AUD',
          interval: 'MONTH',
          limits: {
            profileBoostsMonthly: 1,
            monthlyInterests: 5,
          },
        },
        subscription: {
          id: 'sub-2',
          status: 'ACTIVE',
          startsAt: '2026-06-01T00:00:00.000Z',
          currentPeriodEnd: '2026-07-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
        },
        usage: [{ key: 'profileBoostsMonthly', count: 1, periodStart: '2026-06-01T00:00:00.000Z', periodEnd: '2026-07-01T00:00:00.000Z' }],
      },
    });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('plan:PREMIUM')).toBeTruthy();
    });

    expect(screen.getByText('paid:true')).toBeTruthy();
    expect(screen.getByText('boost:false')).toBeTruthy();
    expect(screen.getByText('interests:true')).toBeTruthy();
  });

  it('refreshes entitlement data when the window regains focus', async () => {
    memberRequestMock
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'GOLD',
            name: 'Gold',
            priceCents: 9900,
            currency: 'AUD',
            interval: 'MONTH',
          limits: {
            profileBoostsMonthly: 2,
            monthlyInterests: 50,
          },
        },
        subscription: {
          id: 'sub-1',
          status: 'ACTIVE',
          startsAt: '2026-06-01T00:00:00.000Z',
          currentPeriodEnd: '2026-07-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
        },
        usage: [],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'FREE',
            name: 'Free',
            priceCents: 0,
            currency: 'AUD',
            interval: 'MONTH',
            limits: {
              profileBoostsMonthly: 0,
              monthlyInterests: 0,
            },
          },
          subscription: null,
          usage: [],
        },
      });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('plan:GOLD')).toBeTruthy();
    });

    window.dispatchEvent(new Event('focus'));

    await waitFor(() => {
      expect(screen.getByText('plan:FREE')).toBeTruthy();
    });

    expect(memberRequestMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes entitlement data when the document becomes visible again', async () => {
    memberRequestMock
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'PREMIUM',
            name: 'Premium',
            priceCents: 4900,
            currency: 'AUD',
            interval: 'MONTH',
            limits: {
              profileBoostsMonthly: 1,
              monthlyInterests: 25,
            },
          },
          subscription: {
            id: 'sub-3',
            status: 'ACTIVE',
            startsAt: '2026-06-01T00:00:00.000Z',
            currentPeriodEnd: '2026-07-01T00:00:00.000Z',
            cancelAtPeriodEnd: false,
          },
          usage: [],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'FREE',
            name: 'Free',
            priceCents: 0,
            currency: 'AUD',
            interval: 'MONTH',
            limits: {
              profileBoostsMonthly: 0,
              monthlyInterests: 0,
            },
          },
          subscription: null,
          usage: [],
        },
      });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('plan:PREMIUM')).toBeTruthy();
    });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(screen.getByText('plan:FREE')).toBeTruthy();
    });

    expect(memberRequestMock).toHaveBeenCalledTimes(2);
  });

  it('revalidates shortly after currentPeriodEnd passes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T10:00:00.000Z'));

    memberRequestMock
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'GOLD',
            name: 'Gold',
            priceCents: 9900,
            currency: 'AUD',
            interval: 'MONTH',
            limits: {
              profileBoostsMonthly: 2,
              monthlyInterests: 50,
            },
          },
          subscription: {
            id: 'sub-expiring',
            status: 'ACTIVE',
            startsAt: '2026-06-01T00:00:00.000Z',
            currentPeriodEnd: '2026-06-18T10:00:05.000Z',
            cancelAtPeriodEnd: false,
          },
          usage: [],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        message: '',
        data: {
          plan: {
            code: 'FREE',
            name: 'Free',
            priceCents: 0,
            currency: 'AUD',
            interval: 'MONTH',
            limits: {
              profileBoostsMonthly: 0,
              monthlyInterests: 0,
            },
          },
          subscription: null,
          usage: [],
        },
      });

    await act(async () => {
      render(<Harness />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('plan:GOLD')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('plan:FREE')).toBeTruthy();
    expect(memberRequestMock).toHaveBeenCalledTimes(2);
  });
});
