'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, BadgeCheck, FileWarning, ImageIcon, UserCheck } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

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
      targetType: string;
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

  useEffect(() => {
    void memberRequest('/api/admin/moderation/dashboard').then((result) => {
      if (result.ok) setDashboard(result.data as ModerationDashboard);
      else setMessage(result.message);
    });
  }, [memberRequest]);

  return (
    <AdminShell
      title="Moderation dashboard"
      subtitle="Combined queue for profiles, verification requests, reports, and media review."
    >
      {message ? (
        <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-5">
        <Metric
          icon={<UserCheck className="h-5 w-5" />}
          label="Pending profiles"
          value={dashboard?.counts.pendingProfiles ?? 0}
          href="/admin/profiles"
        />
        <Metric
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Verifications"
          value={dashboard?.counts.pendingVerifications ?? 0}
          href="/admin/verifications"
        />
        <Metric
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Open reports"
          value={dashboard?.counts.openReports ?? 0}
          href="/admin/reports"
        />
        <Metric
          icon={<FileWarning className="h-5 w-5" />}
          label="Assigned reports"
          value={dashboard?.counts.assignedReports ?? 0}
          href="/admin/reports"
        />
        <Metric
          icon={<ImageIcon className="h-5 w-5" />}
          label="Pending media"
          value={dashboard?.counts.pendingMedia ?? 0}
          href="/admin/media"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Queue title="Profiles">
          {dashboard?.queues.profiles.map((profile) => (
            <Link
              key={profile._id}
              href="/admin/profiles"
              className="block rounded-md border border-[#7A1E3A]/10 p-3 hover:bg-[#FFF8F1]"
            >
              <p className="font-semibold">{profile.displayId}</p>
              <p className="text-sm text-[#5E6470]">
                {[profile.personal?.firstName, profile.personal?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Unnamed profile'}
              </p>
            </Link>
          ))}
        </Queue>

        <Queue title="Verifications">
          {dashboard?.queues.verifications.map((request) => (
            <Link
              key={request._id}
              href="/admin/verifications"
              className="block rounded-md border border-[#7A1E3A]/10 p-3 hover:bg-[#FFF8F1]"
            >
              <p className="font-semibold">{request.type}</p>
              <p className="text-sm text-[#5E6470]">{request.status}</p>
            </Link>
          ))}
        </Queue>

        <Queue title="Reports">
          {dashboard?.queues.reports.map((report) => (
            <Link
              key={report._id}
              href="/admin/reports"
              className="block rounded-md border border-[#7A1E3A]/10 p-3 hover:bg-[#FFF8F1]"
            >
              <p className="font-semibold">
                {report.severity} {report.targetType}
              </p>
              <p className="line-clamp-2 text-sm text-[#5E6470]">{report.reason}</p>
            </Link>
          ))}
        </Queue>
      </div>
    </AdminShell>
  );
}

function Metric({
  href,
  icon,
  label,
  value,
}: Readonly<{ href: string; icon: ReactNode; label: string; value: number }>) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4 hover:border-[#7A1E3A]/30"
    >
      <div className="text-[#7A1E3A]">{icon}</div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Link>
  );
}

function Queue({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="rounded-lg border border-[#7A1E3A]/10 p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}
