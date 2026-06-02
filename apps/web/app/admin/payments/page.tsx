'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { couponInputSchema } from '@vivah/shared';
import { CreditCard, Receipt, RotateCcw, Ticket, Users, ShieldAlert, AlertCircle, Sparkles } from 'lucide-react';
import AdminShell from '../admin-shell';
import {
  formString,
  optionalNumber,
  optionalString,
  useMemberRequest,
  validationMessage,
} from '@/lib/member-api';
import { AdminMetricCard, AdminStatusBadge } from '../components/admin-primitives';

interface Payment {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string;
  refundedAmountCents: number;
  createdAt: string;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planCode?: string;
  planName?: string;
  status: string;
  provider?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface Coupon {
  _id: string;
  code: string;
  percentOff?: number;
  amountOffCents?: number;
  active: boolean;
  expiresAt?: string;
}

interface Refund {
  _id: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const memberRequest = useMemberRequest();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [message, setMessage] = useState('');


  // Refund Confirmation state
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);

  async function load() {
    const [paymentResult, subscriptionResult, couponResult, refundResult] = await Promise.all([
      memberRequest('/api/admin/payments'),
      memberRequest('/api/admin/subscriptions'),
      memberRequest('/api/admin/coupons'),
      memberRequest('/api/admin/refunds'),
    ]);

    if (paymentResult.ok)
      setPayments((paymentResult.data as { payments?: Payment[] }).payments ?? []);
    if (subscriptionResult.ok) {
      setSubscriptions(
        (subscriptionResult.data as { subscriptions?: Subscription[] }).subscriptions ?? [],
      );
    }
    if (couponResult.ok) setCoupons((couponResult.data as { coupons?: Coupon[] }).coupons ?? []);
    if (refundResult.ok) setRefunds((refundResult.data as { refunds?: Refund[] }).refunds ?? []);

    const failed = [paymentResult, subscriptionResult, couponResult, refundResult].find(
      (result) => !result.ok,
    );
    if (failed) setMessage(failed.message);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRefund() {
    if (!confirmRefundId) return;
    const result = await memberRequest('/api/admin/refunds', {
      method: 'POST',
      body: { paymentId: confirmRefundId, reason: 'Admin panel transaction refund request' },
    });
    setMessage(result.message);
    setConfirmRefundId(null);
    if (result.ok) await load();
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = couponInputSchema.safeParse({
      code: formString(form.get('code')),
      percentOff: optionalNumber(form.get('percentOff')),
      amountOffCents: optionalNumber(form.get('amountOffCents')),
      active: form.get('active') === 'on',
      expiresAt: optionalString(form.get('expiresAt')),
    });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest('/api/admin/coupons', { method: 'POST', body: parsed.data });
    setMessage(result.ok ? 'New coupon generated successfully.' : result.message);
    if (result.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  const revenue = payments
    .filter((payment) => payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED')
    .reduce((sum, payment) => sum + payment.amountCents - payment.refundedAmountCents, 0);

  return (
    <AdminShell
      title="Financial & Subscription Ledger"
      subtitle="Track transactions, manage refunds, audit subscriptions, and issue discount codes."
    >
      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-[#7A1F2B]" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI METRIC TILES */}
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard
          label="Subscriptions"
          value={subscriptions.length}
          icon={Users}
          description="Total active memberships"
        />
        <AdminMetricCard
          label="Payments Processed"
          value={payments.length}
          icon={CreditCard}
          description="Stripe checkout sessions"
        />
        <AdminMetricCard
          label="Refunds Cleared"
          value={refunds.length}
          icon={RotateCcw}
          description="Returned transaction events"
        />
        <AdminMetricCard
          label="Net Revenue"
          value={`$${(revenue / 100).toFixed(2)}`}
          icon={Receipt}
          description="Net volume generated"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* LEDGER TABLES */}
        <div className="space-y-6">
          
          {/* SUBSCRIPTIONS */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Active Subscriptions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">User Reference</th>
                    <th className="px-4 py-3">Plan Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-semibold text-neutral-800">{sub.userId}</td>
                      <td className="px-4 py-3 text-xs font-medium text-neutral-600">
                        {sub.planName ?? sub.planCode ?? sub.planId}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 font-semibold uppercase">{sub.provider ?? 'local'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-450">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-neutral-400 italic">
                        No subscription entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PAYMENTS */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Processed Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Reference Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Gross Amount</th>
                    <th className="px-4 py-3">Refunded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-xs font-bold text-neutral-800 max-w-[200px] truncate" title={payment.description ?? payment.id}>
                        {payment.description ?? payment.id}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 font-semibold">{payment.userId}</td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-750">
                        {payment.currency.toUpperCase()} ${(payment.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-rose-700 font-semibold">
                        ${(payment.refundedAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payment.status === 'SUCCEEDED' && (
                          <button
                            type="button"
                            onClick={() => setConfirmRefundId(payment.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-200 text-rose-700 px-3 text-xs font-bold hover:bg-rose-50 transition"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-neutral-400 italic">
                        No transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* REFUNDS */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Refund Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Payment Reference ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Refund Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Settled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150">
                  {refunds.map((refundItem) => (
                    <tr key={refundItem._id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{refundItem.paymentId}</td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={refundItem.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-rose-800">
                        {refundItem.currency.toUpperCase()} ${(refundItem.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 font-semibold">{refundItem.reason ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-450">{new Date(refundItem.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-neutral-400 italic">
                        No refunds issued yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* SIDE BAR COUPONS */}
        <aside className="space-y-6">
          <form
            onSubmit={(event) => void createCoupon(event)}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 font-bold text-neutral-850">
              <Ticket className="h-5 w-5 text-[#7A1F2B]" />
              <span>Generate Coupon</span>
            </div>
            
            <div className="grid gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Coupon Code</label>
                <input required name="code" placeholder="WELCOME20" className={inputClass} />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Percent Off</label>
                  <input
                    name="percentOff"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Amount Cents</label>
                  <input
                    name="amountOffCents"
                    type="number"
                    min="0"
                    placeholder="2000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Expires At</label>
                <input name="expiresAt" type="date" className={inputClass} />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600">
                <input name="active" type="checkbox" defaultChecked className="rounded-lg border-neutral-300 text-[#7A1F2B] focus:ring-[#7A1F2B]/30 h-4.5 w-4.5" />
                <span>Mark Active Instantly</span>
              </label>

              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1F2B] hover:bg-[#651925] text-sm font-bold text-white shadow-sm transition">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span>Generate Coupon</span>
              </button>
            </div>
          </form>

          {/* COUPONS LIST */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 mb-3.5">Active Promo Codes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-550">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-neutral-50/50">
                      <td className="px-3 py-2.5 font-bold text-neutral-800">{coupon.code}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-neutral-600">
                        {coupon.percentOff
                          ? `${coupon.percentOff}% off`
                          : `$${((coupon.amountOffCents ?? 0) / 100).toFixed(2)} off`}
                      </td>
                      <td className="px-3 py-2.5">
                        <AdminStatusBadge status={coupon.active ? 'ACTIVE' : 'ARCHIVED'} />
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-xs text-neutral-400 italic">
                        No coupon codes available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>

      {/* REFUND CONFIRMATION OVERLAY */}
      {confirmRefundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setConfirmRefundId(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Confirm Transaction Refund
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Are you sure you want to refund payment: <strong className="text-[#7A1F2B] font-mono">{confirmRefundId.slice(-12).toUpperCase()}</strong>?
            </p>

            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Destructive Action Warning:</strong> Issuing refunds interacts directly with Stripe. This operation cannot be undone and will revoke the user's premium entitlements immediately.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRefundId(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleRefund()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
                type="button"
              >
                Issue Stripe Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border border-neutral-250 bg-white px-4 text-xs font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#7A1F2B] transition';
