'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Receipt, RotateCcw } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';

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

export default function AdminPaymentsPage() {
  const memberRequest = useMemberRequest();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const result = await memberRequest('/api/admin/payments');
    if (result.ok) {
      const data = result.data as { payments?: Payment[] };
      setPayments(data.payments ?? []);
    } else {
      setMessage(result.message);
    }
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
    if (result.ok) {
      await load();
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-6 py-10 text-[#241c15]">
      <section className="mx-auto max-w-6xl rounded-lg border border-[#e1d8c8] bg-white p-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-[#8b5e1b]" />
          <div>
            <h1 className="text-3xl font-semibold">Payments</h1>
            <p className="mt-1 text-sm text-[#6f665b]">
              Review subscription payments, invoice totals, and refunds.
            </p>
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-[#6f665b]">{message}</p> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#e1d8c8] text-[#6f665b]">
              <tr>
                <th className="py-3">Payment</th>
                <th>Status</th>
                <th>User</th>
                <th>Amount</th>
                <th>Refunded</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee6d8]">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Receipt className="h-4 w-4" />
                      {payment.description ?? payment.id}
                    </span>
                  </td>
                  <td>{payment.status}</td>
                  <td>{payment.userId}</td>
                  <td>
                    {payment.currency} ${(payment.amountCents / 100).toFixed(2)}
                  </td>
                  <td>${(payment.refundedAmountCents / 100).toFixed(2)}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        void refund(payment.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-[#d8c7a3] px-3 py-2 font-semibold hover:bg-[#f8f5ef]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Refund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? (
            <p className="py-8 text-sm text-[#6f665b]">No payments found.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
