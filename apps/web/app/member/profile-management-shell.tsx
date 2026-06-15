import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Camera,
  Eye,
  Lock,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import MemberShell from './member-shell';

type ProfileWorkspaceKey = 'edit' | 'media' | 'settings';

const NAV_ITEMS: Array<{
  key: ProfileWorkspaceKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'edit', label: 'Edit profile', href: '/member/profile/edit', icon: UserRoundCog },
  { key: 'media', label: 'Photos & media', href: '/member/media', icon: Camera },
  { key: 'settings', label: 'Privacy & settings', href: '/member/settings', icon: Lock },
];

const QUICK_LINKS = [
  { label: 'Preview public profile', href: '/member/profile', icon: Eye },
  { label: 'Verification centre', href: '/member/verification', icon: ShieldCheck },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfileManagementShell({
  title,
  subtitle,
  active,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  active: ProfileWorkspaceKey;
  children: ReactNode;
}>) {
  return (
    <MemberShell title={title} subtitle={subtitle}>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-2 lg:sticky lg:top-8 lg:self-start">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const activeItem = item.key === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition',
                  activeItem
                    ? 'border-[#A10E4D]/20 bg-[#FFF0F3] text-[#A10E4D]'
                    : 'border-transparent text-[#5F5F5F] hover:bg-white hover:text-[#A10E4D]',
                )}
              >
                <span className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                  activeItem ? 'bg-white text-[#A10E4D]' : 'bg-[#FFF3EE] text-[#A10E4D]',
                )}>
                  <Icon className="size-4" />
                </span>
                {item.label}
              </Link>
            );
          })}

          <div className="mt-4 space-y-1 border-t border-[#A10E4D]/8 pt-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B7280] transition hover:bg-white hover:text-[#A10E4D]"
                >
                  <Icon className="size-3.5 text-[#A10E4D]" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 w-full max-w-none">{children}</div>
      </div>
    </MemberShell>
  );
}
