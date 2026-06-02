'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, CreditCard, ShieldAlert, Users } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { useAuth } from '@/app/auth-context';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface AggregateRow {
  _id: string;
  count: number;
  totalCents?: number;
}

interface AnalyticsSummary {
  generatedAt: string;
  range: { from: string; to: string };
  monthlyRevenueCents: number;
  usersByRole: AggregateRow[];
  usersByStatus: AggregateRow[];
  profilesByStatus: AggregateRow[];
  reportsByStatus: AggregateRow[];
  paymentsByStatus: AggregateRow[];
  subscriptionsByStatus: AggregateRow[];
  verificationByStatus: AggregateRow[];
  matchInterestStats: AggregateRow[];
  messagingActivity: AggregateRow[];
  communityActivity: AggregateRow[];
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const memberRequest = useMemberRequest();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState(() => monthStartInput());
  const [to, setTo] = useState(() => todayInput());

  async function load() {
    const params = new URLSearchParams({ from, to });
    const result = await memberRequest(`/api/admin/analytics/summary?${params.toString()}`);
      if (result.ok) setSummary(result.data as AnalyticsSummary);
      else setMessage(result.message);
  }

  async function exportCsv() {
    if (!token) {
      setMessage('Not authenticated. Please log in.');
      return;
    }
    const params = new URLSearchParams({ from, to });
    const response = await fetch(`${apiBaseUrl}/api/admin/analytics/export.csv?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setMessage('CSV export failed.');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vivah-admin-analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Reporting and analytics"
      subtitle="Operational reporting for users, verification, subscriptions, revenue, reports, payments, and profile moderation."
    >
      {message ? (
        <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold text-[#232323]">
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-10 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-[#232323]">
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-10 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="h-10 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => void exportCsv()}
          className="h-10 rounded-md border border-[#7A1E3A]/20 px-4 text-sm font-semibold text-[#7A1E3A]"
        >
          Export CSV
        </button>
      </div>

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
        <Breakdown title="Match and interest activity" rows={summary?.matchInterestStats ?? []} />
        <Breakdown title="Messaging activity by day" rows={summary?.messagingActivity ?? []} />
        <Breakdown title="Community activity" rows={summary?.communityActivity ?? []} />
      </div>
    </AdminShell>
  );
}

function monthStartInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
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
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <section className="rounded-lg border border-[#7A1E3A]/10 p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row._id ?? 'unknown'} className="rounded-md bg-[#FFF8F1] px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span>{row._id || 'UNKNOWN'}</span>
              <span className="font-semibold">
                {row.count}
                {money && row.totalCents !== undefined
                  ? ` / $${(row.totalCents / 100).toFixed(2)}`
                  : ''}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#7A1E3A]"
                style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-[#5E6470]">No data yet.</p> : null}
      </div>
    </section>
  );
}
