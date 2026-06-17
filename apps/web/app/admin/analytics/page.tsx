'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, CreditCard, ShieldAlert, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { useAuth } from '@/app/auth-context';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const brandMaroon = '#A10E4D';
const brandGold = '#D4A04C';
const brandRose = '#E74C7C';
const brandIvory = '#FFF8F1';
const chartPalette = [brandMaroon, brandGold, brandRose, '#C65B84', '#8B1E4A', '#F0C26E'];

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

interface ChartRow {
  key: string;
  label: string;
  count: number;
  totalCents?: number;
  fill: string;
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
    if (result.ok) {
      setSummary(result.data as AnalyticsSummary);
      setMessage('');
    } else {
      setMessage(result.message);
    }
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

  const usersByRole = useMemo(() => toChartRows(summary?.usersByRole ?? []), [summary?.usersByRole]);
  const usersByStatus = useMemo(() => toChartRows(summary?.usersByStatus ?? []), [summary?.usersByStatus]);
  const profilesByStatus = useMemo(
    () => toChartRows(summary?.profilesByStatus ?? []),
    [summary?.profilesByStatus],
  );
  const reportsByStatus = useMemo(() => toChartRows(summary?.reportsByStatus ?? []), [summary?.reportsByStatus]);
  const paymentsByStatus = useMemo(
    () => toChartRows(summary?.paymentsByStatus ?? []),
    [summary?.paymentsByStatus],
  );
  const subscriptionsByStatus = useMemo(
    () => toChartRows(summary?.subscriptionsByStatus ?? []),
    [summary?.subscriptionsByStatus],
  );
  const verificationByStatus = useMemo(
    () => toChartRows(summary?.verificationByStatus ?? []),
    [summary?.verificationByStatus],
  );
  const matchInterestStats = useMemo(
    () => toChartRows(summary?.matchInterestStats ?? []),
    [summary?.matchInterestStats],
  );
  const messagingActivity = useMemo(
    () => toTimeSeries(summary?.messagingActivity ?? []),
    [summary?.messagingActivity],
  );
  const communityActivity = useMemo(
    () => toChartRows(summary?.communityActivity ?? []),
    [summary?.communityActivity],
  );

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
        <PieBreakdown title="Users by role" rows={usersByRole} />
        <BarBreakdown title="Users by status" rows={usersByStatus} />
        <BarBreakdown title="Profiles by moderation status" rows={profilesByStatus} />
        <BarBreakdown title="Verification by status" rows={verificationByStatus} />
        <BarBreakdown title="Reports by status" rows={reportsByStatus} />
        <BarBreakdown title="Payments by status" rows={paymentsByStatus} showMoney />
        <BarBreakdown title="Subscriptions by status" rows={subscriptionsByStatus} />
        <BarBreakdown title="Match and interest activity" rows={matchInterestStats} />
        <LineBreakdown title="Messaging activity by day" rows={messagingActivity} />
        <CommunityBreakdown title="Community activity" rows={communityActivity} />
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

function toChartRows(rows: AggregateRow[]): ChartRow[] {
  return rows.map((row, index) => ({
    key: row._id || `unknown-${index}`,
    label: formatLabel(row._id),
    count: row.count,
    fill: chartPalette[index % chartPalette.length] ?? brandMaroon,
    ...(row.totalCents !== undefined ? { totalCents: row.totalCents } : {}),
  }));
}

function toTimeSeries(rows: AggregateRow[]) {
  return rows.map((row) => ({
    key: row._id || 'unknown',
    label: formatDateLabel(row._id),
    rawLabel: row._id || 'UNKNOWN',
    count: row.count,
  }));
}

function formatLabel(value?: string) {
  if (!value) return 'Unknown';
  return value.replaceAll('_', ' ');
}

function formatDateLabel(value?: string) {
  if (!value) return 'Unknown';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
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

function ChartSection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-lg border border-[#7A1E3A]/10 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[#232323]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ label }: Readonly<{ label: string }>) {
  return (
    <div
      className="grid h-[280px] place-items-center rounded-md border border-dashed border-[#A10E4D]/15 bg-[#FFF8F1] px-6 text-center text-sm text-[#5E6470]"
      data-testid="analytics-empty-state"
      aria-label={`${label} empty state`}
    >
      No data yet for this range.
    </div>
  );
}

function BreakdownLegend({
  rows,
  showMoney = false,
}: Readonly<{ rows: ChartRow[]; showMoney?: boolean }>) {
  return (
    <div className="mt-4 grid gap-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between rounded-md bg-[#FFF8F1] px-3 py-2 text-sm text-[#232323]"
        >
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
            {row.label}
          </span>
          <span className="font-semibold">
            {row.count}
            {showMoney && row.totalCents !== undefined ? ` / $${(row.totalCents / 100).toFixed(2)}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieBreakdown({ title, rows }: Readonly<{ title: string; rows: ChartRow[] }>) {
  return (
    <ChartSection title={title}>
      {rows.length === 0 ? (
        <EmptyState label={title} />
      ) : (
        <>
          <div className="h-[280px]" data-testid="analytics-pie-chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={280}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={3}
                  stroke={brandIvory}
                  strokeWidth={2}
                >
                  {rows.map((row) => (
                    <Cell key={row.key} fill={row.fill} />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <BreakdownLegend rows={rows} />
        </>
      )}
    </ChartSection>
  );
}

function BarBreakdown({
  rows,
  showMoney = false,
  title,
}: Readonly<{ rows: ChartRow[]; showMoney?: boolean; title: string }>) {
  return (
    <ChartSection title={title}>
      {rows.length === 0 ? (
        <EmptyState label={title} />
      ) : (
        <>
          <div className="h-[280px]" data-testid="analytics-bar-chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={280}>
              <BarChart data={rows} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1DDE5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5E6470' }} interval={0} angle={-12} textAnchor="end" height={54} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5E6470' }} />
                <Tooltip content={<AnalyticsTooltip showMoney={showMoney} />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {rows.map((row) => (
                    <Cell key={row.key} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <BreakdownLegend rows={rows} showMoney={showMoney} />
        </>
      )}
    </ChartSection>
  );
}

function LineBreakdown({
  rows,
  title,
}: Readonly<{ rows: Array<{ key: string; label: string; rawLabel: string; count: number }>; title: string }>) {
  return (
    <ChartSection title={title}>
      {rows.length === 0 ? (
        <EmptyState label={title} />
      ) : (
        <div className="h-[280px]" data-testid="analytics-line-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={280}>
            <LineChart data={rows} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1DDE5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5E6470' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5E6470' }} />
              <Tooltip content={<AnalyticsTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={brandMaroon}
                strokeWidth={3}
                dot={{ fill: brandGold, stroke: brandMaroon, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: brandMaroon, strokeWidth: 2, fill: brandGold }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartSection>
  );
}

function CommunityBreakdown({
  rows,
  title,
}: Readonly<{ rows: ChartRow[]; title: string }>) {
  return (
    <ChartSection title={title}>
      {rows.length === 0 ? (
        <EmptyState label={title} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="analytics-community-cards">
          {rows.map((row) => (
            <div key={row.key} className="rounded-lg border border-[#A10E4D]/10 bg-[#FFF8F1] p-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.fill }} />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">
                  {row.label}
                </p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-[#232323]">{row.count}</p>
            </div>
          ))}
        </div>
      )}
    </ChartSection>
  );
}

function AnalyticsTooltip({
  active,
  payload,
  label,
  showMoney = false,
}: Readonly<{
  active?: boolean;
  label?: string;
  payload?: Array<{ payload?: { label?: string; totalCents?: number }; value?: number }>;
  showMoney?: boolean;
}>) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const totalCents = item?.payload?.totalCents;

  return (
    <div className="rounded-md border border-[#A10E4D]/10 bg-white px-3 py-2 text-xs text-[#232323] shadow-lg">
      <p className="font-semibold text-[#7A1E3A]">{item?.payload?.label ?? label ?? 'Value'}</p>
      <p className="mt-1">Count: {item?.value ?? 0}</p>
      {showMoney && totalCents !== undefined ? <p>Value: ${(totalCents / 100).toFixed(2)}</p> : null}
    </div>
  );
}
