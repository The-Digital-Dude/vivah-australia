import type { ReactNode } from 'react';
import { PublicFooter, PublicHeader } from '@/app/components';

export default function AuthShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
