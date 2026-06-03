'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminMetricCard, AdminStatusBadge } from '../components/admin-primitives';
import {
  Users,
  Shield,
  FileCheck,
  Flag,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  AlertTriangle,
  Zap,
  Clock,
  DollarSign,
} from 'lucide-react';

interface Summary {
  totalUsers: number;
  activeUsers: number;
  pendingProfiles: number;
  pendingVerifications: number;
  openReports: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingMedia?: number;
  recentUsers: Array<{ id: string; email?: string; role: string; createdAt: string }>;
  recentReports: Array<{ _id: string; reason: string; status: string; createdAt: string }>;
}

export default function AdminDashboardPage() {
  const memberRequest = useMemberRequest();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void memberRequest('/api/admin/dashboard/summary').then((result) => {
      if (result.ok) {
        setSummary(result.data as Summary);
      }
      setLoading(false);
    });
  }, [memberRequest]);

  const stats = [
    {
      label: 'Total Members',
      value: summary?.totalUsers ?? 0,
      icon: Users,
      description: 'Registered user accounts',
    },
    {
      label: 'Active Members',
      value: summary?.activeUsers ?? 0,
      icon: TrendingUp,
      description: 'Recent session activity',
    },
    {
      label: 'Pending Profiles',
      value: summary?.pendingProfiles ?? 0,
      icon: Shield,
      description: 'Awaiting profile validation',
      trend: summary?.pendingProfiles && summary.pendingProfiles > 0 ? 'Review Needed' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Pending Verifications',
      value: summary?.pendingVerifications ?? 0,
      icon: FileCheck,
      description: 'Documents in queue',
      trend: summary?.pendingVerifications && summary.pendingVerifications > 0 ? 'Action Required' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Open Safety Reports',
      value: summary?.openReports ?? 0,
      icon: Flag,
      description: 'Active safety complaints',
      trend: summary?.openReports && summary.openReports > 0 ? 'Urgent triage' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Pending Photo Reviews',
      value: summary?.pendingMedia ?? 0,
      icon: ImageIcon,
      description: 'Media uploads awaiting approval',
    },
    {
      label: 'Active Subscriptions',
      value: summary?.activeSubscriptions ?? 0,
      icon: CreditCard,
      description: 'Paying members active',
    },
    {
      label: 'Monthly Revenue',
      value: `$${(((summary?.monthlyRevenue ?? 0)) / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'Gross billing volume',
    },
  ];

  return (
    <AdminShell
      title="Operations Command Center"
      subtitle={`Live trust, safety, and business health telemetry. All systems operational. Timestamp: ${new Date().toLocaleDateString(
        'en-AU',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      )}.`}
    >
      {/* KPI METRIC CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-2xl border border-[#2F2F2F]/10 bg-white"
              />
            ))
          : stats.map((stat, index) => (
              <AdminMetricCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                description={stat.description}
                trend={stat.trend}
                trendType={stat.trendType}
              />
            ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        
        {/* PRIORITY QUEUES & ACTIVITY */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#A10E4D]" />
                  Priority Operational Queues
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">Urgent actions required to maintain trust, safety, and membership updates.</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <Link
                href="/admin/profiles"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-[#FBFBFC] p-4 transition-all hover:bg-neutral-50 hover:translate-x-1"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Profiles Moderation Queue</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Approve new member signups and profile changes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                    {summary?.pendingProfiles ?? 0} awaiting review
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/verifications"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-[#FBFBFC] p-4 transition-all hover:bg-neutral-50 hover:translate-x-1"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Identity & Document Verifications</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Audit uploaded passports, visas, and assign trust levels</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                    {summary?.pendingVerifications ?? 0} verifications pending
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-[#FBFBFC] p-4 transition-all hover:bg-neutral-50 hover:translate-x-1"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Abuse & Safety Reports Triage</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Investigate flagged profiles, harassment, or scammers</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-50 border border-rose-250 px-2.5 py-0.5 text-xs font-extrabold text-rose-800 animate-pulse">
                    {summary?.openReports ?? 0} active tickets
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/media"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-[#FBFBFC] p-4 transition-all hover:bg-neutral-50 hover:translate-x-1"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Media Approval Queue</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Audit profile photos and gallery visibility state</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
                    {summary?.pendingMedia ?? 0} pending photos
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/payments"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-[#FBFBFC] p-4 transition-all hover:bg-neutral-50 hover:translate-x-1"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Billing & Refunds Queue</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Audit transactions, manage plans, and handle claims</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
                    Review payments
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>
            </div>
          </section>

          {/* RECENT REGISTRATIONS */}
          <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#D4A04C]" />
              Recent Operator Telemetry
            </h2>
            <div className="mt-4 divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="py-3.5 animate-pulse">
                    <div className="h-4 w-1/3 rounded bg-neutral-100" />
                    <div className="h-3 w-1/4 rounded bg-neutral-100 mt-1" />
                  </div>
                ))
              ) : summary?.recentUsers && summary.recentUsers.length > 0 ? (
                summary.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-bold text-neutral-805">{user.email ?? 'No email'}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-neutral-50 border border-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-neutral-400">
                  No telemetry metrics compiled.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* QUICK ACTIONS & RECENT REPORTS */}
        <div className="space-y-6">
          {/* QUICK ACTIONS */}
          <section className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#A10E4D]">Quick Administration Console</h2>
            <p className="text-xs text-neutral-500 mt-0.5 mb-4">Direct shortcuts to operational systems panels.</p>
            <div className="grid gap-3">
              <Link
                href="/admin/profiles"
                className="flex items-center justify-center rounded-xl bg-white border border-[#A10E4D]/20 py-2.5 text-sm font-bold text-[#A10E4D] shadow-sm hover:bg-[#FFF0F3] transition"
              >
                Review Profiles
              </Link>
              <Link
                href="/admin/verifications"
                className="flex items-center justify-center rounded-xl bg-white border border-[#A10E4D]/20 py-2.5 text-sm font-bold text-[#A10E4D] shadow-sm hover:bg-[#FFF0F3] transition"
              >
                Verify Documents
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-center rounded-xl bg-[#A10E4D] py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#890B40] transition"
              >
                Resolve Safety Reports
              </Link>
              <Link
                href="/admin/payments"
                className="flex items-center justify-center rounded-xl bg-white border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition"
              >
                Manage Subscriptions
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center justify-center rounded-xl bg-white border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition"
              >
                Inspect System Logs
              </Link>
            </div>
          </section>

          {/* RECENT REPORTS */}
          <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Recent Safety Timeline
            </h2>
            <div className="mt-4 divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="py-3.5 animate-pulse">
                    <div className="h-4 w-1/2 rounded bg-neutral-100" />
                    <div className="h-3 w-1/3 rounded bg-neutral-100 mt-1" />
                  </div>
                ))
              ) : summary?.recentReports && summary.recentReports.length > 0 ? (
                summary.recentReports.map((report) => (
                  <div key={report._id} className="py-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-neutral-800 truncate">{report.reason}</p>
                      <AdminStatusBadge status={report.status} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">Reported: {new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-neutral-400">
                  No recent active reports.
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </AdminShell>
  );
}
