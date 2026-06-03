'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';

export const premiumTokens = {
  burgundy: '#7A1F2B',
  gold: '#D4AF37',
  ivory: '#FCFAF7',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#6B7280',
  blush: '#F8E8E8',
} as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type PremiumButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
};

const buttonStyles = {
  primary: 'bg-[#7A1F2B] text-white shadow-lg shadow-[#7A1F2B]/15 hover:bg-[#651925]',
  secondary:
    'border border-[#7A1F2B]/20 bg-white text-[#7A1F2B] shadow-sm hover:border-[#7A1F2B]/40 hover:bg-[#F8E8E8]',
  ghost: 'text-[#7A1F2B] hover:bg-[#F8E8E8]',
  gold: 'bg-[#D4AF37] text-[#1A1A1A] shadow-lg shadow-[#D4AF37]/20 hover:bg-[#c9a126]',
  danger: 'border border-[#7A1F2B]/20 bg-[#F8E8E8] text-[#7A1F2B] hover:bg-[#f3d6d6]',
} as const;

export function PremiumButton({
  children,
  className,
  disabled,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
}: PremiumButtonProps) {
  const classes = cx(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-50',
    buttonStyles[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function PremiumCard({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <section
      className={cx(
        'rounded-3xl border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.08)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHero({
  actions,
  children,
  eyebrow,
  title,
}: Readonly<{ actions?: ReactNode; children?: ReactNode; eyebrow?: string; title: string }>) {
  return (
    <section className="overflow-hidden bg-[#FCFAF7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1A1A1A] md:text-5xl">
            {title}
          </h1>
          {children ? (
            <div className="mt-5 text-base leading-7 text-[#6B7280]">{children}</div>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  action,
  align = 'left',
  eyebrow,
  subtitle,
  title,
}: Readonly<{
  action?: ReactNode;
  align?: 'left' | 'center';
  eyebrow?: string;
  subtitle?: string | undefined;
  title: string;
}>) {
  return (
    <div
      className={cx(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:items-center md:justify-center',
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold text-[#1A1A1A] md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-3 text-sm leading-6 text-[#6B7280]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export type ProfileMatchCardProfile = {
  age?: number | string | undefined;
  city?: string | undefined;
  community?: string | undefined;
  education?: string | undefined;
  highlights?: string[] | undefined;
  id: string;
  lastActiveLabel?: string | undefined;
  matchScore?: number | undefined;
  name?: string | undefined;
  occupation?: string | undefined;
  photoUrl?: string | undefined;
  privacyHint?: string | undefined;
  religion?: string | undefined;
  slug?: string | undefined;
  verificationLevel?: string | undefined;
  isBoosted?: boolean | undefined;
};

export function ProfileMatchCard({
  actions,
  className,
  compact = false,
  profile,
}: Readonly<{
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
  profile: ProfileMatchCardProfile;
}>) {
  const initials = (profile.name ?? 'V').slice(0, 1).toUpperCase();
  const href = `/profiles/${profile.slug || profile.id}`;

  return (
    <article
      className={cx(
        'overflow-hidden rounded-[30px] border border-[#7A1F2B]/10 bg-white shadow-[0_18px_45px_rgba(122,31,43,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(122,31,43,0.12)]',
        className,
      )}
    >
      <Link href={href} className={cx('grid gap-4 p-4', compact ? '' : '')}>
        <div className="relative grid aspect-[4/4.8] place-items-center overflow-hidden rounded-[24px] bg-[#F8E8E8] text-3xl font-semibold text-[#7A1F2B]">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={`${profile.name ?? 'Vivah member'} profile`}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            initials
          )}
          {profile.isBoosted ? (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D6A84F] to-[#C0923C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2C1707] shadow-md">
              <Sparkles className="size-3" /> Boosted
            </div>
          ) : null}
          {profile.lastActiveLabel ? (
            <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F6F4A] shadow-sm backdrop-blur">
              <Clock3 className="size-3" />
              {profile.lastActiveLabel}
            </div>
          ) : null}
        </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-[#1A1A1A]">
                  {profile.name ?? 'Vivah member'}
                  {profile.age ? `, ${profile.age}` : ''}
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {profile.city || 'Australia'}
                </p>
              </div>
              {typeof profile.matchScore === 'number' ? (
                <MatchScoreBadge score={profile.matchScore} />
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <VerificationBadge level={profile.verificationLevel} />
              {profile.occupation ? (
                <span className="rounded-full bg-[#FCFAF7] px-3 py-1 text-xs font-semibold text-[#6B7280]">
                  {profile.occupation}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[profile.community, profile.education, profile.religion]
                .filter(Boolean)
                .slice(0, compact ? 2 : 3)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#7A1F2B]/10 bg-white px-3 py-1 text-xs font-semibold text-[#6B7280]"
                  >
                    {item}
                  </span>
                ))}
            </div>

            {profile.highlights?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.highlights.slice(0, compact ? 2 : 3).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F7FBF8] px-2.5 py-1 text-xs font-semibold text-[#1F6F4A]"
                  >
                    <ShieldCheck className="size-3.5" />
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {profile.privacyHint ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FFF8EC] px-3 py-1 text-xs font-semibold text-[#8B6714]">
                <ShieldCheck className="size-3.5" />
                {profile.privacyHint}
              </div>
            ) : null}

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#7A1F2B]">
              View profile <ChevronRight className="size-4" />
            </span>
          </div>
        </Link>
        {actions ? <div className="border-t border-[#7A1F2B]/10 px-4 py-3">{actions}</div> : null}
    </article>
  );
}

export function ProfileDetailSection({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <PremiumCard>
      <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm leading-6 text-[#6B7280]">{children}</div>
    </PremiumCard>
  );
}

export function VerificationBadge({ level }: Readonly<{ level?: string | undefined }>) {
  const label = level ? level.replaceAll('_', ' ') : 'Verification pending';
  const detail =
    level === 'FULLY_VERIFIED'
      ? 'Identity, address, employment, and higher-trust checks have been reviewed.'
      : level === 'PLATINUM'
        ? 'Higher-trust profile with deeper review signals beyond standard verification.'
        : level === 'GOLD'
          ? 'Includes stronger trust review such as address, employment, or residency-related checks.'
          : level === 'SILVER'
            ? 'Carries a stronger review signal than basic account verification.'
            : level === 'BASIC'
              ? 'Basic account verification is completed for this member.'
              : 'This profile has not completed visible verification yet.';

  return (
    <span className="group relative inline-flex">
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8E8E8] px-3 py-1 text-xs font-bold text-[#7A1F2B]">
        <ShieldCheck className="size-3.5" />
        {label}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-2xl border border-[#7A1F2B]/10 bg-white p-3 text-left text-[11px] font-medium leading-5 text-[#6B7280] shadow-xl group-hover:block group-focus-within:block">
        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
          Verification
        </span>
        <span className="mt-1 block">{detail}</span>
      </span>
    </span>
  );
}

export function MatchScoreBadge({ score }: Readonly<{ score?: number }>) {
  if (typeof score !== 'number') return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D6A84F]/20 to-[#7A1F2B]/10 px-3 py-1 text-xs font-bold text-[#7A1F2B] border border-[#D6A84F]/30 shadow-sm">
      <span className="text-sm leading-none">🔥</span> {score}% Match
    </span>
  );
}

export function EmptyState({
  action,
  children,
  title = 'Nothing here yet',
}: Readonly<{ action?: ReactNode; children?: ReactNode; title?: string }>) {
  return (
    <div className="rounded-3xl border border-dashed border-[#D4AF37]/70 bg-white p-8 text-center">
      <Search className="mx-auto size-7 text-[#D4AF37]" />
      <h3 className="mt-4 text-lg font-semibold text-[#1A1A1A]">{title}</h3>
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280]">{children}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: Readonly<{ label?: string }>) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-3xl border border-[#7A1F2B]/10 bg-white text-sm font-semibold text-[#6B7280]">
      <Loader2 className="mr-2 size-4 animate-spin text-[#7A1F2B]" />
      {label}
    </div>
  );
}

export function FormField({
  className,
  label,
  optional,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; optional?: boolean }) {
  return (
    <label className={cx('grid gap-2 text-sm font-semibold text-[#1A1A1A]', className)}>
      <span>
        {label}
        {optional ? <span className="font-normal text-[#6B7280]"> optional</span> : null}
      </span>
      <input
        className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-white px-4 text-sm outline-none transition focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
        {...props}
      />
    </label>
  );
}

export function SelectField({
  children,
  className,
  label,
  optional,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  label: string;
  optional?: boolean;
}) {
  return (
    <label className={cx('grid gap-2 text-sm font-semibold text-[#1A1A1A]', className)}>
      <span>
        {label}
        {optional ? <span className="font-normal text-[#6B7280]"> optional</span> : null}
      </span>
      <select
        className="h-12 rounded-2xl border border-[#7A1F2B]/15 bg-white px-4 text-sm outline-none transition focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8]"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function FilterDrawer({
  children,
  onClose,
  open,
  title = 'Filters',
}: Readonly<{ children: ReactNode; onClose: () => void; open: boolean; title?: string }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close filters"
        className="absolute inset-0 bg-black/35"
        type="button"
        onClick={onClose}
      />
      <aside
        className="relative ml-auto h-full w-full max-w-md overflow-y-auto bg-[#FCFAF7] p-5 shadow-2xl sm:max-w-lg sm:rounded-l-[28px] sm:border-l sm:border-[#7A1F2B]/10 sm:p-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-5 flex items-center justify-between gap-4 border-b border-[#7A1F2B]/10 bg-[#FCFAF7]/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B]"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function StaticPageLayout({
  children,
  hero,
}: Readonly<{ children: ReactNode; hero?: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      {hero}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}

export function MemberPageLayout({
  children,
  title,
  subtitle,
}: Readonly<{ children: ReactNode; subtitle?: string | undefined; title: string }>) {
  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Member" title={title} subtitle={subtitle} />
        <div className="mt-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

const publicLinks = [
  ['Home', '/'],
  ['Matches', '/matches'],
  ['Membership', '/pricing'],
  ['Verification', '/verification-policy'],
  ['Blog', '/blog'],
  ['Help', '/help'],
] as const;

const memberLinks = [
  ['Dashboard', '/member'],
  ['Matches', '/member/matches'],
  ['Messages', '/member/messages'],
  ['Notifications', '/member/notifications'],
  ['Profile', '/member/profile'],
] as const;

export function PublicHeader() {
  const { clearToken, initialized, token } = useAuth();
  const [open, setOpen] = useState(false);
  const links = initialized && token ? memberLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-[#7A1F2B]/10 bg-[#FCFAF7]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold text-[#7A1F2B]">
          Vivah Australia
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#6B7280] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#7A1F2B]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {initialized && token ? (
            <>
              <PremiumButton
                href="/member/notifications"
                variant="secondary"
                className="min-h-10 px-3"
              >
                <Bell className="size-4" />
              </PremiumButton>
              <PremiumButton variant="ghost" onClick={clearToken}>
                Logout
              </PremiumButton>
            </>
          ) : (
            <>
              <PremiumButton href="/login" variant="ghost">
                Login
              </PremiumButton>
              <PremiumButton href="/register" variant="gold">
                Create Free Profile
              </PremiumButton>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B] lg:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/35"
            type="button"
            onClick={() => setOpen(false)}
          />
          <aside className="relative ml-auto h-full w-80 max-w-[85vw] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="font-semibold text-[#7A1F2B]"
                onClick={() => setOpen(false)}
              >
                Vivah Australia
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-full border border-[#7A1F2B]/15 p-2 text-[#7A1F2B]"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-8 grid gap-3">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#F8E8E8]"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              {initialized && token ? (
                <PremiumButton variant="secondary" onClick={clearToken}>
                  Logout
                </PremiumButton>
              ) : (
                <>
                  <PremiumButton href="/login" variant="secondary">
                    Login
                  </PremiumButton>
                  <PremiumButton href="/register" variant="gold">
                    Create Free Profile
                  </PremiumButton>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[#7A1F2B]/10 bg-[#1A1A1A] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-xl font-semibold">Vivah Australia</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
            Premium matrimonial matchmaking for serious Australian singles and families.
          </p>
        </div>
        <FooterList
          title="Explore"
          links={[
            ['Matches', '/matches'],
            ['Membership', '/pricing'],
            ['Verification', '/verification-policy'],
          ]}
        />
        <FooterList
          title="Support"
          links={[
            ['Help', '/help'],
            ['Contact', '/contact'],
            ['Safety', '/safety'],
          ]}
        />
        <FooterList
          title="Legal"
          links={[
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Refunds', '/refund-policy'],
          ]}
        />
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/50">
        Copyright {new Date().getFullYear()} Vivah Australia. All rights reserved.
      </div>
    </footer>
  );
}

function FooterList({
  links,
  title,
}: Readonly<{ links: Array<readonly [string, string]>; title: string }>) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-4 grid gap-3 text-sm text-white/65">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition hover:text-[#D4AF37]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SuccessLine({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F6F4A]">
      <CheckCircle2 className="size-4" />
      {children}
    </span>
  );
}

export function StaticPageHero({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: Readonly<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}>) {
  return (
    <section className="bg-[#FCFAF7] pt-16 pb-12 overflow-hidden relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#7A1F2B]/10" />
      <div
        className={cx(
          'mx-auto max-w-5xl px-4 sm:px-6 lg:px-8',
          align === 'center' ? 'text-center' : 'text-left',
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#7A1F2B] leading-tight mb-4">
          {title}
        </h1>
        <div
          className={cx('h-1 w-16 bg-[#D4AF37] rounded mb-4', align === 'center' ? 'mx-auto' : '')}
        />
        {subtitle ? (
          <p className="max-w-2xl mx-auto text-base text-[#6B7280] leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

export function StaticPageContainer({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div className={cx('mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8', className)}>{children}</div>
  );
}

export function PolicyContentCard({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <PremiumCard className={cx('p-8 sm:p-10', className)}>
      <div className="max-w-none text-[#1A1A1A] leading-8 text-base space-y-6">{children}</div>
    </PremiumCard>
  );
}

export function FAQAccordion({
  items,
}: Readonly<{
  items: Array<{ question: string; answer: string }>;
}>) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-[#7A1F2B]/10 bg-white transition shadow-sm hover:shadow-md animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-[#1A1A1A] outline-none transition duration-200"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cx(
                  'size-5 text-[#7A1F2B] transition-transform duration-300',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen ? (
              <div className="px-6 pb-5 text-sm leading-relaxed text-[#6B7280] border-t border-[#7A1F2B]/5 pt-4">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ContactCard({
  title,
  icon: iconKey,
  value,
  description,
  href,
}: Readonly<{
  title: string;
  icon: 'email' | 'phone' | 'location';
  value: string;
  description?: string;
  href?: string;
}>) {
  const icons = {
    email: Mail,
    phone: Phone,
    location: MapPin,
  };
  const Icon = icons[iconKey];

  const cardContent = (
    <div className="flex flex-col items-center text-center p-6 bg-white border border-[#7A1F2B]/10 rounded-2xl shadow-sm hover:shadow-md transition duration-300">
      <div className="size-12 rounded-xl bg-[#F8E8E8] flex items-center justify-center text-[#7A1F2B] mb-4">
        <Icon className="size-6" />
      </div>
      <h4 className="font-bold text-[#1A1A1A] mb-1">{title}</h4>
      <p className="text-sm font-semibold text-[#7A1F2B] mb-2">{value}</p>
      {description ? <p className="text-xs text-[#6B7280]">{description}</p> : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block group">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

export function HelpCategoryCard({
  title,
  description,
  href,
  icon,
}: Readonly<{
  title: string;
  description: string;
  href: string;
  icon: 'phone' | 'shield' | 'search' | 'mail' | (string & {});
}>) {
  const IconComponent = (() => {
    switch (icon) {
      case 'phone':
        return Phone;
      case 'shield':
        return ShieldCheck;
      case 'search':
        return Search;
      case 'mail':
      default:
        return Mail;
    }
  })();

  return (
    <Link
      href={href}
      className="flex gap-4 p-6 bg-white border border-[#7A1F2B]/10 rounded-3xl shadow-sm hover:shadow-md transition hover:-translate-y-0.5"
    >
      <div className="size-12 rounded-2xl bg-[#F8E8E8] flex items-center justify-center text-[#7A1F2B] shrink-0">
        <IconComponent className="size-6" />
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-[#1A1A1A] mb-1 text-base">{title}</h4>
        <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
