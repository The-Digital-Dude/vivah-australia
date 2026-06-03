'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  ChevronRight,
  Crown,
  Grid2x2,
  Heart,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { PublicHeader, SectionHeader } from '@/app/components';
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
  badge?: 'notifications';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const primaryNav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/member',
    icon: Grid2x2,
    matches: ['/member'],
  },
  {
    label: 'Search',
    href: '/member/matches',
    icon: Search,
    matches: ['/member/matches'],
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
    label: 'Messages',
    href: '/member/messages',
    icon: MessageSquare,
    matches: ['/member/messages'],
    badge: 'notifications',
  },
  {
    label: 'Membership',
    href: '/member/subscription',
    icon: Crown,
    matches: ['/member/subscription'],
  },
];

const navGroups: NavGroup[] = [
  {
    title: 'Find connections',
    items: [
      {
        label: 'Dashboard',
        href: '/member',
        icon: Grid2x2,
        matches: ['/member'],
      },
      {
        label: 'Search profiles',
        href: '/member/matches',
        icon: Search,
        matches: ['/member/matches'],
      },
      {
        label: 'Messages',
        href: '/member/messages',
        icon: MessageSquare,
        matches: ['/member/messages'],
        badge: 'notifications',
      },
      {
        label: 'Connections',
        href: '/member/activity',
        icon: Users,
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
    ],
  },
  {
    title: 'Profile & trust',
    items: [
      {
        label: 'Edit profile',
        href: '/member/profile/edit',
        icon: UserCircle2,
        matches: ['/member/profile/edit', '/member/profile', '/member/media'],
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
        matches: ['/member/settings', '/member/safety'],
      },
      {
        label: 'Help & support',
        href: '/help',
        icon: LifeBuoy,
        matches: [],
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

function DesktopRail({
  firstName,
  pathname,
  unreadCount,
}: Readonly<{
  firstName: string;
  pathname: string;
  unreadCount: number;
}>) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-[#A10E4D]/10 bg-[linear-gradient(180deg,#FFFCFA_0%,#FFF7F1_100%)] px-5 py-6">
      <Link href="/" className="flex items-center gap-3 px-2">
        <Image
          src="/logo.png"
          alt="Vivah Australia Logo"
          width={150}
          height={60}
          className="w-auto object-contain"
          style={{ width: 'auto', height: '48px' }}
          priority
        />
      </Link>

      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto pr-1">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#B78A39]">
              {group.title}
            </p>
            <div className="mt-3 space-y-1.5">
              {group.items.map((item) => {
                const active = pathMatches(pathname, item.matches);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      'flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold transition',
                      active
                        ? 'bg-[#FFF0F3] text-[#A10E4D] shadow-[0_12px_28px_rgba(161,14,77,0.08)]'
                        : 'text-[#5F5F5F] hover:bg-white hover:text-[#A10E4D]',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cx(
                          'flex h-9 w-9 items-center justify-center rounded-2xl',
                          active ? 'bg-white text-[#A10E4D]' : 'bg-[#FFF6F3] text-[#A10E4D]',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      {item.label}
                    </span>
                    {item.badge === 'notifications' && unreadCount > 0 ? (
                      <span className="rounded-full bg-[#A10E4D] px-2 py-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-[28px] border border-[#D4A04C]/25 bg-[linear-gradient(180deg,#FFF7EC_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_45px_rgba(161,14,77,0.06)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1D2] text-[#B78A39]">
            <Crown className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2F2F2F]">Upgrade to Premium</p>
            <p className="text-xs leading-5 text-[#6B7280]">
              Unlock contacts, visibility, and stronger trust signals.
            </p>
          </div>
        </div>
        <Link
          href="/member/subscription"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#A10E4D] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(161,14,77,0.18)]"
        >
          Upgrade now
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#A10E4D]/10 bg-white px-4 py-4 text-sm text-[#5F5F5F] shadow-sm">
        <p className="font-semibold text-[#2F2F2F]">Welcome back, {firstName}</p>
        <p className="mt-1 text-xs leading-5 text-[#6B7280]">
          Keep your profile warm with quick replies, strong photos, and steady trust completion.
        </p>
      </div>
    </aside>
  );
}

export default function MemberShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { initialized, token, clearToken } = useAuth();
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

  const visiblePrimary = useMemo(() => primaryNav, []);
  const visibleGroups = useMemo(() => navGroups, []);

  const firstName = shellProfile?.personal?.firstName ?? 'Member';
  const profileInitial = firstName.slice(0, 1).toUpperCase();

  if (!initialized || !token) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F]">
        <PublicHeader />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-3xl border border-[#A10E4D]/10 bg-white p-6 text-sm font-semibold text-[#A10E4D] shadow-sm">
            Member login required.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F]">
      <div className="lg:hidden">
        <PublicHeader />
      </div>

      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <DesktopRail firstName={firstName} pathname={pathname} unreadCount={unreadCount} />
        </div>

        <div className="min-w-0">
          <main
            className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8.5rem)' }}
          >
            <div className="overflow-hidden rounded-[32px] border border-[#A10E4D]/10 bg-white shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
              <div className="border-b border-[#A10E4D]/10 bg-[linear-gradient(180deg,rgba(252,250,247,0.95)_0%,rgba(255,255,255,1)_100%)] px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label="Open member menu"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#A10E4D]/15 text-[#A10E4D] lg:hidden"
                        type="button"
                        onClick={() => setMenuOpen(true)}
                      >
                        <Menu className="h-5 w-5" />
                      </button>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">
                          Member dashboard
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[#2F2F2F]">
                          Welcome back, {firstName}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href="/member/subscription"
                        className="hidden items-center gap-2 rounded-full border border-[#A10E4D]/15 bg-white px-5 py-3 text-sm font-semibold text-[#A10E4D] transition hover:bg-[#FFF0F3] lg:inline-flex"
                      >
                        <Crown className="size-4 text-[#D4A04C]" />
                        Upgrade Membership
                      </Link>

                      <Link
                        href="/member/notifications"
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#A10E4D]/15 bg-white text-[#A10E4D] transition hover:bg-[#FFF0F3] sm:h-11 sm:w-11"
                        aria-label="Notifications"
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount ? (
                          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#A10E4D] px-1.5 text-center text-xs font-semibold text-white">
                            {unreadCount}
                          </span>
                        ) : null}
                      </Link>

                      <div className="hidden items-center gap-3 rounded-full border border-[#A10E4D]/15 bg-white px-3 py-2 lg:inline-flex">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A10E4D] text-sm font-bold text-white">
                          {profileInitial}
                        </span>
                        <span className="pr-1">
                          <span className="block text-sm font-semibold text-[#2F2F2F]">{firstName}</span>
                          <span className="block text-xs text-[#6B7280]">Hi, {firstName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden items-center gap-2 overflow-x-auto lg:flex">
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
                              ? 'border-[#A10E4D] bg-[#FFF0F3] text-[#A10E4D] shadow-sm'
                              : 'border-[#A10E4D]/10 bg-white text-[#6B7280] hover:bg-[#FFF0F3] hover:text-[#A10E4D]',
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
                <div className="fixed inset-0 z-50 lg:hidden">
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
                    <div className="flex items-start justify-between gap-3 border-b border-[#A10E4D]/10 pb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                          Member menu
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[#2F2F2F]">{firstName}</h3>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          Move between matches, activity, membership, and profile tools.
                        </p>
                      </div>
                      <button
                        aria-label="Close member menu"
                        className="rounded-full border border-[#A10E4D]/15 p-2 text-[#A10E4D]"
                        type="button"
                        onClick={() => setMenuOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 space-y-6">
                      {visibleGroups.map((group) => (
                        <div key={group.title}>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
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
                                      ? 'border-[#A10E4D] bg-[#FFF0F3] text-[#A10E4D]'
                                      : 'border-[#A10E4D]/10 bg-white text-[#2F2F2F] hover:bg-[#FFF9F5]',
                                  )}
                                >
                                  <span className="flex items-center gap-3">
                                    <Icon className="h-4 w-4 text-[#A10E4D]" />
                                    {item.label}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                                </Link>
                              );
                            })}
                          </nav>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          clearToken();
                          router.replace('/login');
                        }}
                        className="flex w-full items-center justify-between rounded-2xl border border-[#A10E4D]/10 bg-white px-4 py-3 text-sm font-semibold text-[#A10E4D]"
                      >
                        <span className="flex items-center gap-3">
                          <LogOut className="size-4" />
                          Logout
                        </span>
                        <ChevronRight className="size-4 text-[#6B7280]" />
                      </button>
                    </div>
                  </aside>
                </div>
              ) : null}

              <section className="px-4 py-5 sm:px-6 sm:py-6">
                <SectionHeader eyebrow="Member" title={title} subtitle={subtitle} />
                <div className="mt-5 sm:mt-6">{children}</div>
              </section>
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#A10E4D]/10 bg-white/95 shadow-[0_-12px_32px_rgba(122,31,43,0.08)] backdrop-blur-md lg:hidden">
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
                    ? 'bg-[#A10E4D] text-white shadow-md'
                    : 'text-[#6B7280] hover:bg-[#FFF0F3]/50 hover:text-[#A10E4D]',
                )}
              >
                <Icon className={cx('mb-1 h-[18px] w-[18px]', active ? 'text-[#D4A04C]' : 'text-current')} />
                <span className={cx(active ? 'font-bold' : 'font-medium')}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
