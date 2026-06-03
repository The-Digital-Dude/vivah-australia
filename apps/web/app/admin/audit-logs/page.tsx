'use client';

import { useEffect, useState, type FormEvent } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminDataTable } from '../components/admin-data-table';
import type { Column } from '../components/admin-data-table';
import { AlertCircle, Eye, X, Filter, History, Settings } from 'lucide-react';

interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function AdminAuditLogsPage() {
  const memberRequest = useMemberRequest();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Sliding Detail Drawer state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (action.trim()) params.set('action', action.trim());
    if (entityType.trim()) params.set('entityType', entityType.trim());
    const result = await memberRequest(`/api/admin/audit-logs?${params.toString()}`);
    if (result.ok) {
      setLogs((result.data as { logs?: AuditLogItem[] }).logs ?? []);
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'System Action',
      accessor: (log) => (
        <span className="font-extrabold text-[#2F2F2F] tracking-wide flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5 text-neutral-400" />
          {log.action}
        </span>
      ),
      sortKey: 'action',
    },
    {
      header: 'Operator Role',
      accessor: (log) => (
        <div>
          <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[9px] font-extrabold text-neutral-600 uppercase tracking-wider">
            {log.actorRole ?? 'SYSTEM'}
          </span>
          {log.actorId && (
            <code className="ml-2 font-mono text-[10px] text-neutral-450 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">
              {log.actorId.slice(-8).toUpperCase()}
            </code>
          )}
        </div>
      ),
      sortKey: 'actorRole',
    },
    {
      header: 'Target Entity',
      accessor: (log) => (
        <div>
          <span className="text-xs font-bold text-neutral-700">{log.targetType ?? 'NONE'}</span>
          {log.targetId && (
            <code className="ml-2 font-mono text-[10px] text-neutral-450 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-150">
              {log.targetId.slice(-8).toUpperCase()}
            </code>
          )}
        </div>
      ),
      sortKey: 'targetType',
    },
    {
      header: 'Timestamp',
      accessor: (log) => <span className="text-neutral-450 text-xs font-medium">{new Date(log.createdAt).toLocaleString()}</span>,
      sortKey: 'createdAt',
    },
    {
      header: 'Inspect',
      accessor: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-neutral-250 px-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 bg-white transition shadow-sm"
          type="button"
        >
          <Eye className="h-3.5 w-3.5 text-neutral-500" />
          <span>View Info</span>
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminShell
      title="System Audit Logs"
      subtitle="Immutable accountability ledger tracking all staff reviews, status updates, promotions, and refunds."
    >
      {/* FILTER SEARCH TOOLBAR */}
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-[#2F2F2F]/10 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_auto]"
      >
        <div className="relative">
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Filter by action type (e.g. UPDATE_STATUS, APPROVE_MEDIA)"
            className="h-11 w-full rounded-xl border border-neutral-250 bg-neutral-50 px-4 text-xs placeholder-neutral-400 outline-none focus:border-[#A10E4D] focus:bg-white transition"
          />
        </div>
        <div className="relative">
          <input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="Entity target (e.g. User, Page)"
            className="h-11 w-full rounded-xl border border-neutral-250 bg-neutral-50 px-4 text-xs placeholder-neutral-400 outline-none focus:border-[#A10E4D] focus:bg-white transition"
          />
        </div>
        <button className="h-11 rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-6 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Apply Filter</span>
        </button>
      </form>

      {message && (
        <div className="rounded-xl bg-[#FFF9F5] border border-[#D4A04C]/35 p-3.5 text-xs font-semibold text-neutral-800 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}

      {/* DATA TABLE */}
      <AdminDataTable
        data={logs}
        columns={columns}
        loading={loading}
        emptyTitle="No audit entries found"
        emptyDescription="Please adjust filters or check log records later."
      />

      {/* SLIDING DETAIL DRAWER OVERLAY */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-neutral-950/65 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Sliding drawer element */}
          <aside className="relative z-50 w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-[#A10E4D]" />
                    Audit Entry Inspector
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                    Log UUID: {selectedLog._id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Data list fields */}
              <div className="space-y-4 text-xs font-medium text-neutral-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">System Action</span>
                    <span className="font-extrabold text-[#2F2F2F]">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Actor Role</span>
                    <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[9px] font-extrabold text-neutral-700 uppercase tracking-wider">
                      {selectedLog.actorRole ?? 'SYSTEM'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Actor ID Reference</span>
                    <code className="font-mono text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-150 text-[10px]">
                      {selectedLog.actorId ?? 'SYSTEM'}
                    </code>
                  </div>
                  <div>
                    <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Target Entity Type</span>
                    <span className="font-bold text-[#2F2F2F]">{selectedLog.targetType ?? 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Target Entity UUID</span>
                  <code className="font-mono text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-150 text-[10px]">
                    {selectedLog.targetId ?? 'None'}
                  </code>
                </div>

                <div>
                  <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Timestamp</span>
                  <span className="text-neutral-500 font-semibold">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>

                {/* Metadata JSON diff board */}
                <div>
                  <span className="block font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1.5">Action Metadata / Payload</span>
                  <pre className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-[10px] font-mono leading-relaxed text-neutral-700 shadow-inner">
                    {JSON.stringify(selectedLog.metadata || { note: 'No metadata snapshot attached.' }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-neutral-250 px-4.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 bg-white transition w-full shadow-sm"
                type="button"
              >
                Close Inspector
              </button>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
