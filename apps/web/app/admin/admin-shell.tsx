'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import AdminGuard from './admin-guard';

const links = [
  ['Dashboard', '/admin/dashboard'],
  ['Users', '/admin/users'],
  ['Profiles', '/admin/profiles'],
  ['Verifications', '/admin/verifications'],
  ['Media', '/admin/media'],
  ['Reports', '/admin/reports'],
  ['Payments', '/admin/payments'],
  ['Audit logs', '/admin/audit-logs'],
] as const;

export default function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#FFF8F1] px-4 py-8 text-[#232323]">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-lg border border-[#7A1E3A]/10 bg-white p-4 shadow-sm">
            <Link href="/admin/dashboard" className="font-semibold text-[#7A1E3A]">
              Vivah Admin
            </Link>
            <nav className="mt-6 grid gap-1 text-sm">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-2 font-medium ${
                    pathname === href
                      ? 'bg-[#7A1E3A] text-white'
                      : 'text-[#5E6470] hover:bg-[#FFF8F1]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <section className="rounded-lg border border-[#7A1E3A]/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
              Admin CRM
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E6470]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
