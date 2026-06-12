'use client';

import { useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';
import { PremiumButton } from '@/app/components';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

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
  displayIntervalLabel,
}: {
  plan: Plan | null;
  onClose: () => void;
  displayIntervalLabel?: string;
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
      <section className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl border border-[#A10E4D]/10 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A10E4D] bg-[#FFF0F3] px-2.5 py-1 rounded-full">
              Matrimonial Tier Upgrade
            </span>
            <h2 className="text-2xl font-bold text-[#2F2F2F] mt-2.5">Upgrade to {plan.name}</h2>
            <p className="mt-1 text-sm font-semibold text-[#6B7280]">
              {plan.currency} ${(plan.priceCents / 100).toFixed(2)} per{' '}
              {displayIntervalLabel ?? plan.interval.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#A10E4D]/15 bg-white p-2 text-[#A10E4D] hover:bg-[#FFF0F3] transition duration-200"
            aria-label="Close upgrade modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="block text-sm font-semibold text-[#2F2F2F]">
          Coupon Code
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/40 px-4 h-12 text-sm outline-none transition focus:bg-white focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
            placeholder="e.g. SAVE20 (Optional)"
          />
        </label>

        {message ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-[#A10E4D]">
            {message}
          </p>
        ) : null}

        <div className="flex items-center gap-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/50 text-[#A10E4D] text-xs">
          <Lock className="size-4 text-[#A10E4D]/70 shrink-0" />
          <p className="leading-5">
            Checkout operates via fully secure Stripe processing. You can manage, cancel, or
            download receipts directly from your Billing dashboard.
          </p>
        </div>

        <div className="space-y-3">
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
              'Pay with Card (Stripe)'
            )}
          </PremiumButton>

          <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test', currency: plan.currency }}>
            <PayPalButtons
              style={{ layout: 'horizontal', height: 48, color: 'gold' }}
              createOrder={async () => {
                const res = await memberRequest('/api/billing/paypal/create-order', {
                  method: 'POST',
                  body: { amount: plan.priceCents / 100, currency: plan.currency }
                });
                if (!res.ok) {
                  setMessage(res.message);
                  throw new Error(res.message);
                }
                const data = res.data as { id: string };
                return data.id;
              }}
              onApprove={async (data, actions) => {
                const res = await memberRequest('/api/billing/paypal/capture-order', {
                  method: 'POST',
                  body: { orderId: data.orderID }
                });
                if (!res.ok) {
                  setMessage(res.message);
                } else {
                  window.location.href = '/member/dashboard';
                }
              }}
            />
          </PayPalScriptProvider>
        </div>
      </section>
    </div>
  );
}
