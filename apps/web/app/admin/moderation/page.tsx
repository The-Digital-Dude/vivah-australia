'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';

interface ModerationDashboard {
  counts: {
    pendingProfiles: number;
    pendingVerifications: number;
    openReports: number;
    assignedReports: number;
    pendingMedia: number;
  };
  queues: {
    profiles: Array<{
      _id: string;
      displayId: string;
      personal?: { firstName?: string; lastName?: string };
      updatedAt: string;
    }>;
    verifications: Array<{ _id: string; type: string; status: string; createdAt: string }>;
    reports: Array<{
      _id: string;
      reportedUserId?: string;
      targetType: string;
      targetId?: string;
      severity: string;
      reason: string;
      status: string;
      createdAt: string;
    }>;
  };
}

export default function AdminModerationPage() {
  const memberRequest = useMemberRequest();
  const [dashboard, setDashboard] = useState<ModerationDashboard | null>(null);
  const [message, setMessage] = useState('');

  async function loadDashboard() {
    const result = await memberRequest('/api/admin/moderation/dashboard');
    if (result.ok) setDashboard(result.data as ModerationDashboard);
    else setMessage(result.message);
  }

  async function applyAction(
    reportId: string,
    action: 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS',
  ) {
    const result = await memberRequest(`/api/admin/moderation/reports/${reportId}/action`, {
      method: 'PATCH',
      body: { action },
    });
    setMessage(result.message);
    if (result.ok) await loadDashboard();
  }

  useEffect(() => {
    void loadDashboard();
  }, [memberRequest]);

  return (
    <AdminShell
      title="Moderation Dashboard"
      subtitle="Combined overview of pending profiles, verification documents, safety reports, and uploaded media."
    >
      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Queue title="Profiles" href="/admin/profiles">
          {dashboard?.queues.profiles.map((profile) => (
            <Link
              key={profile._id}
              href="/admin/profiles"
              className="block rounded-xl border border-neutral-150 p-4 transition hover:bg-neutral-50 bg-neutral-50/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">{profile.displayId}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {[profile.personal?.firstName, profile.personal?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Unnamed profile'}
              </p>
            </Link>
          ))}
          {(!dashboard?.queues.profiles || dashboard.queues.profiles.length === 0) && (
            <p className="text-xs text-neutral-450 italic py-4 text-center">Queue is clear</p>
          )}
        </Queue>

        <Queue title="Verifications" href="/admin/verifications">
          {dashboard?.queues.verifications.map((request) => (
            <Link
              key={request._id}
              href="/admin/verifications"
              className="block rounded-xl border border-neutral-150 p-4 transition hover:bg-neutral-50 bg-neutral-50/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800">{request.type}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
              </div>
              <div className="mt-2.5">
                <AdminStatusBadge status={request.status} />
              </div>
            </Link>
          ))}
          {(!dashboard?.queues.verifications || dashboard.queues.verifications.length === 0) && (
            <p className="text-xs text-neutral-450 italic py-4 text-center">Queue is clear</p>
          )}
        </Queue>

        <Queue title="Abuse Reports" href="/admin/reports">
          {dashboard?.queues.reports.map((report) => (
            <article key={report._id} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-2">
                <p className="text-xs font-bold text-neutral-850 truncate">
                  {report.severity} {report.targetType}
                </p>
                <AdminStatusBadge status={report.status} />
              </div>
              <p className="line-clamp-2 text-xs text-neutral-500">{report.reason}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <ModerationButton label="Warn" action="WARN" onClick={() => void applyAction(report._id, 'WARN')} />
                <ModerationButton label="Suspend" action="SUSPEND" onClick={() => void applyAction(report._id, 'SUSPEND')} />
                <ModerationButton label="Ban" action="BAN" onClick={() => void applyAction(report._id, 'BAN')} />
                <ModerationButton label="Remove" action="REMOVE_CONTENT" onClick={() => void applyAction(report._id, 'REMOVE_CONTENT')} />
                <ModerationButton label="Dismiss" action="DISMISS" onClick={() => void applyAction(report._id, 'DISMISS')} />
              </div>
            </article>
          ))}
          {(!dashboard?.queues.reports || dashboard.queues.reports.length === 0) && (
            <p className="text-xs text-neutral-450 italic py-4 text-center">Queue is clear</p>
          )}
        </Queue>
      </div>
    </AdminShell>
  );
}

const DESTRUCTIVE_ACTIONS = new Set(['BAN', 'REMOVE_CONTENT']);

function ModerationButton({
  label,
  action,
  onClick,
}: Readonly<{ label: string; action: 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS'; onClick: () => void }>) {
  const isDestructive = DESTRUCTIVE_ACTIONS.has(action);
  const isDismiss = action === 'DISMISS';
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isDestructive
          ? 'h-7 rounded-lg bg-rose-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-rose-700'
          : isDismiss
            ? 'h-7 rounded-lg border border-neutral-200 bg-white px-2.5 text-[10px] font-bold text-neutral-500 transition hover:bg-neutral-50'
            : 'h-7 rounded-lg bg-[#A10E4D] px-2.5 text-[10px] font-bold text-white transition hover:bg-[#890B40]'
      }
    >
      {label}
    </button>
  );
}

function Queue({ children, title, href }: Readonly<{ children: ReactNode; title: string; href: string }>) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        <Link href={href} className="text-xs font-bold text-[#A10E4D] hover:underline flex items-center gap-0.5">
          <span>View all</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
