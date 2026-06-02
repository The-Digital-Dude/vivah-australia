'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bell,
  ChevronRight,
  Crown,
  Grid2x2,
  Heart,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { PublicFooter, PublicHeader, SectionHeader } from '@/app/components';
import { useMemberRequest } from '@/lib/member-api';

interface ShellProfileData {
  moderation?: { approvalStatus: string };
  personal?: { firstName?: string };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matches: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const primaryNav: NavItem[] = [
  {
    label: 'Discover',
    href: '/member/matches',
    icon: Grid2x2,
    matches: ['/member', '/member/matches'],
  },
  {
    label: 'Messages',
    href: '/member/messages',
    icon: MessageSquare,
    matches: ['/member/messages'],
  },
  {
    label: 'Activity',
    href: '/member/activity',
    icon: Heart,
    matches: [
      '/member/activity',
      '/member/interests',
      '/member/favourites',
      '/member/recently-viewed',
      '/member/profile-viewers',
      '/member/notifications',
      '/member/photo-requests',
    ],
  },
  {
    label: 'Membership',
    href: '/member/subscription',
    icon: Crown,
    matches: ['/member/subscription'],
  },
  {
    label: 'Profile',
    href: '/member/profile',
    icon: UserCircle2,
    matches: [
      '/member/profile',
      '/member/media',
      '/member/settings',
      '/member/safety',
      '/member/verification',
      '/member/onboarding',
    ],
  },
];

const navGroups: NavGroup[] = [
  {
    title: 'Discover',
    items: [
      {
        label: 'Match discovery',
        href: '/member/matches',
        icon: Grid2x2,
        matches: ['/member/matches'],
      },
      {
        label: 'Messages',
        href: '/member/messages',
        icon: MessageSquare,
        matches: ['/member/messages'],
      },
    ],
  },
  {
    title: 'Activity',
    items: [
      {
        label: 'Activity hub',
        href: '/member/activity',
        icon: Heart,
        matches: ['/member/activity'],
      },
      {
        label: 'Received interests',
        href: '/member/interests',
        icon: Heart,
        matches: ['/member/interests'],
      },
      {
        label: 'Favourites',
        href: '/member/favourites',
        icon: Heart,
        matches: ['/member/favourites'],
      },
      {
        label: 'Recently viewed',
        href: '/member/recently-viewed',
        icon: Grid2x2,
        matches: ['/member/recently-viewed'],
      },
      {
        label: 'Who viewed me',
        href: '/member/profile-viewers',
        icon: UserCircle2,
        matches: ['/member/profile-viewers'],
      },
      {
        label: 'Notifications',
        href: '/member/notifications',
        icon: Bell,
        matches: ['/member/notifications'],
      },
      {
        label: 'Photo requests',
        href: '/member/photo-requests',
        icon: ShieldCheck,
        matches: ['/member/photo-requests'],
      },
    ],
  },
  {
    title: 'Profile and membership',
    items: [
      {
        label: 'Edit profile',
        href: '/member/profile/edit',
        icon: UserCircle2,
        matches: ['/member/profile/edit'],
      },
      {
        label: 'Photos and media',
        href: '/member/media',
        icon: UserCircle2,
        matches: ['/member/media'],
      },
      {
        label: 'Verification',
        href: '/member/verification',
        icon: ShieldCheck,
        matches: ['/member/verification'],
      },
      {
        label: 'Membership',
        href: '/member/subscription',
        icon: Crown,
        matches: ['/member/subscription'],
      },
      {
        label: 'Settings',
        href: '/member/settings',
        icon: Settings,
        matches: ['/member/settings'],
      },
      {
        label: 'Safety',
        href: '/member/safety',
        icon: ShieldCheck,
        matches: ['/member/safety'],
      },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function pathMatches(pathname: string, matches: string[]) {
  return matches.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export default function MemberShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  const pathname = usePathname();
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

  const visibleGroups = useMemo(
    () => navGroups,
    []
  );

  const visiblePrimary = useMemo(
    () => primaryNav,
    []
  );

  const firstName = shellProfile?.personal?.firstName ?? 'Member';
  const profileInitial = firstName.slice(0, 1).toUpperCase();

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

      <main
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8.5rem)' }}
      >
        <section className="overflow-hidden rounded-[32px] border border-[#7A1F2B]/10 bg-white shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
          <div className="border-b border-[#7A1F2B]/10 bg-[linear-gradient(180deg,rgba(252,250,247,0.95)_0%,rgba(255,255,255,1)_100%)] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Open member menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#7A1F2B]/15 text-[#7A1F2B] md:hidden"
                    type="button"
                    onClick={() => setMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                      Member space
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                      Welcome back, {firstName}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/member/notifications"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#7A1F2B]/15 bg-white text-[#7A1F2B] transition hover:bg-[#F8E8E8] sm:h-11 sm:w-11"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount ? (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#7A1F2B] px-1.5 text-center text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className="hidden items-center gap-3 rounded-full border border-[#7A1F2B]/15 bg-white px-3 py-2 text-left transition hover:bg-[#F8E8E8] md:inline-flex"
                    aria-label="Open profile and member menu"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7A1F2B] text-sm font-bold text-white">
                      {profileInitial}
                    </span>
                    <span className="pr-1">
                      <span className="block text-sm font-semibold text-[#1A1A1A]">{firstName}</span>
                      <span className="block text-xs text-[#6B7280]">Profile and shortcuts</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="hidden items-center gap-2 overflow-x-auto md:flex">
                {visiblePrimary.map((item) => {
                  const active = pathMatches(pathname, item.matches);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition whitespace-nowrap',
                        active
                          ? 'border-[#7A1F2B] bg-[#7A1F2B] text-white shadow-sm'
                          : 'border-[#7A1F2B]/10 bg-white text-[#6B7280] hover:bg-[#F8E8E8] hover:text-[#7A1F2B]',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {menuOpen ? (
            <div className="fixed inset-0 z-50">
              <button
                aria-label="Close member menu"
                className="absolute inset-0 bg-black/30"
                type="button"
                onClick={() => setMenuOpen(false)}
              />
              <aside
                className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-2xl"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#7A1F2B]/10 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                      Member menu
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">{firstName}</h3>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Jump between discovery, activity, membership, and profile tools.
                    </p>
                  </div>
                  <button
                    aria-label="Close member menu"
                    className="rounded-full border border-[#7A1F2B]/15 p-2 text-[#7A1F2B]"
                    type="button"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-6">
                  {visibleGroups.map((group) => (
                    <div key={group.title}>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                        {group.title}
                      </p>
                      <nav className="mt-3 grid gap-2">
                        {group.items.map((item) => {
                          const active = pathMatches(pathname, item.matches);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className={cx(
                                'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                active
                                  ? 'border-[#7A1F2B] bg-[#F8E8E8] text-[#7A1F2B]'
                                  : 'border-[#7A1F2B]/10 bg-white text-[#1A1A1A] hover:bg-[#FCFAF7]',
                              )}
                            >
                              <span className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-[#7A1F2B]" />
                                {item.label}
                              </span>
                              <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : null}

          <section className="px-4 py-5 sm:px-6 sm:py-6">
            <SectionHeader eyebrow="Member" title={title} subtitle={subtitle} />
            <div className="mt-5 sm:mt-6">{children}</div>
          </section>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#7A1F2B]/10 bg-white/95 shadow-[0_-12px_32px_rgba(122,31,43,0.08)] backdrop-blur-md md:hidden">
        <div
          className="mx-auto grid max-w-7xl grid-cols-5 gap-1 px-2 pt-2 pb-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
          {visiblePrimary.map((item) => {
            const active = pathMatches(pathname, item.matches);
            const Icon = item.icon;
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cx(
                  'flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-semibold transition-all duration-200 active:scale-95',
                  active
                    ? 'bg-[#7A1F2B] text-white shadow-md'
                    : 'text-[#6B7280] hover:bg-[#F8E8E8]/50 hover:text-[#7A1F2B]',
                )}
              >
                <Icon className={cx('mb-1 h-[18px] w-[18px]', active ? 'text-[#D4AF37]' : 'text-current')} />
                <span className={cx(active ? 'font-bold' : 'font-medium')}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PublicFooter />
    </div>
  );
}
