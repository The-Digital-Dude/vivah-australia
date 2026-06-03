'use client';

import { useEffect, useState } from 'react';
import { UserCheck, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Flag, ShieldCheck } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';

interface ReportItem {
  _id: string;
  targetType: string;
  reason: string;
  severity: string;
  status: string;
  reporterId?: string;
  reportedUserId?: string;
  createdAt: string;
}

export default function AdminReports() {
  const memberRequest = useMemberRequest();
  const [status, setStatus] = useState('OPEN');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Triage dialog overlay state
  const [activeAction, setActiveAction] = useState<{
    id: string;
    action: 'ASSIGN' | 'RESOLVE' | 'DISMISS' | 'WARN' | 'SUSPEND';
  } | null>(null);
  const [operatorNote, setOperatorNote] = useState('');
  const [confirmSafety, setConfirmSafety] = useState(false);

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
    if (!activeAction) return;
    const { id, action } = activeAction;

    // Enforce justification for high severity changes
    if ((action === 'RESOLVE' || action === 'DISMISS') && !operatorNote.trim()) {
      setMessage('A resolution detail note must be supplied for accountability logs.');
      return;
    }

    const result = await memberRequest(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: { 
        action,
        ...(operatorNote ? { note: operatorNote } : {})
      },
    });

    setMessage(result.message);
    setActiveAction(null);
    setOperatorNote('');
    setConfirmSafety(false);
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
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
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
        <div className="rounded-xl bg-[#FFF9F5] border border-[#D4A04C]/30 p-3.5 text-xs font-semibold text-neutral-800 flex items-center gap-2 animate-in fade-in">
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
              className="rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition duration-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    report.severity === 'HIGH' || report.severity === 'CRITICAL'
                      ? 'bg-rose-50 border border-rose-250 text-rose-800'
                      : 'bg-amber-50 border border-amber-250 text-amber-800'
                  }`}>
                    {report.severity} Severity
                  </span>
                  <span className="rounded-full bg-neutral-50 border border-neutral-200 px-2.5 py-0.5 text-[10px] font-bold text-neutral-600">
                    {report.targetType}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    ID: <code className="font-mono text-[10px] bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">{report._id.slice(-8).toUpperCase()}</code>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
                <AdminStatusBadge status={report.status} />
              </div>

              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-neutral-750 font-bold">
                  Complaint Reason:
                </p>
                <p className="text-xs leading-relaxed text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100 font-medium">
                  {report.reason}
                </p>
              </div>

              {/* Show context details if available */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs border-t border-neutral-100 pt-3 text-neutral-500 font-medium">
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Reporter User ID</span>
                  <span className="font-mono">{report.reporterId ?? 'Anonymous / Unknown'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Reported User ID</span>
                  <span className="font-mono">{report.reportedUserId ?? 'Unknown Target'}</span>
                </div>
              </div>

              {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
                <div className="flex flex-wrap gap-2 pt-3.5 border-t border-neutral-100">
                  {report.status === 'OPEN' && (
                    <button
                      onClick={() => setActiveAction({ id: report._id, action: 'ASSIGN' })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-bold text-[#2F2F2F] hover:bg-neutral-50 transition shadow-sm"
                      type="button"
                    >
                      <UserCheck className="size-3.5 text-neutral-500" />
                      <span>Claim Report</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveAction({ id: report._id, action: 'RESOLVE' })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                    type="button"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Resolve</span>
                  </button>

                  <button
                    onClick={() => setActiveAction({ id: report._id, action: 'DISMISS' })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-250 text-[#2F2F2F] px-3 text-xs font-bold hover:bg-rose-50/50 transition bg-white"
                    type="button"
                  >
                    <XCircle className="size-3.5 text-neutral-500" />
                    <span>Dismiss</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white shadow-sm">
            <Flag className="h-8 w-8 text-neutral-300" />
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Safety Queue Clear</h3>
            <p className="mt-1 text-xs text-neutral-450">No reports found matching this queue state.</p>
          </div>
        )}
      </div>

      {/* CONFIRMATION / TRIAGE ACTIONS OVERLAY */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setActiveAction(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#A10E4D]" />
              Confirm Safety Triage Decision
            </h3>
            
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Applying operations command <strong className="text-[#A10E4D] uppercase">{activeAction.action}</strong> to safety ticket.
            </p>

            <div className="mt-4 space-y-4">
              {(activeAction.action === 'RESOLVE' || activeAction.action === 'DISMISS') && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Resolution Justification Note *
                  </label>
                  <textarea
                    required
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    placeholder="Provide a mandatory reason or reference link explaining safety resolution details..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-250 p-3 text-xs outline-none focus:border-[#A10E4D] min-h-[80px]"
                  />
                </div>
              )}

              <div className="flex items-start gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                <input
                  type="checkbox"
                  id="confirm-safety-ch"
                  checked={confirmSafety}
                  onChange={(e) => setConfirmSafety(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 rounded text-[#A10E4D] focus:ring-[#A10E4D]/20 cursor-pointer"
                />
                <label htmlFor="confirm-safety-ch" className="text-xs text-neutral-600 font-semibold cursor-pointer select-none">
                  I confirm that I verified the reported action context and my decision satisfies trust & safety policies.
                </label>
              </div>
            </div>

            {/* Audit / accountability warning */}
            <div className="mt-4 flex gap-2.5 items-start bg-amber-50/50 border border-amber-250 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-850 leading-relaxed">
                <strong>Safety Operator Warning:</strong> Resolving or dismissing safety items writes directly to the system audit trail. Operator signature will be logged.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveAction(null)}
                className="rounded-xl border border-neutral-250 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 bg-white transition"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmUpdate()}
                disabled={!confirmSafety}
                className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] disabled:bg-neutral-350 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white shadow-md transition"
                type="button"
              >
                Confirm Triage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
