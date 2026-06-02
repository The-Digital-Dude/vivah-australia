'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AdminGuard from './admin-guard';

const links = [
  ['Dashboard', '/admin/dashboard'],
  ['Users', '/admin/users'],
  ['Profiles', '/admin/profiles'],
  ['Verifications', '/admin/verifications'],
  ['Media', '/admin/media'],
  ['Reports', '/admin/reports'],
  ['Moderation', '/admin/moderation'],
  ['Community', '/admin/community'],
  ['CMS', '/admin/cms'],
  ['Payments', '/admin/payments'],
  ['Analytics', '/admin/analytics'],
  ['Fraud', '/admin/fraud'],
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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = (
    <nav className="mt-6 grid gap-1 text-sm">
      {links.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenuOpen(false)}
          className={`rounded-md px-3 py-2 font-medium ${
            pathname === href ? 'bg-[#7A1E3A] text-white' : 'text-[#5E6470] hover:bg-[#FFF8F1]'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#FFF8F1] px-4 py-8 text-[#232323]">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden rounded-lg border border-[#7A1E3A]/10 bg-white p-4 shadow-sm lg:block">
            <Link href="/admin/dashboard" className="font-semibold text-[#7A1E3A]">
              Vivah Admin
            </Link>
            {navigation}
          </aside>
          {menuOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                aria-label="Close menu"
                className="absolute inset-0 bg-black/30"
                type="button"
                onClick={() => setMenuOpen(false)}
              />
              <aside className="relative h-full w-72 overflow-y-auto bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <Link href="/admin/dashboard" className="font-semibold text-[#7A1E3A]">
                    Vivah Admin
                  </Link>
                  <button
                    aria-label="Close menu"
                    className="rounded-md border border-[#7A1E3A]/10 p-2"
                    type="button"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {navigation}
              </aside>
            </div>
          ) : null}
          <section className="rounded-lg border border-[#7A1E3A]/10 bg-white p-6 shadow-sm">
            <button
              aria-label="Open menu"
              className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#7A1E3A]/10 lg:hidden"
              type="button"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
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
