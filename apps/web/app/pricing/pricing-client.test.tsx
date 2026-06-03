import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PricingClient from './pricing-client';

const memberRequestMock = vi.fn();
const trackMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => {
          const {
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            whileHover: _whileHover,
            whileInView: _whileInView,
            viewport: _viewport,
            variants: _variants,
            ...domProps
          } = props;
          return createElement(tag, domProps, children);
        },
    },
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/components', () => ({
  FAQAccordion: ({ items }: { items: Array<{ question: string; answer: string }> }) => (
    <div>
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  ),
  PremiumButton: ({
    children,
    href,
    onClick,
    type = 'button',
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) =>
    href ? (
      <a href={href}>{children}</a>
    ) : (
      <button type={type} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  PublicFooter: () => <footer>Footer</footer>,
  PublicHeader: () => <header>Header</header>,
}));

vi.mock('@/app/components/ui/badge', () => ({
  Badge: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/lib/analytics', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

vi.mock('@/lib/member-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/member-api')>('@/lib/member-api');
  return {
    ...actual,
    useMemberRequest: () => memberRequestMock,
  };
});

const plansResponse = {
  plans: [
    {
      id: 'free',
      code: 'FREE',
      name: 'Free',
      description: 'Browse',
      priceCents: 0,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: {},
    },
    {
      id: 'premium-monthly',
      code: 'PREMIUM_MONTHLY',
      name: 'Premium',
      description: 'Premium',
      priceCents: 4900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: {},
    },
    {
      id: 'gold-monthly',
      code: 'GOLD_MONTHLY',
      name: 'Gold',
      description: 'Gold',
      priceCents: 7900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: {},
    },
    {
      id: 'platinum-monthly',
      code: 'PLATINUM_MONTHLY',
      name: 'Platinum',
      description: 'Platinum',
      priceCents: 12900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: {},
    },
  ],
};

describe('PricingClient checkout flow', () => {
  beforeEach(() => {
    memberRequestMock.mockReset();
    trackMock.mockReset();
    fetchMock.mockReset();

    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      json: async () => plansResponse,
    });

    memberRequestMock.mockImplementation((url: string) => {
      if (url === '/api/me/subscription/checkout') {
        return Promise.resolve({
          ok: true,
          message: '',
          data: { checkoutUrl: 'https://checkout.stripe.test/session_123' },
        });
      }

      return Promise.resolve({
        ok: false,
        message: `Unexpected request: ${url}`,
      });
    });

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    });
  });

  it('opens the upgrade modal from a paid plan and posts the checkout request', async () => {
    render(<PricingClient />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Choose Gold' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Choose Gold' }));

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Gold')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Checkout' }));

    await waitFor(() => {
      expect(memberRequestMock).toHaveBeenCalledWith('/api/me/subscription/checkout', {
        method: 'POST',
        body: {
          planCode: 'GOLD_MONTHLY',
        },
      });
    });

    expect(trackMock).toHaveBeenCalledWith(
      'membership_checkout_started',
      expect.objectContaining({
        tier: 'GOLD',
        billing: 'MONTHLY',
        price_cents: 7900,
      }),
    );
  });
});
