'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../admin-shell';
import { useMemberRequest } from '@/lib/member-api';

interface Summary {
  totalUsers: number;
  activeUsers: number;
  pendingProfiles: number;
  pendingVerifications: number;
  openReports: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  recentUsers: Array<{ id: string; email?: string; role: string; createdAt: string }>;
  recentReports: Array<{ _id: string; reason: string; status: string; createdAt: string }>;
}

export default function AdminDashboardPage() {
  const memberRequest = useMemberRequest();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    void memberRequest('/api/admin/dashboard/summary').then((result) => {
      if (result.ok) setSummary(result.data as Summary);
    });
  }, []);

  const cards = [
    ['Total members', summary?.totalUsers ?? 0],
    ['Active members', summary?.activeUsers ?? 0],
    ['Pending profiles', summary?.pendingProfiles ?? 0],
    ['Pending verifications', summary?.pendingVerifications ?? 0],
    ['Open reports', summary?.openReports ?? 0],
    ['Active subscriptions', summary?.activeSubscriptions ?? 0],
    ['Monthly revenue', `$${((summary?.monthlyRevenue ?? 0) / 100).toFixed(2)}`],
  ];

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Operational snapshot for moderation, safety, and revenue."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4">
            <p className="text-sm text-[#5E6470]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#232323]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 p-4">
          <h2 className="font-semibold">Recent registrations</h2>
          <div className="mt-3 divide-y divide-neutral-100">
            {summary?.recentUsers?.map((user) => (
              <div key={user.id} className="py-3 text-sm">
                <p className="font-medium">{user.email ?? user.id}</p>
                <p className="text-[#5E6470]">{user.role}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-neutral-200 p-4">
          <h2 className="font-semibold">Recent reports</h2>
          <div className="mt-3 divide-y divide-neutral-100">
            {summary?.recentReports?.map((report) => (
              <div key={report._id} className="py-3 text-sm">
                <p className="font-medium">{report.status}</p>
                <p className="text-[#5E6470]">{report.reason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
