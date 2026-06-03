'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminMetricCard, AdminStatusBadge } from '../components/admin-primitives';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  FileCheck,
  Image as ImageIcon,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
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
      icon: Shield,
    },
  ] as const;

  return (
    <AdminShell
      title="Operations Dashboard"
      subtitle={`Trust, growth, and moderation signals across Vivah Australia. Snapshot updated ${new Date().toLocaleDateString(
        'en-AU',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      )}.`}
    >
      <section className="overflow-hidden rounded-[32px] border border-[#A10E4D]/10 bg-[linear-gradient(135deg,#1F1F2E_0%,#2E1B2A_48%,#4A1735_100%)] p-7 text-white shadow-[0_30px_80px_rgba(31,31,46,0.24)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F7D78A]">
              <Sparkles className="size-3.5" />
              Operations overview
            </div>
            <h2 className="mt-4 font-playfair text-3xl font-semibold leading-tight sm:text-4xl">
              A calmer command centre for trust, memberships, and growth
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              Keep the platform safe, premium, and responsive with one clearer view of moderation,
              verification, paid memberships, and recent member activity.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: 'Trust pipeline',
                  value: `${(summary?.pendingVerifications ?? 0) + (summary?.pendingProfiles ?? 0)}`,
                  sub: 'items waiting review',
                },
                {
                  label: 'Revenue health',
                  value: formatCurrency(summary?.monthlyRevenue ?? 0),
                  sub: 'this month',
                },
                {
                  label: 'Safety pressure',
                  value: `${summary?.openReports ?? 0}`,
                  sub: 'active cases',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F7D78A]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-white/65">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F7D78A]">
                    Platform status
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">All key systems operational</h3>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/16 text-emerald-300">
                  <CheckCircle2 className="size-6" />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  'Verification queues visible and actionable',
                  'Paid member activity and revenue in one place',
                  'Safety escalation remains front-and-centre',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2 text-sm text-white/75">
                    <div className="mt-1 size-2 rounded-full bg-[#F7D78A]" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white p-5 text-[#2F2F2F] shadow-[0_18px_50px_rgba(31,31,46,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Quick actions
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  { href: '/admin/verifications', label: 'Approve verifications' },
                  { href: '/admin/profiles', label: 'Review pending profiles' },
                  { href: '/admin/payments', label: 'Manage subscriptions' },
                  { href: '/admin/reports', label: 'Resolve safety reports' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:border-[#A10E4D]/20 hover:bg-white"
                  >
                    {action.label}
                    <ArrowRight className="size-4 text-[#A10E4D]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-[28px] border border-[#2F2F2F]/10 bg-white" />
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-[#2F2F2F]/10 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Priority queues
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#2F2F2F]">Review what matters most first</h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Each queue routes to the same admin systems you already use, now surfaced with better hierarchy.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {queueCards.map((card) => {
              const toneClass =
                card.tone === 'rose'
                  ? 'bg-[linear-gradient(180deg,#FFF5F7_0%,#FFFFFF_100%)] border-rose-200/60'
                  : card.tone === 'amber'
                    ? 'bg-[linear-gradient(180deg,#FFF9EE_0%,#FFFFFF_100%)] border-amber-200/60'
                    : card.tone === 'gold'
                      ? 'bg-[linear-gradient(180deg,#FFF8EC_0%,#FFFFFF_100%)] border-[#D4A04C]/30'
                      : 'bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] border-slate-200/70';

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={cx(
                    'rounded-[26px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    toneClass,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#A10E4D] shadow-sm">
                      <card.icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#A10E4D] shadow-sm">
                      {card.count}
                    </span>
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-[#2F2F2F]">{card.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{card.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#A10E4D]">
                    Open queue
                    <ArrowRight className="size-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-[#2F2F2F]/10 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              Trust overview
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[#2F2F2F]">Daily platform health</h3>
            <div className="mt-5 space-y-4">
              {[
                {
                  label: 'Verification response',
                  value: summary?.pendingVerifications ?? 0,
                  helper: 'documents currently awaiting review',
                  icon: FileCheck,
                },
                {
                  label: 'Safety case load',
                  value: summary?.openReports ?? 0,
                  helper: 'active reports needing moderation',
                  icon: Shield,
                },
                {
                  label: 'Profile review pressure',
                  value: summary?.pendingProfiles ?? 0,
                  helper: 'profile approvals still queued',
                  icon: UserCheck,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 rounded-[22px] bg-[#FFF9F5] px-4 py-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#A10E4D] shadow-sm">
                    <item.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2F2F2F]">{item.label}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{item.helper}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-[#2F2F2F]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#2F2F2F]/10 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFFFFF_100%)] p-6 shadow-sm sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              Revenue & memberships
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-[#6B7280]">Active subscriptions</p>
                <p className="mt-2 text-3xl font-semibold text-[#2F2F2F]">
                  {summary?.activeSubscriptions ?? 0}
                </p>
              </div>
              <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-[#6B7280]">Monthly revenue</p>
                <p className="mt-2 text-3xl font-semibold text-[#2F2F2F]">
                  {formatCurrency(summary?.monthlyRevenue ?? 0)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-[30px] border border-[#2F2F2F]/10 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Recent registrations
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#2F2F2F]">New members entering review</h3>
            </div>
            <Link href="/admin/users" className="text-sm font-semibold text-[#A10E4D]">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-[22px] bg-[#FFF9F5]" />
              ))
            ) : summary?.recentUsers?.length ? (
              summary.recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="rounded-[22px] border border-[#A10E4D]/8 bg-[#FFF9F5] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2F2F2F]">
                        {user.email ?? 'No email available'}
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Joined {new Date(user.createdAt).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A10E4D]">
                      {user.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#A10E4D]/20 bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#6B7280]">
                No recent registrations available yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#2F2F2F]/10 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Safety timeline
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#2F2F2F]">Latest reports and outcomes</h3>
            </div>
            <Link href="/admin/reports" className="text-sm font-semibold text-[#A10E4D]">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-[22px] bg-[#FFF9F5]" />
              ))
            ) : summary?.recentReports?.length ? (
              summary.recentReports.slice(0, 5).map((report) => (
                <div key={report._id} className="rounded-[22px] border border-[#A10E4D]/8 bg-[#FFF9F5] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2F2F2F]">{report.reason}</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Reported {new Date(report.createdAt).toLocaleString('en-AU')}
                      </p>
                    </div>
                    <AdminStatusBadge status={report.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#A10E4D]/20 bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#6B7280]">
                No active safety timeline entries right now.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#2F2F2F]/10 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
            Control room
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2F2F2F]">Fast access to core admin tools</h3>
          <div className="mt-5 grid gap-3">
            {[
              { href: '/admin/dashboard', label: 'Dashboard overview', icon: Zap },
              { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
              { href: '/admin/cms', label: 'CMS workspace', icon: Sparkles },
              { href: '/admin/audit-logs', label: 'Audit logs', icon: Clock3 },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-4 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
              >
                <span className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-white text-[#A10E4D] shadow-sm">
                    <item.icon className="size-4" />
                  </div>
                  {item.label}
                </span>
                <ArrowRight className="size-4 text-[#A10E4D]" />
              </Link>
            ))}
          </div>
        </section>
      </section>
    </AdminShell>
  );
}
