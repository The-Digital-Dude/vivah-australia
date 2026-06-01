'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { couponInputSchema } from '@vivah/shared';
import { CreditCard, Receipt, RotateCcw, Ticket, Users } from 'lucide-react';
import AdminShell from '../admin-shell';
import {
  formString,
  optionalNumber,
  optionalString,
  useMemberRequest,
  validationMessage,
} from '@/lib/member-api';

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

  async function refund(paymentId: string) {
    const result = await memberRequest('/api/admin/refunds', {
      method: 'POST',
      body: { paymentId, reason: 'Admin refund' },
    });
    setMessage(result.message);
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
    setMessage(result.ok ? 'Coupon saved.' : result.message);
    if (result.ok) await load();
  }

  const revenue = payments
    .filter((payment) => payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED')
    .reduce((sum, payment) => sum + payment.amountCents - payment.refundedAmountCents, 0);

  return (
    <AdminShell
      title="Membership and payments"
      subtitle="Monitor subscriptions, payments, invoices, coupons, and refund records from one operational screen."
    >
      {message ? (
        <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          icon={<Users className="h-5 w-5" />}
          label="Subscriptions"
          value={subscriptions.length}
        />
        <Metric
          icon={<CreditCard className="h-5 w-5" />}
          label="Payments"
          value={payments.length}
        />
        <Metric icon={<RotateCcw className="h-5 w-5" />} label="Refunds" value={refunds.length} />
        <Metric
          icon={<Receipt className="h-5 w-5" />}
          label="Net revenue"
          value={`$${(revenue / 100).toFixed(2)}`}
        />
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Table
            title="Subscriptions"
            headers={['User', 'Plan', 'Status', 'Provider', 'Period end']}
          >
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td className="py-3">{subscription.userId}</td>
                <td>{subscription.planName ?? subscription.planCode ?? subscription.planId}</td>
                <td>{subscription.status}</td>
                <td>{subscription.provider ?? 'local'}</td>
                <td>
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : '-'}
                </td>
              </tr>
            ))}
          </Table>

          <Table
            title="Payments"
            headers={['Payment', 'Status', 'User', 'Amount', 'Refunded', 'Action']}
          >
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="py-3">{payment.description ?? payment.id}</td>
                <td>{payment.status}</td>
                <td>{payment.userId}</td>
                <td>
                  {payment.currency} ${(payment.amountCents / 100).toFixed(2)}
                </td>
                <td>${(payment.refundedAmountCents / 100).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => void refund(payment.id)}
                    className="rounded-md border border-[#7A1E3A]/20 px-3 py-2 text-xs font-semibold text-[#7A1E3A]"
                  >
                    Refund
                  </button>
                </td>
              </tr>
            ))}
          </Table>

          <Table title="Refund records" headers={['Payment', 'Status', 'Amount', 'Reason', 'Date']}>
            {refunds.map((refundItem) => (
              <tr key={refundItem._id}>
                <td className="py-3">{refundItem.paymentId}</td>
                <td>{refundItem.status}</td>
                <td>
                  {refundItem.currency} ${(refundItem.amountCents / 100).toFixed(2)}
                </td>
                <td>{refundItem.reason ?? '-'}</td>
                <td>{new Date(refundItem.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        </div>

        <aside className="grid gap-6">
          <form
            onSubmit={(event) => void createCoupon(event)}
            className="rounded-lg border border-[#7A1E3A]/10 p-4"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Ticket className="h-5 w-5 text-[#7A1E3A]" />
              Coupon CRUD
            </div>
            <div className="mt-4 grid gap-3">
              <input name="code" placeholder="WELCOME20" className={inputClass} />
              <input
                name="percentOff"
                type="number"
                placeholder="Percent off"
                className={inputClass}
              />
              <input
                name="amountOffCents"
                type="number"
                placeholder="Amount off cents"
                className={inputClass}
              />
              <input name="expiresAt" type="date" className={inputClass} />
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input name="active" type="checkbox" defaultChecked />
                Active
              </label>
              <button className="rounded-md bg-[#7A1E3A] px-4 py-2 text-sm font-semibold text-white">
                Save coupon
              </button>
            </div>
          </form>

          <Table title="Coupons" headers={['Code', 'Discount', 'Status']}>
            {coupons.map((coupon) => (
              <tr key={coupon._id}>
                <td className="py-3">{coupon.code}</td>
                <td>
                  {coupon.percentOff
                    ? `${coupon.percentOff}%`
                    : `$${((coupon.amountOffCents ?? 0) / 100).toFixed(2)}`}
                </td>
                <td>{coupon.active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </Table>
        </aside>
      </section>
    </AdminShell>
  );
}

const inputClass =
  'h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm outline-none focus:border-[#7A1E3A]';

function Metric({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: ReactNode }>) {
  return (
    <div className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
      <div className="text-[#7A1E3A]">{icon}</div>
      <p className="mt-3 text-sm text-[#5E6470]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Table({
  children,
  headers,
  title,
}: Readonly<{ children: ReactNode; headers: string[]; title: string }>) {
  return (
    <section className="overflow-x-auto rounded-lg border border-[#7A1E3A]/10 p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b text-[#5E6470]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </section>
  );
}
