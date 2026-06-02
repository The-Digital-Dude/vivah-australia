'use client';

import { useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';
import { PremiumButton } from '@/app/components';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <section className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl border border-[#7A1F2B]/10 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F2B] bg-[#F8E8E8] px-2.5 py-1 rounded-full">
              Matrimonial Tier Upgrade
            </span>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mt-2.5">Upgrade to {plan.name}</h2>
            <p className="mt-1 text-sm font-semibold text-[#6B7280]">
              {plan.currency} ${(plan.priceCents / 100).toFixed(2)} per{' '}
              {plan.interval.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B] hover:bg-[#F8E8E8] transition duration-200"
            aria-label="Close upgrade modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="block text-sm font-semibold text-[#1A1A1A]">
          Coupon Code
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#7A1F2B]/15 bg-[#FCFAF7]/40 px-4 h-12 text-sm outline-none transition focus:bg-white focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
            placeholder="e.g. SAVE20 (Optional)"
          />
        </label>

        {message ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-[#7A1F2B]">
            {message}
          </p>
        ) : null}

        <div className="flex items-center gap-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 text-[#7A1F2B] text-xs">
          <Lock className="size-4 text-[#7A1F2B]/70 shrink-0" />
          <p className="leading-5">
            Checkout operates via fully secure Stripe processing. You can manage, cancel, or
            download receipts directly from your Billing dashboard.
          </p>
        </div>

        <PremiumButton
          onClick={() => {
            void startCheckout();
          }}
          disabled={submitting || plan.code === 'FREE'}
          className="w-full h-12"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin shrink-0" />
              Connecting secure Stripe checkout...
            </>
          ) : (
            'Continue to Checkout'
          )}
        </PremiumButton>
      </section>
    </div>
  );
}
