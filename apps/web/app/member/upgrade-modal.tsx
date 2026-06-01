'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';

interface Plan {
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
}

export default function UpgradeModal({
  plan,
  onClose,
}: {
  plan: Plan | null;
  onClose: () => void;
}) {
  const memberRequest = useMemberRequest();
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!plan) {
    return null;
  }

  async function startCheckout() {
    if (!plan) {
      return;
    }

    setSubmitting(true);
    setMessage('');
    const result = await memberRequest('/api/me/subscription/checkout', {
      method: 'POST',
      body: {
        planCode: plan.code,
        ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
      },
    });
    setSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const data = result.data as { checkoutUrl?: string };
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#241c15]">Upgrade to {plan.name}</h2>
            <p className="mt-2 text-sm text-[#6f665b]">
              {plan.currency} ${(plan.priceCents / 100).toFixed(2)} per{' '}
              {plan.interval.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[#6f665b] hover:bg-[#f3eee5]"
            aria-label="Close upgrade modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-[#3d352d]">
          Coupon code
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            className="mt-2 w-full rounded-md border border-[#ded3c2] px-3 py-3 text-sm outline-none focus:border-[#b9821f]"
            placeholder="Optional"
          />
        </label>

        {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}

        <button
          type="button"
          onClick={() => {
            void startCheckout();
          }}
          disabled={submitting || plan.code === 'FREE'}
          className="mt-6 w-full rounded-md bg-[#241c15] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9b948c]"
        >
          {submitting ? 'Opening checkout...' : 'Continue to checkout'}
        </button>
      </section>
    </div>
  );
}
