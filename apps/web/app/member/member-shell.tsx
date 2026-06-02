'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { PublicFooter, PublicHeader, SectionHeader } from '@/app/components';
import { useMemberRequest } from '@/lib/member-api';

interface ShellProfileData {
  moderation?: { approvalStatus: string };
}

const memberLinks = [
  ['Onboarding', '/member/onboarding'],
  ['Verification', '/member/verification'],
  ['Notifications', '/member/notifications'],
  ['Matches', '/member/matches'],
  ['Recently viewed', '/member/recently-viewed'],
  ['Who viewed me', '/member/profile-viewers'],
  ['Photo requests', '/member/photo-requests'],
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [shellProfile, setShellProfile] = useState<ShellProfileData | null>(null);

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
      const [notifResult, profileResult] = await Promise.all([
        memberRequest('/api/me/notifications?unreadOnly=true'),
        memberRequest('/api/me/profile'),
      ]);
      if (notifResult.ok) {
        setUnreadCount((notifResult.data as { unreadCount?: number }).unreadCount ?? 0);
      }
      if (profileResult.ok && profileResult.data) {
        setShellProfile((profileResult.data as { profile: ShellProfileData }).profile);
      }
    })();
  }, [initialized, memberRequest, token]);

  // Approved members have completed verification — hide the submission route from nav
  const isApproved = shellProfile?.moderation?.approvalStatus === 'APPROVED';
  const visibleLinks = memberLinks.filter(
    ([, href]) => !(isApproved && href === '/member/verification'),
  );

  if (!initialized || !token) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
        <PublicHeader />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-6 text-sm font-semibold text-[#7A1F2B] shadow-sm">
            Member login required.
          </p>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 shadow-[0_18px_50px_rgba(122,31,43,0.08)] md:block">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Member</p>
          <nav className="mt-4 grid gap-1 text-sm">
            {visibleLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl px-3 py-2 font-semibold text-[#6B7280] transition hover:bg-[#F8E8E8] hover:text-[#7A1F2B]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        {menuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30"
              type="button"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative h-full w-72 overflow-y-auto bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#7A1F2B]">Member menu</p>
                <button
                  aria-label="Close menu"
                  className="rounded-full border border-[#7A1F2B]/15 p-2 text-[#7A1F2B]"
                  type="button"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-6 grid gap-2 text-sm">
                {visibleLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-3 py-2 font-semibold text-[#6B7280] hover:bg-[#F8E8E8] hover:text-[#7A1F2B]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        ) : null}
        <section className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.08)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                aria-label="Open menu"
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#7A1F2B]/15 text-[#7A1F2B] md:hidden"
                type="button"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <SectionHeader eyebrow="Member" title={title} subtitle={subtitle} />
            </div>
            <Link
              href="/member/notifications"
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7A1F2B]/15 bg-white text-[#7A1F2B] hover:bg-[#F8E8E8]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#7A1F2B] px-1.5 text-center text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
