'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  FileText,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';
import UpgradeModal from '../upgrade-modal';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Plan {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  limits: Record<string, number>;
}

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
    endsAt?: string;
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

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  PREMIUM: [
    'Unlock direct messaging with accepted matches.',
    'Use deeper filters for community, lifestyle, and location.',
  ],
  GOLD: [
    'Appear more often when members are actively browsing.',
    'Get stronger response momentum with more monthly reach.',
  ],
  PLATINUM: [
    'Prioritise visibility with the strongest discovery support.',
    'Receive the fastest help for profile review and trust signals.',
  ],
};

const USAGE_KEY_LABELS: Record<string, string> = {
  monthlyInterests: 'Interests sent',
  profileBoostsMonthly: 'Profile boosts',
  advancedFilters: 'Advanced filters',
  photoRequests: 'Photo requests',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
  TRIALING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Trial' },
  PAST_DUE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Past due' },
  CANCELED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', label: 'Cancelled' },
  FREE: { bg: 'bg-[#f8f5ef]', text: 'text-[#6f665b]', dot: 'bg-[#c5beb2]', label: 'Free' },
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  SUCCEEDED: 'text-emerald-600 bg-emerald-50',
  PENDING: 'text-amber-600 bg-amber-50',
  FAILED: 'text-red-600 bg-red-50',
  REFUNDED: 'text-[#6f665b] bg-[#f5f0e8]',
  PARTIALLY_REFUNDED: 'text-[#8b5e1b] bg-[#fdf7ec]',
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-[#8b5e1b]';

  return (
    <div className="rounded-xl border border-[#ede7da] bg-[#faf7f2] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#241c15]">{label}</p>
        <p className="text-xs font-medium text-[#6f665b]">
          {used}{unlimited ? '' : ` / ${limit}`}
          {unlimited && <span className="ml-1 text-emerald-600 font-semibold">Unlimited</span>}
        </p>
      </div>
      {!unlimited && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e8e0d4]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  const memberRequest = useMemberRequest();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(true);
  const [boostLoading, setBoostLoading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  async function load() {
    setLoading(true);
    const [subscriptionResult, paymentResult, plansResponse] = await Promise.all([
      memberRequest('/api/me/subscription'),
      memberRequest('/api/me/payments'),
      fetch(`${apiBaseUrl}/api/plans`, { cache: 'no-store' }),
    ]);
    if (subscriptionResult.ok) {
      setOverview(subscriptionResult.data as SubscriptionOverview);
    }
    if (paymentResult.ok) {
      const data = paymentResult.data as { payments?: Payment[] };
      setPayments(data.payments ?? []);
    }
    if (plansResponse.ok) {
      const data = (await plansResponse.json()) as { plans?: Plan[] };
      setPlans((data.plans ?? []).filter(Boolean));
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function activateBoost() {
    setBoostLoading(true);
    const result = await memberRequest('/api/me/boosts', {
      method: 'POST',
      body: { durationHours: 24 },
    });
    setMessage(result.message ?? (result.ok ? 'Boost activated!' : 'Could not activate boost.'));
    setMessageType(result.ok ? 'success' : 'error');
    if (result.ok) await load();
    setBoostLoading(false);
  }

  async function confirmCancel() {
    setCancelLoading(true);
    const result = await memberRequest('/api/me/subscription', { method: 'DELETE' });
    if (result.ok) {
      const data = result.data as { message?: string };
      setMessage(data.message ?? 'Subscription cancelled.');
      setMessageType('info');
      await load();
    } else {
      setMessage(result.message ?? 'Could not cancel subscription.');
      setMessageType('error');
    }
    setCancelLoading(false);
    setCancelDialog(false);
  }

  const status = overview?.subscription?.status ?? 'FREE';
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES['FREE']!;
  const planName = overview?.plan?.name ?? 'Free';
  const isFree = !overview?.plan || overview.plan.code === 'FREE';
  const isPaid = !isFree;
  const cancelAtPeriodEnd = overview?.subscription?.cancelAtPeriodEnd === true;
  const periodEnd = overview?.subscription?.currentPeriodEnd;
  const limits = overview?.plan?.limits ?? {};
  const availablePlans = plans
    .filter((plan) => plan.code !== 'FREE')
    .sort((left, right) => left.priceCents - right.priceCents);

  function scrollToPlans() {
    document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <MemberShell
      title="Membership"
      subtitle="Manage your plan, usage, boosts, and billing history."
    >
      {/* Cancel dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e0d4] bg-white p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-[#241c15]">Cancel subscription?</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6f665b]">
              {periodEnd
                ? `Your access will remain active until ${new Date(periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. After that, your account will revert to the free plan.`
                : 'Your subscription will be cancelled and your account will revert to the free plan.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelDialog(false)}
                className="flex-1 rounded-xl border border-[#e1d8c8] px-4 py-3 text-sm font-semibold text-[#241c15] hover:bg-[#f8f5ef] transition"
              >
                Keep my plan
              </button>
              <button
                type="button"
                onClick={() => void confirmCancel()}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        displayIntervalLabel={
          selectedPlan?.interval === 'YEAR'
            ? 'year'
            : selectedPlan?.code.includes('QUARTER')
              ? 'quarter'
              : 'month'
        }
      />

      {/* Status message */}
      {message && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            messageType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : messageType === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#e1d8c8] bg-[#faf7f2] text-[#6f665b]'
          }`}
        >
          <span className="flex-1">{message}</span>
          <button type="button" onClick={() => setMessage('')} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 animate-pulse">
          <div className="h-40 rounded-2xl bg-[#f0ebe2]" />
          <div className="h-32 rounded-2xl bg-[#f0ebe2]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Plan status + usage */}
          <div className="flex flex-col gap-6">
            {/* Plan card */}
            <section className="rounded-2xl border border-[#e1d8c8] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#241c15]">
                    <CreditCard className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e1b]">
                      Current plan
                    </p>
                    <h2 className="text-2xl font-bold text-[#241c15]">{planName}</h2>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
              </div>

              {isPaid && periodEnd && (
                <p className="mt-4 text-sm text-[#6f665b]">
                  {cancelAtPeriodEnd ? (
                    <span className="text-amber-700">
                      Access ends{' '}
                      <strong>
                        {new Date(periodEnd).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                      . Your plan will not renew.
                    </span>
                  ) : (
                    <>
                      Renews{' '}
                      <strong>
                        {new Date(periodEnd).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </>
                  )}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {isFree && (
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#241c15] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2c20] transition"
                  >
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                    View plans
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {isPaid && !cancelAtPeriodEnd && (
                  <button
                    type="button"
                    onClick={() => setCancelDialog(true)}
                    className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    Cancel subscription
                  </button>
                )}
                {isPaid && (
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e1d8c8] px-5 py-2.5 text-sm font-semibold text-[#241c15] hover:bg-[#f8f5ef] transition"
                  >
                    Change plan
                  </button>
                )}
              </div>
            </section>

            <section
              id="available-plans"
              className="rounded-2xl border border-[#e1d8c8] bg-white p-6 shadow-sm scroll-mt-24"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e1b]">
                    Available plans
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[#241c15]">
                    Choose the membership pace that fits your search
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
                    Member upgrade prompts now bring you here directly so you can review plans,
                    compare intent, and move into secure checkout without leaving your dashboard.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {availablePlans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e1d8c8] bg-[#faf7f2] p-5 text-sm text-[#6f665b]">
                    Membership plans are loading or unavailable right now. Please refresh and try
                    again in a moment.
                  </div>
                ) : (
                  availablePlans.map((plan) => {
                    const isCurrentPlan = overview?.plan?.code === plan.code;
                    const billingLabel =
                      plan.interval === 'YEAR'
                        ? 'Annual billing'
                        : plan.code.includes('QUARTER')
                          ? 'Quarterly billing'
                          : 'Monthly billing';
                    const planKey =
                      plan.code.startsWith('PLATINUM')
                        ? 'PLATINUM'
                        : plan.code.startsWith('GOLD')
                          ? 'GOLD'
                          : 'PREMIUM';

                    return (
                      <article
                        key={plan.id}
                        className={`rounded-2xl border p-5 shadow-sm transition ${
                          isCurrentPlan
                            ? 'border-[#7A1F2B]/30 bg-[#FCFAF7]'
                            : 'border-[#e1d8c8] bg-[#fffdfa] hover:-translate-y-0.5 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e1b]">
                              {billingLabel}
                            </p>
                            <h4 className="mt-2 text-xl font-bold text-[#241c15]">{plan.name}</h4>
                          </div>
                          {isCurrentPlan ? (
                            <span className="rounded-full bg-[#F8E8E8] px-3 py-1 text-[11px] font-semibold text-[#7A1F2B]">
                              Current
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-4 text-2xl font-bold text-[#241c15]">
                          {formatMoney(plan.priceCents, plan.currency)}
                        </p>
                        <p className="mt-1 text-sm text-[#6f665b]">
                          Billed per{' '}
                          {plan.interval === 'YEAR'
                            ? 'year'
                            : plan.code.includes('QUARTER')
                              ? 'quarter'
                              : 'month'}
                        </p>

                        <ul className="mt-4 space-y-2 text-sm text-[#6f665b]">
                          {(PLAN_HIGHLIGHTS[planKey] ?? []).map((highlight) => (
                            <li key={highlight} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            disabled={isCurrentPlan}
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              isCurrentPlan
                                ? 'cursor-default border border-[#e1d8c8] bg-[#f8f5ef] text-[#6f665b]'
                                : 'bg-[#241c15] text-white hover:bg-[#3a2c20]'
                            }`}
                          >
                            {isCurrentPlan ? 'Current plan' : 'Continue to secure checkout'}
                          </button>
                          <p className="mt-2 text-xs text-[#8a8176]">
                            {isCurrentPlan
                              ? 'You are already on this membership tier.'
                              : 'Stripe-secure checkout with billing management from this page.'}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            {/* Usage */}
            {Object.keys(limits).length > 0 && (
              <section className="rounded-2xl border border-[#e1d8c8] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e1b]">
                  Monthly usage
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#241c15]">This billing period</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {Object.entries(limits).map(([key, limit]) => {
                    const used = overview?.usage.find((item) => item.key === key)?.count ?? 0;
                    return (
                      <UsageBar
                        key={key}
                        used={used}
                        limit={limit}
                        label={USAGE_KEY_LABELS[key] ?? key}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Payment history */}
            <section className="rounded-2xl border border-[#e1d8c8] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#8b5e1b]" />
                <h3 className="text-lg font-semibold text-[#241c15]">Payment history</h3>
              </div>
              <div className="mt-5">
                {payments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[#6f665b]">No payments yet.</p>
                ) : (
                  <div className="divide-y divide-[#f0ebe2]">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#241c15]">
                            {payment.description ?? 'Subscription payment'}
                          </p>
                          <p className="text-xs text-[#6f665b]">
                            {new Date(payment.createdAt).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLES[payment.status] ?? 'text-[#6f665b] bg-[#f5f0e8]'}`}
                          >
                            {payment.status.charAt(0) + payment.status.slice(1).toLowerCase().replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-[#241c15]">
                            {formatMoney(payment.amountCents, payment.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Boost + trust strip */}
          <div className="flex flex-col gap-6">
            <aside className="rounded-2xl border border-[#e1d8c8] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdf7ec]">
                  <Rocket className="h-5 w-5 text-[#8b5e1b]" />
                </div>
                <h3 className="text-base font-semibold text-[#241c15]">Profile boost</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6f665b]">
                Activate a boost to lift your profile in discovery for the next 24 hours.
                Boosts reset each billing period.
              </p>
              {isFree ? (
                <div className="mt-4 rounded-xl bg-[#f8f5ef] px-4 py-3 text-sm text-[#6f665b]">
                  <p>Upgrade to a paid plan to unlock profile boosts.</p>
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#7A1F2B]"
                  >
                    Review member plans
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void activateBoost()}
                  disabled={boostLoading}
                  className="mt-5 w-full rounded-xl bg-[#241c15] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3a2c20] transition disabled:opacity-60"
                >
                  {boostLoading ? 'Activating…' : 'Activate boost'}
                </button>
              )}
            </aside>

            <div className="rounded-2xl border border-[#e1d8c8] bg-[#faf7f2] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e1b]">
                Membership promises
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  { icon: ShieldCheck, text: 'Cancel anytime from this page' },
                  { icon: CreditCard, text: 'Secure checkout via Stripe' },
                  { icon: FileText, text: 'Refunds reviewed within 5 days' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-[#6f665b]">
                    <Icon className="h-4 w-4 flex-shrink-0 text-[#8b5e1b]" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </MemberShell>
  );
}
