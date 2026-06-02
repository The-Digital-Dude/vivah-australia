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
  Layers,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
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
      description: 'Registered user base',
    },
    {
      label: 'Active Members',
      value: summary?.activeUsers ?? 0,
      icon: TrendingUp,
      description: 'Logged in recently',
    },
    {
      label: 'Pending Profiles',
      value: summary?.pendingProfiles ?? 0,
      icon: Shield,
      description: 'Awaiting moderation',
      trend: summary?.pendingProfiles && summary.pendingProfiles > 0 ? 'Action Required' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Pending Verifications',
      value: summary?.pendingVerifications ?? 0,
      icon: FileCheck,
      description: 'Document review queue',
      trend: summary?.pendingVerifications && summary.pendingVerifications > 0 ? 'Awaiting Review' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Open Reports',
      value: summary?.openReports ?? 0,
      icon: Flag,
      description: 'Safety complaints open',
      trend: summary?.openReports && summary.openReports > 0 ? 'Urgent' : undefined,
      trendType: 'negative' as const,
    },
    {
      label: 'Pending Media',
      value: summary?.pendingMedia ?? 0,
      icon: ImageIcon,
      description: 'Photos under moderation',
    },
    {
      label: 'Active Subscriptions',
      value: summary?.activeSubscriptions ?? 0,
      icon: CreditCard,
      description: 'Premium billing active',
    },
    {
      label: 'Monthly Revenue',
      value: `$${(((summary?.monthlyRevenue ?? 0)) / 100).toFixed(2)}`,
      icon: Layers,
      description: 'Gross volume this month',
    },
  ];

  return (
    <AdminShell
      title="Admin Command Center"
      subtitle={`Operations dashboard status: All systems operational. Context: ${new Date().toLocaleDateString(
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
                className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white"
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
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Priority Operational Queues</h2>
            <p className="text-xs text-neutral-400 mt-1">Review urgent items that block users or safety.</p>
            
            <div className="mt-4 space-y-3">
              <Link
                href="/admin/profiles"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 transition hover:bg-neutral-50"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Profiles Moderation</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Approve new signups or profile changes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-250 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {summary?.pendingProfiles ?? 0} pending
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/verifications"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 transition hover:bg-neutral-50"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Identity & Document Verifications</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Upgrade trust badges and check documents</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-250 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {summary?.pendingVerifications ?? 0} pending
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 transition hover:bg-neutral-50"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Abuse Reports Triage</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Investigate safety and behavioral reports</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-50 border border-rose-250 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                    {summary?.openReports ?? 0} active
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>
            </div>
          </section>

          {/* RECENT REGISTRATIONS */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Recent Registrations</h2>
            <div className="mt-4 divide-y divide-neutral-150">
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
                      <p className="text-sm font-bold text-neutral-800">{user.email ?? 'No email provided'}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-neutral-400">
                  No recent registrations found.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* QUICK ACTIONS & RECENT REPORTS */}
        <div className="space-y-6">
          {/* QUICK ACTIONS */}
          <section className="rounded-2xl border border-[#7A1F2B]/10 bg-[#F8E8E8]/40 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#7A1F2B]">Operational Shortcuts</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/admin/profiles"
                className="flex items-center justify-center rounded-xl bg-white border border-[#7A1F2B]/20 py-2.5 text-sm font-bold text-[#7A1F2B] shadow-sm hover:bg-[#F8E8E8] transition"
              >
                Review Profiles
              </Link>
              <Link
                href="/admin/verifications"
                className="flex items-center justify-center rounded-xl bg-white border border-[#7A1F2B]/20 py-2.5 text-sm font-bold text-[#7A1F2B] shadow-sm hover:bg-[#F8E8E8] transition"
              >
                Verify Documents
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-center rounded-xl bg-[#7A1F2B] py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#651925] transition"
              >
                Resolve Safety Reports
              </Link>
              <Link
                href="/admin/payments"
                className="flex items-center justify-center rounded-xl bg-white border border-neutral-250 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition"
              >
                Manage Subscriptions
              </Link>
              <Link
                href="/admin/cms"
                className="flex items-center justify-center rounded-xl bg-white border border-neutral-250 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition"
              >
                Edit CMS Content
              </Link>
            </div>
          </section>

          {/* RECENT REPORTS */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Abuse Reports Timeline</h2>
            <div className="mt-4 divide-y divide-neutral-150">
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
                    <p className="text-xs text-neutral-450 mt-1">Submitted: {new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-neutral-450">
                  Clean slate. No recent abuse reports.
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </AdminShell>
  );
}


