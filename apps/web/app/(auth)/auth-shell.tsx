import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <Link href="/" className="text-sm font-semibold text-red-700">
          Vivah Australia
        </Link>
        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
