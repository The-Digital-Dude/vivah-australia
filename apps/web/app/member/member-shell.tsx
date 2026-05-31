import Link from 'next/link';
import type { ReactNode } from 'react';

const memberLinks = [
  ['Onboarding', '/member/onboarding'],
  ['Matches', '/member/matches'],
  ['Interests', '/member/interests'],
  ['Favourites', '/member/favourites'],
  ['Edit profile', '/member/profile/edit'],
  ['Media', '/member/media'],
  ['Settings', '/member/settings'],
  ['Safety', '/member/safety'],
] as const;

export default function MemberShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-neutral-200 bg-white p-4">
          <Link href="/" className="font-semibold text-red-700">
            Vivah Australia
          </Link>
          <nav className="mt-6 grid gap-2 text-sm">
            {memberLinks.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 hover:bg-neutral-100">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
