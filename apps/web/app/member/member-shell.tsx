'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { useMemberRequest } from '@/lib/member-api';

const memberLinks = [
  ['Onboarding', '/member/onboarding'],
  ['Verification', '/member/verification'],
  ['Notifications', '/member/notifications'],
  ['Matches', '/member/matches'],
  ['Recently viewed', '/member/recently-viewed'],
  ['Interests', '/member/interests'],
  ['Messages', '/member/messages'],
  ['Community', '/member/community'],
  ['Favourites', '/member/favourites'],
  ['Edit profile', '/member/profile/edit'],
  ['Media', '/member/media'],
  ['Subscription', '/member/subscription'],
  ['Settings', '/member/settings'],
  ['Safety', '/member/safety'],
] as const;

export default function MemberShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  const router = useRouter();
  const { initialized, token } = useAuth();
  const memberRequest = useMemberRequest();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (initialized && !token) {
      router.replace('/login');
    }
  }, [initialized, router, token]);

  useEffect(() => {
    if (!initialized || !token) {
      return;
    }
    void (async () => {
      const result = await memberRequest('/api/me/notifications?unreadOnly=true');
      if (result.ok) {
        setUnreadCount((result.data as { unreadCount?: number }).unreadCount ?? 0);
      }
    })();
  }, [initialized, memberRequest, token]);

  if (!initialized || !token) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
        <p className="mx-auto max-w-6xl text-sm font-semibold text-red-700">
          Member login required.
        </p>
      </main>
    );
  }

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{subtitle}</p>
            </div>
            <Link
              href="/member/notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-700 px-1.5 text-center text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
