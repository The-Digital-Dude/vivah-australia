'use client';

import { useEffect, useState, type FormEvent } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const memberRequest = useMemberRequest();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (action.trim()) params.set('action', action.trim());
    if (entityType.trim()) params.set('entityType', entityType.trim());
    const result = await memberRequest(`/api/admin/audit-logs?${params.toString()}`);
    if (result.ok) setLogs((result.data as { logs?: AuditLogItem[] }).logs ?? []);
    else setMessage(result.message);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminShell
      title="Audit logs"
      subtitle="Review admin actions across users, profiles, verification, reports, and billing."
    >
      <form
        onSubmit={submit}
        className="mb-5 grid gap-3 rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4 md:grid-cols-[1fr_180px_auto]"
      >
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Filter by action"
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
        />
        <input
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          placeholder="Entity type"
          className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm"
        />
        <button className="h-11 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>
      {message ? <p className="mb-4 text-sm text-[#7A1E3A]">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-[#5E6470]">
            <tr>
              <th className="py-3">Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="py-3 font-medium">{log.action}</td>
                <td>
                  {log.actorRole ?? '-'} {log.actorId ? `· ${log.actorId}` : ''}
                </td>
                <td>
                  {log.targetType ?? '-'} {log.targetId ? `· ${log.targetId}` : ''}
                </td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
