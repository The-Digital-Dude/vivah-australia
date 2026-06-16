'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, RefreshCcw, ShieldAlert } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';
import AdminShell from '../../admin-shell';
import { AdminStatusBadge } from '../../components/admin-primitives';

interface PaymentDetailData {
  payment: {
    _id: string;
    userId: string;
    planId: string;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    providerPaymentId?: string;
    description?: string;
    refundedAmountCents: number;
    createdAt: string;
  };
  invoice?: {
    _id: string;
    invoiceNumber: string;
    providerInvoiceId: string;
    providerHostedUrl?: string;
    providerPdfUrl?: string;
    status: string;
    totalCents: number;
  };
  subscription?: {
    _id: string;
    planId: string;
    status: string;
    providerSubscriptionId?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  };
  user: {
    email: string;
    role: string;
    status: string;
  };
}

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberRequest = useMemberRequest();
  const [data, setData] = useState<PaymentDetailData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await memberRequest(`/api/admin/payments/${params.id}`);
      if (result.ok) {
        setData(result.data as PaymentDetailData);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
    void load();
  }, [params.id, memberRequest]);

  if (loading) {
    return (
      <AdminShell title="Loading Payment Detail..." subtitle="Please wait">
        <div className="p-6 text-sm text-neutral-500">Loading...</div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell title="Error Loading Payment" subtitle="Could not retrieve details">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error || 'Not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          type="button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </button>
      </AdminShell>
    );
  }

  const { payment, invoice, subscription, user } = data;

  return (
    <AdminShell
      title="Transaction Detail"
      subtitle={`Viewing record ${payment._id.slice(-12).toUpperCase()}`}
    >
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/payments')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#A10E4D] hover:text-[#890B40]"
          type="button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Ledger
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Summary */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <span className="text-sm font-medium text-neutral-600">Amount</span>
              <span className="text-lg font-bold text-neutral-900">
                {payment.currency.toUpperCase()} ${(payment.amountCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <span className="text-sm font-medium text-neutral-600">Status</span>
              <AdminStatusBadge status={payment.status} />
            </div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <span className="text-sm font-medium text-neutral-600">Provider</span>
              <span className="text-sm font-semibold text-neutral-800 uppercase">{payment.provider}</span>
            </div>
            {payment.providerPaymentId && (
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <span className="text-sm font-medium text-neutral-600">Gateway Ref</span>
                <span className="text-xs font-mono text-neutral-500">{payment.providerPaymentId}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-600">Date</span>
              <span className="text-sm text-neutral-800">{new Date(payment.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Customer Account
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <span className="text-sm font-medium text-neutral-600">Email</span>
              <span className="text-sm font-bold text-neutral-900">{user.email}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <span className="text-sm font-medium text-neutral-600">System Role</span>
              <span className="text-sm font-semibold text-neutral-800">{user.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-600">Account Status</span>
              <AdminStatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {/* Invoice & Subscription (if applicable) */}
        {(invoice || subscription) && (
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            {invoice && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">Invoice Details</h3>
                <div className="space-y-3">
                  <p className="text-sm"><strong className="text-neutral-600">Invoice #</strong> {invoice.invoiceNumber}</p>
                  <p className="text-sm"><strong className="text-neutral-600">Status:</strong> {invoice.status}</p>
                  {invoice.providerHostedUrl && (
                    <a href={invoice.providerHostedUrl} target="_blank" rel="noreferrer" className="text-[#A10E4D] hover:underline text-sm font-semibold inline-block mt-2">
                      View Hosted Invoice &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {subscription && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" /> Subscription Profile
                </h3>
                <div className="space-y-3">
                  <p className="text-sm"><strong className="text-neutral-600">Status:</strong> <AdminStatusBadge status={subscription.status} /></p>
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm"><strong className="text-neutral-600">Period Ends:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  )}
                  <p className="text-sm">
                    <strong className="text-neutral-600">Renews:</strong> {subscription.cancelAtPeriodEnd ? 'No (Canceling)' : 'Yes'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
