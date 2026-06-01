'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, CreditCard, ShieldAlert, Users } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface AggregateRow {
  _id: string;
  count: number;
  totalCents?: number;
}

interface AnalyticsSummary {
  generatedAt: string;
  monthlyRevenueCents: number;
  usersByRole: AggregateRow[];
  usersByStatus: AggregateRow[];
  profilesByStatus: AggregateRow[];
  reportsByStatus: AggregateRow[];
  paymentsByStatus: AggregateRow[];
  subscriptionsByStatus: AggregateRow[];
  verificationByStatus: AggregateRow[];
}

export default function AdminAnalyticsPage() {
  const memberRequest = useMemberRequest();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void memberRequest('/api/admin/analytics/summary').then((result) => {
      if (result.ok) setSummary(result.data as AnalyticsSummary);
      else setMessage(result.message);
    });
  }, [memberRequest]);

  return (
    <AdminShell
      title="Reporting and analytics"
      subtitle="Operational reporting for users, verification, subscriptions, revenue, reports, payments, and profile moderation."
    >
      {message ? (
        <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          icon={<CreditCard className="h-5 w-5" />}
          label="Monthly revenue"
          value={`$${((summary?.monthlyRevenueCents ?? 0) / 100).toFixed(2)}`}
        />
        <Metric
          icon={<Users className="h-5 w-5" />}
          label="Users"
          value={total(summary?.usersByStatus)}
        />
        <Metric
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Reports"
          value={total(summary?.reportsByStatus)}
        />
        <Metric
          icon={<BarChart3 className="h-5 w-5" />}
          label="Subscriptions"
          value={total(summary?.subscriptionsByStatus)}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Breakdown title="Users by role" rows={summary?.usersByRole ?? []} />
        <Breakdown title="Users by status" rows={summary?.usersByStatus ?? []} />
        <Breakdown title="Profiles by moderation status" rows={summary?.profilesByStatus ?? []} />
        <Breakdown title="Verification by status" rows={summary?.verificationByStatus ?? []} />
        <Breakdown title="Reports by status" rows={summary?.reportsByStatus ?? []} />
        <Breakdown title="Payments by status" rows={summary?.paymentsByStatus ?? []} money />
        <Breakdown title="Subscriptions by status" rows={summary?.subscriptionsByStatus ?? []} />
      </div>
    </AdminShell>
  );
}

function total(rows: AggregateRow[] = []) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function Metric({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: ReactNode }>) {
  return (
    <div className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
      <div className="text-[#7A1E3A]">{icon}</div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Breakdown({
  money = false,
  rows,
  title,
}: Readonly<{ money?: boolean; rows: AggregateRow[]; title: string }>) {
  return (
    <section className="rounded-lg border border-[#7A1E3A]/10 p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div
            key={row._id ?? 'unknown'}
            className="flex items-center justify-between rounded-md bg-[#FFF8F1] px-3 py-2 text-sm"
          >
            <span>{row._id || 'UNKNOWN'}</span>
            <span className="font-semibold">
              {row.count}
              {money && row.totalCents !== undefined
                ? ` / $${(row.totalCents / 100).toFixed(2)}`
                : ''}
            </span>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-[#5E6470]">No data yet.</p> : null}
      </div>
    </section>
  );
}
