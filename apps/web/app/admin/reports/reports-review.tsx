'use client';

import { useEffect, useState } from 'react';
import { UserCheck, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';

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
  const [loading, setLoading] = useState(true);

  // Confirmation overlay state
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: 'ASSIGN' | 'RESOLVE' | 'DISMISS';
  } | null>(null);

  async function load(nextStatus = status) {
    setLoading(true);
    const result = await memberRequest(`/api/admin/reports?status=${nextStatus}`);
    if (!result.ok) {
      setMessage(result.message);
      setLoading(false);
      return;
    }
    setReports((result.data as { reports?: ReportItem[] }).reports ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleConfirmUpdate() {
    if (!confirmAction) return;
    const { id, action } = confirmAction;

    const result = await memberRequest(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: { action },
    });

    setMessage(result.message);
    setConfirmAction(null);
    if (result.ok) {
      await load();
    }
  }

  function switchStatus(nextStatus: string) {
    setStatus(nextStatus);
    void load(nextStatus);
  }

  return (
    <div className="space-y-6">
      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {['OPEN', 'ASSIGNED', 'RESOLVED', 'DISMISSED'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchStatus(item)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                status === item
                  ? 'bg-[#A10E4D] text-white shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      {/* REPORTS LIST */}
      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white"
            />
          ))
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report._id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4 hover:shadow transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    report.severity === 'HIGH' || report.severity === 'CRITICAL'
                      ? 'bg-rose-50 border border-rose-250 text-rose-800'
                      : 'bg-amber-50 border border-amber-250 text-amber-800'
                  }`}>
                    {report.severity} Severity
                  </span>
                  <span className="rounded-full bg-neutral-50 border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                    {report.targetType}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    ID: <code className="font-mono text-[11px] bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">{report._id.slice(-8).toUpperCase()}</code>
                  </span>
                  <span className="text-xs text-neutral-450">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
                <AdminStatusBadge status={report.status} />
              </div>

              <p className="text-sm leading-relaxed text-neutral-750 font-medium">
                {report.reason}
              </p>

              {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                  {report.status === 'OPEN' && (
                    <button
                      onClick={() => setConfirmAction({ id: report._id, action: 'ASSIGN' })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                      type="button"
                    >
                      <UserCheck className="size-3.5 text-neutral-500" />
                      <span>Claim Report</span>
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction({ id: report._id, action: 'RESOLVE' })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    type="button"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                  <button
                    onClick={() => setConfirmAction({ id: report._id, action: 'DISMISS' })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 text-rose-700 px-3 text-xs font-bold hover:bg-rose-50 transition"
                    type="button"
                  >
                    <XCircle className="size-3.5" />
                    <span>Dismiss Report</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white">
            <span className="text-3xl">🛡️</span>
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Safety Queue Clear</h3>
            <p className="mt-1 text-xs text-neutral-450">No reports found matching this queue state.</p>
          </div>
        )}
      </div>

      {/* CONFIRMATION OVERLAY */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setConfirmAction(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
            aria-label="Close Dialog"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-neutral-900">
              Confirm Safety Triage Action
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Are you sure you want to perform the following action:{' '}
              <strong className="text-[#A10E4D]">{confirmAction.action}</strong>?
            </p>

            <div className="mt-4 flex gap-2.5 items-start bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-850 leading-relaxed">
                <strong>Audit Compliance Warning:</strong> Resolving or dismissing safety items writes directly to the immutable system audit trail. Make sure you verified the reported member details.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmUpdate()}
                className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm"
                type="button"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
