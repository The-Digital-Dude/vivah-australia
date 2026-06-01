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
import { Bell, CheckCircle2, ChevronRight, Loader2, Menu, Search, ShieldCheck, X } from 'lucide-react';
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1A1A1A] md:text-5xl">
            {title}
          </h1>
          {children ? <div className="mt-5 text-base leading-7 text-[#6B7280]">{children}</div> : null}
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
  age?: number | string;
  city?: string;
  community?: string;
  education?: string;
  id: string;
  matchScore?: number;
  name?: string;
  occupation?: string;
  photoUrl?: string;
  religion?: string;
  slug?: string;
  verificationLevel?: string;
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
        'overflow-hidden rounded-3xl border border-[#7A1F2B]/10 bg-white shadow-[0_18px_45px_rgba(122,31,43,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(122,31,43,0.12)]',
        className,
      )}
    >
      <Link href={href} className={cx('grid gap-4 p-4', compact ? '' : 'sm:grid-cols-[120px_1fr]')}>
        <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl bg-[#F8E8E8] text-3xl font-semibold text-[#7A1F2B]">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={`${profile.name ?? 'Vivah member'} profile`}
              fill
              sizes="(min-width: 640px) 120px, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A1A]">
                {profile.name ?? 'Vivah member'}
                {profile.age ? `, ${profile.age}` : ''}
              </h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                {[profile.city, profile.occupation].filter(Boolean).join(' | ') || 'Australia'}
              </p>
            </div>
            {typeof profile.matchScore === 'number' ? (
              <MatchScoreBadge score={profile.matchScore} />
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <VerificationBadge level={profile.verificationLevel} />
            {[profile.religion, profile.community, profile.education].filter(Boolean).map((item) => (
              <span key={item} className="rounded-full bg-[#FCFAF7] px-3 py-1 text-xs font-semibold text-[#6B7280]">
                {item}
              </span>
            ))}
          </div>
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
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8E8E8] px-3 py-1 text-xs font-bold text-[#7A1F2B]">
      <ShieldCheck className="size-3.5" />
      {label}
    </span>
  );
}

export function MatchScoreBadge({ score }: Readonly<{ score?: number }>) {
  if (typeof score !== 'number') return null;
  return (
    <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#7A1F2B]">
      {score}% match
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
      {children ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280]">{children}</p> : null}
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
    <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Close filters" className="absolute inset-0 bg-black/35" type="button" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-[#FCFAF7] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
          <button type="button" aria-label="Close filters" onClick={onClose} className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B]">
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
  ['Matches', '/member/matches'],
  ['Membership', '/pricing'],
  ['Verification', '/pages/verification-policy'],
  ['Blog', '/pages/blog'],
  ['Help', '/pages/help-centre'],
] as const;

const memberLinks = [
  ['Dashboard', '/member'],
  ['Matches', '/member/matches'],
  ['Messages', '/member/messages'],
  ['Notifications', '/member/notifications'],
  ['Profile', '/member/profile/edit'],
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
              <PremiumButton href="/member/notifications" variant="secondary" className="min-h-10 px-3">
                <Bell className="size-4" />
              </PremiumButton>
              <PremiumButton variant="ghost" onClick={clearToken}>Logout</PremiumButton>
            </>
          ) : (
            <>
              <PremiumButton href="/login" variant="ghost">Login</PremiumButton>
              <PremiumButton href="/register" variant="gold">Create Free Profile</PremiumButton>
            </>
          )}
        </div>
        <button type="button" aria-label="Open menu" className="rounded-full border border-[#7A1F2B]/15 bg-white p-2 text-[#7A1F2B] lg:hidden" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/35" type="button" onClick={() => setOpen(false)} />
          <aside className="relative ml-auto h-full w-80 max-w-[85vw] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="font-semibold text-[#7A1F2B]" onClick={() => setOpen(false)}>
                Vivah Australia
              </Link>
              <button type="button" aria-label="Close menu" className="rounded-full border border-[#7A1F2B]/15 p-2 text-[#7A1F2B]" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-8 grid gap-3">
              {links.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#F8E8E8]">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              {initialized && token ? (
                <PremiumButton variant="secondary" onClick={clearToken}>Logout</PremiumButton>
              ) : (
                <>
                  <PremiumButton href="/login" variant="secondary">Login</PremiumButton>
                  <PremiumButton href="/register" variant="gold">Create Free Profile</PremiumButton>
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
        <FooterList title="Explore" links={[['Matches', '/member/matches'], ['Membership', '/pricing'], ['Verification', '/pages/verification-policy']]} />
        <FooterList title="Support" links={[['Help', '/pages/help-centre'], ['Contact', '/contact'], ['Safety', '/pages/safety-guidelines']]} />
        <FooterList title="Legal" links={[['Privacy', '/pages/privacy-policy'], ['Terms', '/pages/terms-and-conditions'], ['Refunds', '/pages/refund-policy']]} />
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
