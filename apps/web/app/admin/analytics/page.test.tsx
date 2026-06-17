import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminAnalyticsPage from './page';

const memberRequestMock = vi.fn();
const fetchMock = vi.fn();
const createObjectUrlMock = vi.fn(() => 'blob:analytics-export');
const revokeObjectUrlMock = vi.fn();
const clickMock = vi.fn();

vi.mock('recharts', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="mock-responsive-container">{children}</div>
    ),
  };
});

vi.mock('@/app/auth-context', () => ({
  useAuth: () => ({
    token: 'admin-token',
  }),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

vi.mock('../admin-shell', () => ({
  default: ({
    children,
    title,
    subtitle,
  }: {
    children: ReactNode;
    title: string;
    subtitle: string;
  }) => (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </section>
  ),
}));

vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe('AdminAnalyticsPage charts', () => {
  beforeEach(() => {
    const originalCreateElement = document.createElement.bind(document);
    memberRequestMock.mockReset();
    fetchMock.mockReset();
    createObjectUrlMock.mockReset();
    createObjectUrlMock.mockReturnValue('blob:analytics-export');
    revokeObjectUrlMock.mockReset();
    clickMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });
    const createElementMock: typeof document.createElement = (
      tagName: string,
      _options?: ElementCreationOptions,
    ) => {
      if (tagName === 'a') {
        const link = originalCreateElement('a');
        link.click = clickMock;
        return link;
      }

      return originalCreateElement(tagName);
    };

    vi.spyOn(document, 'createElement').mockImplementation(createElementMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders chart sections with a single messaging data point without crashing', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        generatedAt: '2026-06-17T00:00:00.000Z',
        range: { from: '2026-06-01T00:00:00.000Z', to: '2026-06-17T23:59:59.999Z' },
        monthlyRevenueCents: 450000,
        usersByRole: [
          { _id: 'USER', count: 120 },
          { _id: 'ADMIN', count: 3 },
        ],
        usersByStatus: [{ _id: 'ACTIVE', count: 111 }],
        profilesByStatus: [{ _id: 'APPROVED', count: 78 }],
        reportsByStatus: [{ _id: 'OPEN', count: 5 }],
        paymentsByStatus: [{ _id: 'SUCCEEDED', count: 12, totalCents: 450000 }],
        subscriptionsByStatus: [{ _id: 'ACTIVE', count: 34 }],
        verificationByStatus: [{ _id: 'APPROVED', count: 18 }],
        matchInterestStats: [{ _id: 'ACCEPTED', count: 14 }],
        messagingActivity: [{ _id: '2026-06-14', count: 9 }],
        communityActivity: [
          { _id: 'POSTS', count: 7 },
          { _id: 'COMMENTS', count: 16 },
        ],
      },
    });

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/analytics/summary?'),
      );
    });

    expect(screen.getByText('Reporting and analytics')).toBeTruthy();
    expect(screen.getByText('Users by role')).toBeTruthy();
    expect(screen.getByText('Messaging activity by day')).toBeTruthy();
    expect(screen.getByText('Community activity')).toBeTruthy();
    expect(screen.getByTestId('analytics-pie-chart')).toBeTruthy();
    expect(screen.getAllByTestId('analytics-bar-chart').length).toBeGreaterThan(0);
    expect(screen.getByTestId('analytics-line-chart')).toBeTruthy();
    expect(screen.getByTestId('analytics-community-cards')).toBeTruthy();
    expect(screen.getByText('POSTS')).toBeTruthy();
    expect(screen.getByText('COMMENTS')).toBeTruthy();
    expect(screen.getByText('ACCEPTED')).toBeTruthy();
  });

  it('shows empty states for chart sections with no data', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        generatedAt: '2026-06-17T00:00:00.000Z',
        range: { from: '2026-06-01T00:00:00.000Z', to: '2026-06-17T23:59:59.999Z' },
        monthlyRevenueCents: 0,
        usersByRole: [],
        usersByStatus: [],
        profilesByStatus: [],
        reportsByStatus: [],
        paymentsByStatus: [],
        subscriptionsByStatus: [],
        verificationByStatus: [],
        matchInterestStats: [],
        messagingActivity: [],
        communityActivity: [],
      },
    });

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('analytics-empty-state').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Monthly revenue')).toBeTruthy();
    expect(screen.getByText('$0.00')).toBeTruthy();
  });

  it('applies date filters and exports CSV with the same range', async () => {
    memberRequestMock.mockResolvedValue({
      ok: true,
      message: '',
      data: {
        generatedAt: '2026-06-17T00:00:00.000Z',
        range: { from: '2026-06-01T00:00:00.000Z', to: '2026-06-17T23:59:59.999Z' },
        monthlyRevenueCents: 0,
        usersByRole: [],
        usersByStatus: [],
        profilesByStatus: [],
        reportsByStatus: [],
        paymentsByStatus: [],
        subscriptionsByStatus: [],
        verificationByStatus: [],
        matchInterestStats: [],
        messagingActivity: [],
        communityActivity: [],
      },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['section,key,count,totalCents'])),
    });

    render(<AdminAnalyticsPage />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-06-05' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenLastCalledWith(
        '/api/admin/analytics/summary?from=2026-06-05&to=2026-06-15',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/analytics/export.csv?from=2026-06-05&to=2026-06-15',
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token' },
        }),
      );
    });

    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:analytics-export');
  });
});
