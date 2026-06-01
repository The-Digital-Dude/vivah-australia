'use client';

import { useEffect, useState } from 'react';
import { CreditCard, FileText, Rocket } from 'lucide-react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';

interface SubscriptionOverview {
  plan?: {
    name: string;
    code: string;
    priceCents: number;
    currency: string;
    interval: string;
    limits: Record<string, number>;
  } | null;
  subscription?: {
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: Array<{ key: string; count: number }>;
}

interface Payment {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

export default function SubscriptionPage() {
  const memberRequest = useMemberRequest();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [subscriptionResult, paymentResult] = await Promise.all([
      memberRequest('/api/me/subscription'),
      memberRequest('/api/me/payments'),
    ]);
    if (subscriptionResult.ok) {
      setOverview(subscriptionResult.data as SubscriptionOverview);
    }
    if (paymentResult.ok) {
      const data = paymentResult.data as { payments?: Payment[] };
      setPayments(data.payments ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function activateBoost() {
    const result = await memberRequest('/api/me/boosts', {
      method: 'POST',
      body: { durationHours: 24 },
    });
    setMessage(result.message);
    if (result.ok) {
      await load();
    }
  }

  return (
    <MemberShell
      title="Subscription"
      subtitle="Manage your plan, usage, boosts, invoices, and payment history."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-[#e1d8c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-[#8b5e1b]" />
            <h2 className="text-2xl font-semibold text-[#241c15]">
              {overview?.plan?.name ?? 'Free'} membership
            </h2>
          </div>
          <p className="mt-3 text-sm text-[#6f665b]">
            Status: {overview?.subscription?.status ?? 'FREE'}.
            {overview?.subscription?.currentPeriodEnd
              ? ` Renews ${new Date(overview.subscription.currentPeriodEnd).toLocaleDateString()}.`
              : ''}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(overview?.plan?.limits ?? {}).map(([key, limit]) => {
              const used = overview?.usage.find((item) => item.key === key)?.count ?? 0;
              return (
                <div key={key} className="rounded-md bg-[#f8f5ef] p-4">
                  <p className="text-sm font-semibold text-[#241c15]">{key}</p>
                  <p className="mt-1 text-sm text-[#6f665b]">
                    {used} used / {limit === -1 ? 'Unlimited' : limit}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-[#e1d8c8] bg-white p-6">
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-[#8b5e1b]" />
            <h3 className="text-lg font-semibold text-[#241c15]">Profile boost</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6f665b]">
            Use one monthly boost to lift your approved profile for the next 24 hours.
          </p>
          <button
            type="button"
            onClick={() => {
              void activateBoost();
            }}
            className="mt-5 w-full rounded-md bg-[#241c15] px-4 py-3 text-sm font-semibold text-white"
          >
            Activate boost
          </button>
          {message ? <p className="mt-3 text-sm text-[#6f665b]">{message}</p> : null}
        </aside>
      </div>

      <section className="mt-6 rounded-lg border border-[#e1d8c8] bg-white p-6">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#8b5e1b]" />
          <h2 className="text-xl font-semibold text-[#241c15]">Payment history</h2>
        </div>
        <div className="mt-5 divide-y divide-[#eee6d8]">
          {payments.map((payment) => (
            <div key={payment.id} className="grid gap-2 py-4 sm:grid-cols-4">
              <span className="font-medium text-[#241c15]">{payment.description ?? 'Payment'}</span>
              <span>{payment.status}</span>
              <span>
                {payment.currency} ${(payment.amountCents / 100).toFixed(2)}
              </span>
              <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {!payments.length ? (
            <p className="py-4 text-sm text-[#6f665b]">No payments yet.</p>
          ) : null}
        </div>
      </section>
    </MemberShell>
  );
}
