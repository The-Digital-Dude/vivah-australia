'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

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
    void memberRequest('/api/admin/fraud/events').then((result) => {
      if (result.ok) setEvents((result.data as { events?: FraudEvent[] }).events ?? []);
      else setMessage(result.message);
    });
  }, [memberRequest]);

  return (
    <AdminShell
      title="Fraud prevention"
      subtitle="Review rule-based fraud and abuse signals. Current rules flag high-velocity profile viewing and create an auditable queue for future enforcement."
    >
      {message ? (
        <p className="mb-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}
      <div className="grid gap-3">
        {events.map((event) => (
          <article key={event._id} className="rounded-lg border border-[#7A1E3A]/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-[#7A1E3A]" />
                <div>
                  <h2 className="font-semibold">{event.rule}</h2>
                  <p className="text-sm text-[#5E6470]">
                    {event.severity} · {event.status} · score {event.score}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#5E6470]">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-[#FFF8F1] p-3 text-xs text-[#5E6470]">
              {JSON.stringify(event.metadata ?? {}, null, 2)}
            </pre>
          </article>
        ))}
        {!events.length ? (
          <p className="text-sm text-[#5E6470]">No fraud events have been recorded.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
