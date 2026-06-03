'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';
import { AdminStatusBadge } from '../components/admin-status-badge';

interface FraudEvent {
  _id: string;
  userId?: string;
  rule: string;
  severity: string;
  status: string;
  score: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function AdminFraudPage() {
  const memberRequest = useMemberRequest();
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadEvents();
  }, [memberRequest]);

  async function loadEvents() {
    const result = await memberRequest('/api/admin/fraud/events');
    if (result.ok) setEvents((result.data as { events?: FraudEvent[] }).events ?? []);
    else setMessage(result.message);
  }

  async function reviewEvent(eventId: string, status: 'REVIEWED' | 'DISMISSED') {
    const result = await memberRequest(`/api/admin/fraud/events/${eventId}`, {
      method: 'PATCH',
      body: { status },
    });
    setMessage(result.ok ? `Fraud event ${status.toLowerCase()}.` : result.message);
    if (result.ok) {
      await loadEvents();
    }
  }

  return (
    <AdminShell
      title="Fraud Detection Console"
      subtitle="Review automated rule-based abuse signals, velocity triggers, and anomaly indicators."
    >
      {message && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-3.5 text-sm font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-[#A10E4D]" />
          <span>{message}</span>
        </div>
      )}
      
      <div className="grid gap-4">
        {events.map((event) => (
          <article key={event._id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-800">{event.rule}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-rose-50 border border-rose-250 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                      {event.severity} Severity
                    </span>
                    <span className="text-neutral-400 font-semibold">·</span>
                    <span className="text-neutral-500">Score: {event.score}</span>
                    <span className="text-neutral-400 font-semibold">·</span>
                    <AdminStatusBadge status={event.status} />
                  </div>
                </div>
              </div>
              <span className="text-xs text-neutral-400 font-semibold">
                Logged: {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>

            {event.metadata && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Event Metadata</h3>
                <pre className="overflow-x-auto rounded-xl bg-neutral-50 border border-neutral-150 p-4 text-[10px] font-mono leading-relaxed text-neutral-600">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}

            {event.status === 'OPEN' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => void reviewEvent(event._id, 'DISMISSED')}
                  className="rounded-xl border border-neutral-250 bg-white hover:bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-700 shadow-sm transition"
                >
                  Dismiss Signal
                </button>
                <button
                  type="button"
                  onClick={() => void reviewEvent(event._id, 'REVIEWED')}
                  className="rounded-xl bg-[#A10E4D] hover:bg-[#890B40] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  Mark Reviewed
                </button>
              </div>
            )}
          </article>
        ))}

        {!events.length && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white">
            <span className="text-3xl">🛡️</span>
            <h3 className="mt-3 text-sm font-bold text-neutral-800">Clear Ledger</h3>
            <p className="mt-1 text-xs text-neutral-450">No fraud triggers or velocity alerts have been recorded.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
