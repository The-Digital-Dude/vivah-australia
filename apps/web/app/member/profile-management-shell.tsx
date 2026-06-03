import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Camera,
  Eye,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from 'lucide-react';
import MemberShell from './member-shell';
import { PremiumCard } from '@/app/components';

type ProfileWorkspaceKey = 'edit' | 'media' | 'settings';

const NAV_ITEMS: Array<{
  key: ProfileWorkspaceKey;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'edit',
    label: 'Edit profile',
    description: 'Update biodata, family, lifestyle, and partner preferences.',
    href: '/member/profile/edit',
    icon: UserRoundCog,
  },
  {
    key: 'media',
    label: 'Photos & media',
    description: 'Manage public, private, and primary profile photos.',
    href: '/member/media',
    icon: Camera,
  },
  {
    key: 'settings',
    label: 'Privacy & settings',
    description: 'Control visibility, notifications, and mobile trust settings.',
    href: '/member/settings',
    icon: Lock,
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfileManagementShell({
  title,
  subtitle,
  active,
  children,
  utility,
}: Readonly<{
  title: string;
  subtitle: string;
  active: ProfileWorkspaceKey;
  children: ReactNode;
  utility?: ReactNode;
}>) {
  return (
    <MemberShell title={title} subtitle={subtitle}>
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-4">
          <PremiumCard className="rounded-[30px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Profile studio
            </p>
            <h2 className="mt-3 font-playfair text-2xl font-semibold text-[#2F2F2F]">
              Manage your Vivah presence
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Keep your profile, photos, privacy, and trust settings aligned so serious members see
              a profile that feels complete and trustworthy.
            </p>
          </PremiumCard>

          <PremiumCard className="rounded-[30px] p-4">
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const activeItem = item.key === active;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      'block rounded-[24px] border px-4 py-4 transition',
                      activeItem
                        ? 'border-[#A10E4D]/18 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFF9F5_100%)] shadow-[0_18px_35px_rgba(161,14,77,0.08)]'
                        : 'border-transparent bg-white hover:border-[#A10E4D]/10 hover:bg-[#FFF9F5]',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cx(
                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                          activeItem ? 'bg-white text-[#A10E4D]' : 'bg-[#FFF3EE] text-[#A10E4D]',
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2F2F2F]">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[#6B7280]">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </PremiumCard>

          <PremiumCard className="rounded-[30px] border border-[#D4A04C]/20 bg-[linear-gradient(180deg,#FFF8EC_0%,#FFFFFF_100%)] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0D8] text-[#B7832E]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2F2F2F]">Want better responses?</p>
                <p className="mt-2 text-xs leading-6 text-[#6B7280]">
                  Complete your photos, keep privacy controls intentional, and build trust through
                  verification to improve the quality of introductions you receive.
                </p>
              </div>
            </div>
          </PremiumCard>
        </aside>

        <div className="min-w-0">{children}</div>

        <aside className="space-y-4 xl:block">
          {utility ?? (
            <>
              <PremiumCard className="rounded-[30px] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                  Quick destinations
                </p>
                <div className="mt-4 space-y-3">
                  <Link
                    href="/member/profile"
                    className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="size-4 text-[#A10E4D]" />
                      Preview public profile
                    </span>
                  </Link>
                  <Link
                    href="/member/verification"
                    className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[#A10E4D]" />
                      Visit verification centre
                    </span>
                  </Link>
                  <Link
                    href="/member/subscription"
                    className="flex items-center justify-between rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#A10E4D]" />
                      Membership & visibility
                    </span>
                  </Link>
                </div>
              </PremiumCard>

              <PremiumCard className="rounded-[30px] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
                  Management note
                </p>
                <h3 className="mt-3 font-playfair text-2xl font-semibold text-[#2F2F2F]">
                  Build trust through clarity
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6B7280]">
                  The strongest matrimonial profiles feel intentional: clear photos, honest
                  details, and visibility settings that reflect the pace at which you want to
                  connect.
                </p>
              </PremiumCard>
            </>
          )}
        </aside>
      </div>
    </MemberShell>
  );
}
