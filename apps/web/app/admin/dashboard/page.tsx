'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminMetricCard, AdminStatusBadge } from '../components/admin-primitives';
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  DollarSign,
  FileCheck,
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
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

  const stats = useMemo(
    () => [
      {
        label: 'Total members',
        value: summary?.totalUsers ?? 0,
        icon: Users,
        description: 'All registered accounts',
      },
      {
        label: 'Active members',
        value: summary?.activeUsers ?? 0,
        icon: TrendingUp,
        description: 'Recent member activity',
      },
      {
        label: 'Premium members',
        value: summary?.activeSubscriptions ?? 0,
        icon: CreditCard,
        description: 'Current paid memberships',
      },
      {
        label: 'Pending verifications',
        value: summary?.pendingVerifications ?? 0,
        icon: FileCheck,
        description: 'Documents waiting review',
        trend: summary?.pendingVerifications ? 'Action needed' : undefined,
        trendType: 'negative' as const,
      },
      {
        label: 'Open safety reports',
        value: summary?.openReports ?? 0,
        icon: AlertTriangle,
        description: 'Trust and safety queue',
        trend: summary?.openReports ? 'Urgent triage' : undefined,
        trendType: 'negative' as const,
      },
      {
        label: 'Monthly revenue',
        value: formatCurrency(summary?.monthlyRevenue ?? 0),
        icon: DollarSign,
        description: 'Gross billing volume',
      },
    ],
    [summary],
  );

  const queueCards = [
    {
      title: 'Profile moderation',
      href: '/admin/profiles',
      count: summary?.pendingProfiles ?? 0,
      description: 'Approve new profiles and significant member edits.',
      tone: 'amber',
      icon: UserCheck,
    },
    {
      title: 'Document verifications',
      href: '/admin/verifications',
      count: summary?.pendingVerifications ?? 0,
      description: 'Review IDs, visas, selfies, and trust submissions.',
      tone: 'gold',
      icon: ShieldCheck,
    },
    {
      title: 'Media approvals',
      href: '/admin/media',
      count: summary?.pendingMedia ?? 0,
      description: 'Audit gallery uploads and private-photo states.',
      tone: 'slate',
      icon: ImageIcon,
    },
    {
      title: 'Safety reports',
      href: '/admin/reports',
      count: summary?.openReports ?? 0,
      description: 'Investigate flagged members, abuse, and scam risk.',
      tone: 'rose',
      icon: AlertTriangle,
    },
  ] as const;

  return (
    <AdminShell
      title="Operations Dashboard"
      subtitle="Trust, growth, and moderation signals across Vivah Australia."
    >
      {/* Compact stat strip */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            label: 'Trust pipeline',
            value: `${(summary?.pendingVerifications ?? 0) + (summary?.pendingProfiles ?? 0)}`,
            sub: 'awaiting review',
          },
          {
            label: 'Revenue',
            value: formatCurrency(summary?.monthlyRevenue ?? 0),
            sub: 'this month',
          },
          {
            label: 'Safety cases',
            value: `${summary?.openReports ?? 0}`,
            sub: 'open reports',
          },
        ].map((chip) => (
          <div
            key={chip.label}
            className="flex items-center gap-3 rounded-xl border border-[#2F2F2F]/10 bg-white px-4 py-2.5 shadow-sm"
          >
            <span className="text-xs font-semibold text-neutral-500">{chip.label}</span>
            <span className="text-sm font-bold text-[#2F2F2F]">{chip.value}</span>
            <span className="text-xs text-neutral-400">{chip.sub}</span>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-2xl border border-[#2F2F2F]/10 bg-white" />
            ))
          : stats.map((stat) => (
              <AdminMetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                description={stat.description}
                trend={stat.trend}
                trendType={stat.trendType}
              />
            ))}
      </section>

      {/* Priority queues */}
      <section className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-[#2F2F2F]">Priority queues</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queueCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-center justify-between rounded-xl border border-[#2F2F2F]/10 bg-neutral-50 px-4 py-3 transition hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white text-[#A10E4D] shadow-sm">
                  <card.icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2F2F2F]">{card.title}</p>
                  <p className="text-[11px] text-neutral-500">{card.count} pending</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-[#A10E4D]" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2F2F2F]">Recent registrations</h3>
            <Link href="/admin/users" className="text-xs font-semibold text-[#A10E4D]">View all</Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              ))
            ) : summary?.recentUsers?.length ? (
              summary.recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-[#2F2F2F]/8 bg-neutral-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#2F2F2F]">
                      {user.email ?? 'No email'}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#A10E4D] shadow-sm">
                    {user.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-neutral-400">No recent registrations.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2F2F2F]">Safety timeline</h3>
            <Link href="/admin/reports" className="text-xs font-semibold text-[#A10E4D]">View all</Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              ))
            ) : summary?.recentReports?.length ? (
              summary.recentReports.slice(0, 5).map((report) => (
                <div key={report._id} className="flex items-center justify-between rounded-xl border border-[#2F2F2F]/8 bg-neutral-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#2F2F2F]">{report.reason}</p>
                    <p className="text-[11px] text-neutral-400">
                      {new Date(report.createdAt).toLocaleString('en-AU')}
                    </p>
                  </div>
                  <AdminStatusBadge status={report.status} />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-neutral-400">No active reports.</p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
