'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';

interface ReportItem {
  _id: string;
  targetType: string;
  reason: string;
  severity: string;
  status: string;
  createdAt: string;
}

export default function AdminReports() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('OPEN');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load(nextStatus = status) {
    const result = await memberRequest(`/api/admin/reports?status=${nextStatus}`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setReports((result.data as { reports?: ReportItem[] }).reports ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, action: 'ASSIGN' | 'RESOLVE' | 'DISMISS') {
    const result = await memberRequest(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: { action },
    });
    setMessage(result.message);
    if (result.ok) {
      await load();
    }
  }

  function switchStatus(nextStatus: string) {
    setStatus(nextStatus);
    void load(nextStatus);
  }

  return (
    <section className="grid gap-4 rounded-lg border border-[#F0D6DA] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['OPEN', 'ASSIGNED', 'RESOLVED', 'DISMISSED'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchStatus(item)}
              className={`h-9 rounded-md px-3 text-xs font-semibold ${
                status === item
                  ? 'bg-[#7A1E3A] text-white'
                  : 'border border-[#F0D6DA] text-[#5E6470]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p className="rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-3">
        {reports.map((report) => (
          <article key={report._id} className="grid gap-3 rounded-md border border-[#F0D6DA] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#FDECEF] px-2.5 py-1 text-xs font-bold text-[#7A1E3A]">
                {report.severity}
              </span>
              <span className="rounded-full bg-[#FFF8F1] px-2.5 py-1 text-xs font-semibold text-[#5E6470]">
                {report.targetType}
              </span>
              <span className="text-xs text-[#5E6470]">
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm leading-6 text-[#232323]">{report.reason}</p>
            <div className="flex flex-wrap gap-2">
              <Action
                label="Assign"
                icon={<UserCheck className="size-3.5" />}
                onClick={() => void update(report._id, 'ASSIGN')}
              />
              <Action
                label="Resolve"
                icon={<CheckCircle2 className="size-3.5" />}
                onClick={() => void update(report._id, 'RESOLVE')}
              />
              <Action
                label="Dismiss"
                icon={<XCircle className="size-3.5" />}
                onClick={() => void update(report._id, 'DISMISS')}
              />
            </div>
          </article>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#D6A84F] p-6 text-center text-sm text-[#5E6470]">
          No reports in this queue.
        </p>
      ) : null}
    </section>
  );
}

function Action({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon: React.ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#F0D6DA] px-3 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]"
    >
      {icon}
      {label}
    </button>
  );
}
