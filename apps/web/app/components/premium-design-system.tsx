'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useState,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
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
  Star,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';

export const premiumTokens = {
  burgundy: '#A10E4D', // Deep Maroon
  gold: '#D4A04C', // Wedding Gold
  ivory: '#FFF9F5', // Warm Ivory
  surface: '#FFFFFF',
  text: '#2F2F2F', // Charcoal
  muted: '#5F5F5F',
  blush: '#E74C7C', // Soft Rose
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
  primary: 'bg-[#A10E4D] text-white shadow-lg shadow-[#A10E4D]/15 hover:opacity-90 font-poppins',
  secondary:
    'border border-[#A10E4D]/20 bg-white text-[#A10E4D] shadow-sm hover:border-[#A10E4D]/40 hover:bg-[#E74C7C]/10 font-poppins',
  ghost: 'text-[#A10E4D] hover:bg-[#E74C7C]/10 font-poppins',
  gold: 'bg-[#D4A04C] text-[#2F2F2F] shadow-lg shadow-[#D4A04C]/20 hover:opacity-90 font-poppins',
  danger:
    'border border-[#A10E4D]/20 bg-[#E74C7C]/10 text-[#A10E4D] hover:bg-[#E74C7C]/20 font-poppins',
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
  const shouldReduceMotion = useReducedMotion();
  const classes = cx(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#D4A04C]/50 disabled:cursor-not-allowed disabled:opacity-50',
    buttonStyles[variant],
    className,
  );

  if (href) {
    const MotionLink = motion(Link);

    return (
      <MotionLink
        href={href}
        className={classes}
        aria-disabled={disabled}
        {...(shouldReduceMotion ? {} : { whileHover: { y: -1, scale: 1.01 } })}
        {...(shouldReduceMotion ? {} : { whileTap: { scale: 0.98 } })}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...(shouldReduceMotion ? {} : { whileHover: { y: -1, scale: 1.01 } })}
      {...(shouldReduceMotion ? {} : { whileTap: { scale: 0.98 } })}
    >
      {children}
    </motion.button>
  );
}

export function PremiumCard({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.section
      className={cx(
        'rounded-3xl border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(161,14,77,0.06)]',
        className,
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export function PageHero({
  actions,
  children,
  eyebrow,
  title,
}: Readonly<{ actions?: ReactNode; children?: ReactNode; eyebrow?: string; title: string }>) {
  return (
    <section className="overflow-hidden bg-[#FFF9F5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto container">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-4 text-4xl font-bold leading-tight text-[#2F2F2F] md:text-5xl font-playfair">
            {title}
          </h1>
          {children ? (
            <div className="mt-5 text-base leading-7 text-[#5F5F5F] font-poppins">{children}</div>
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
  title?: string;
}>) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cx(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:items-center md:justify-center',
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">{eyebrow}</p>
        ) : null}
        {title ? (
          <h2 className="mt-2 text-2xl font-bold text-[#2F2F2F] md:text-3xl font-cormorant">
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mt-3 text-sm leading-6 text-[#5F5F5F] font-poppins">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </motion.div>
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
  const shouldReduceMotion = useReducedMotion();
  const initials = (profile.name ?? 'V').slice(0, 1).toUpperCase();
  const href = `/profiles/${profile.slug || profile.id}`;
  const [imageLoaded, setImageLoaded] = useState(!profile.photoUrl);

  return (
    <motion.article
      className={cx(
        'overflow-hidden rounded-[30px] border border-[#A10E4D]/10 bg-white shadow-[0_18px_45px_rgba(161,14,77,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(161,14,77,0.08)]',
        className,
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      {...(shouldReduceMotion ? {} : { whileHover: { y: -6, scale: 1.01 } })}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className={cx('grid gap-4 p-4', compact ? '' : '')}>
        <div className="relative grid aspect-[4/4.8] place-items-center overflow-hidden rounded-[24px] bg-[#E74C7C]/10 text-3xl font-semibold text-[#A10E4D] font-cormorant">
          {profile.photoUrl ? (
            <>
              <div
                className={cx(
                  'absolute inset-0 bg-[linear-gradient(120deg,rgba(231,76,124,0.1)_20%,#FFF9F5_45%,rgba(231,76,124,0.1)_70%)] bg-[length:200%_100%] transition-opacity duration-500',
                  imageLoaded ? 'opacity-0' : 'animate-pulse opacity-100',
                )}
              />
              <Image
                src={profile.photoUrl}
                alt={`${profile.name ?? 'Vivah member'} profile`}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                className={cx(
                  'object-cover transition-opacity duration-500',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            initials
          )}
          {profile.isBoosted ? (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D4A04C] to-[#c7913c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2F2F2F] shadow-md">
              <Sparkles className="size-3" /> Boosted
            </div>
          ) : null}
          {profile.lastActiveLabel ? (
            <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm backdrop-blur">
              <Clock3 className="size-3" />
              {profile.lastActiveLabel}
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#2F2F2F] font-cormorant">
                {profile.name ?? 'Vivah member'}
                {profile.age ? `, ${profile.age}` : ''}
              </h3>
              <p className="mt-1 text-sm text-[#5F5F5F]">{profile.city || 'Australia'}</p>
            </div>
            {typeof profile.matchScore === 'number' ? (
              <MatchScoreBadge score={profile.matchScore} />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <VerificationBadge level={profile.verificationLevel} />
            {profile.occupation ? (
              <span className="rounded-full bg-[#FFF9F5] px-3 py-1 text-xs font-semibold text-[#5F5F5F]">
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
                  className="rounded-full border border-[#A10E4D]/10 bg-white px-3 py-1 text-xs font-semibold text-[#5F5F5F]"
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
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                >
                  <ShieldCheck className="size-3.5" />
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          {profile.privacyHint ? (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#D4A04C]/35 bg-[#D4A04C]/10 px-3 py-1 text-xs font-semibold text-[#D4A04C]">
              <ShieldCheck className="size-3.5" />
              {profile.privacyHint}
            </div>
          ) : null}

          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#A10E4D] font-poppins">
            View profile <ChevronRight className="size-4" />
          </span>
        </div>
      </Link>
      {actions ? <div className="border-t border-[#A10E4D]/10 px-4 py-3">{actions}</div> : null}
    </motion.article>
  );
}

export function ProfileDetailSection({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <PremiumCard>
      <h2 className="text-lg font-semibold text-[#2F2F2F] font-cormorant">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm leading-6 text-[#5F5F5F] font-poppins">
        {children}
      </div>
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
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E74C7C]/15 px-3 py-1 text-xs font-bold text-[#A10E4D]">
        <ShieldCheck className="size-3.5" />
        {label}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-2xl border border-[#A10E4D]/10 bg-white p-3 text-left text-[11px] font-medium leading-5 text-[#5F5F5F] shadow-xl group-hover:block group-focus-within:block">
        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#A10E4D]">
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
    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D4A04C]/20 to-[#A10E4D]/10 px-3 py-1 text-xs font-bold text-[#A10E4D] border border-[#D4A04C]/30 shadow-sm">
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
    <div className="rounded-3xl border border-dashed border-[#D4A04C]/70 bg-white p-8 text-center font-poppins">
      <Search className="mx-auto size-7 text-[#D4A04C]" />
      <h3 className="mt-4 text-lg font-bold text-[#2F2F2F] font-cormorant">{title}</h3>
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5F5F5F]">{children}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: Readonly<{ label?: string }>) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-3xl border border-[#A10E4D]/10 bg-white text-sm font-semibold text-[#5F5F5F] font-poppins">
      <Loader2 className="mr-2 size-4 animate-spin text-[#A10E4D]" />
      {label}
    </div>
  );
}

export function MatchGridSkeleton({
  count = 6,
}: Readonly<{
  count?: number;
}>) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-[#A10E4D]/10 bg-white p-4 shadow-sm animate-pulse"
        >
          <div className="aspect-[4/4.8] rounded-2xl bg-[#E74C7C]/10" />
          <div className="mt-4 grid content-start gap-3">
            <div className="h-5 w-2/3 rounded-lg bg-[#E74C7C]/10" />
            <div className="h-4 w-1/2 rounded-lg bg-[#E74C7C]/10" />
            <div className="h-4 w-5/6 rounded-lg bg-[#E74C7C]/10" />
            <div className="h-7 w-24 rounded-full bg-[#E74C7C]/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OnboardingFormSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 border-b border-[#A10E4D]/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-24 shrink-0 rounded-full bg-[#E74C7C]/10 animate-pulse"
            />
          ))}
        </div>
        <div className="h-4 w-40 rounded bg-[#E74C7C]/10 animate-pulse" />
      </div>

      <div className="rounded-3xl border border-[#A10E4D]/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="h-6 w-48 rounded bg-[#E74C7C]/10 animate-pulse" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#E74C7C]/10 animate-pulse" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-2">
              <div className="h-4 w-28 rounded bg-[#E74C7C]/10 animate-pulse" />
              <div className="h-12 rounded-2xl bg-[#E74C7C]/10 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="h-11 w-full rounded-2xl bg-[#E74C7C]/10 animate-pulse sm:w-32" />
          <div className="h-11 w-full rounded-2xl bg-[#E74C7C]/10 animate-pulse sm:w-40" />
        </div>
      </div>
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
    <label
      className={cx('grid gap-2 text-sm font-semibold text-[#2F2F2F] font-poppins', className)}
    >
      <span>
        {label}
        {optional ? <span className="font-normal text-[#5F5F5F]"> optional</span> : null}
      </span>
      <input
        className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#E74C7C]/10"
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
    <label
      className={cx('grid gap-2 text-sm font-semibold text-[#2F2F2F] font-poppins', className)}
    >
      <span>
        {label}
        {optional ? <span className="font-normal text-[#5F5F5F]"> optional</span> : null}
      </span>
      <select
        className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-white px-4 text-sm outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#E74C7C]/10"
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
        className="relative ml-auto h-full w-full max-w-md overflow-y-auto bg-[#FFF9F5] p-5 shadow-2xl sm:max-w-lg sm:rounded-l-[28px] sm:border-l sm:border-[#A10E4D]/10 sm:p-6 font-poppins"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-5 flex items-center justify-between gap-4 border-b border-[#A10E4D]/10 bg-[#FFF9F5]/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 className="text-lg font-bold text-[#2F2F2F] font-cormorant">{title}</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="rounded-full border border-[#A10E4D]/15 bg-white p-2 text-[#A10E4D]"
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
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F] font-poppins">
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
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F] font-poppins">
      <PublicHeader />
      <main className="mx-auto container px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Member" title={title} subtitle={subtitle} />
        <div className="mt-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

const homeMenuLinks = [
  ['Classic Home', '/'],
  ['Premium Home', '/homepage/premium'],
  ['Search Home', '/homepage/search'],
  ['Story Home', '/homepage/story'],
  ['Slider Home', '/homepage/slider'],
  ['Animated Home', '/homepage/animated'],
  ['Comprehensive (Dark)', '/homepage/comprehensive'],
  ['Comprehensive (Light)', '/homepage/comprehensive-light'],
  ['Final Homepage', '/final-homepage'],
] as const;

const publicLinks = [
  ['About Us', '/about'],
  ['Success Stories', '/success-stories'],
  ['Membership', '/membership'],
  ['Community', '/community'],
] as const;

const memberLinks = [
  ['Dashboard', '/member'],
  ['Matches', '/member/matches'],
  ['Messages', '/member/messages'],
  ['Notifications', '/member/notifications'],
  ['Profile', '/member/profile'],
] as const;

export function PublicHeader({ variant = 'default' }: { variant?: 'default' | 'dark' | 'transparent' | 'full-maroon' | 'white' } = {}) {
  const { clearToken, initialized, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const links = initialized && token ? memberLinks : publicLinks;
  const MotionLink = motion(Link);

  useEffect(() => { setMounted(true); }, []);

  let headerClass = "sticky top-0 z-50 transition-all font-poppins ";
  if (variant === 'dark') {
    headerClass += "bg-[#1A060B]/80 backdrop-blur-md border-b border-white/5";
  } else if (variant === 'transparent') {
    headerClass += "bg-transparent border-b border-white/10";
  } else if (variant === 'full-maroon') {
    headerClass += "bg-brand-maroon border-b border-white/10 shadow-md";
  } else if (variant === 'white') {
    headerClass += "bg-white border-b border-gray-100 shadow-sm";
  } else {
    headerClass += "bg-brand-maroon/80 backdrop-blur-md border-b border-white/10";
  }

  const isLight = variant === 'white';

  return (
    <header className={headerClass}>
      <div className="px-8 sm:px-12 lg:px-16">
        <div className="mx-auto flex min-h-[54px] container items-center justify-between gap-3 py-2 lg:h-[72px] lg:py-0">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src={isLight ? "/logo-color.png" : "/logo-white.png"}
              alt="Vivah Australia Logo"
              width={320}
              height={100}
              className="h-[73px] sm:h-[81px] lg:h-[97px] w-auto object-contain origin-left"
              priority
            />
          </Link>
          <nav className={cx("hidden min-w-0 flex-1 items-center justify-center gap-5 whitespace-nowrap text-sm font-semibold lg:flex", isLight ? "text-gray-600" : "text-white/80")}>
            {!(initialized && token) && (
              <Link
                href="/"
                className={cx("transition", isLight ? "hover:text-brand-maroon" : "hover:text-white")}
              >
                Home
              </Link>
            )}
            {links.map(([label, href]) => (
              <MotionLink
                key={href}
                href={href}
                className={cx("transition", isLight ? "hover:text-brand-maroon" : "hover:text-white")}
                {...{ whileHover: { y: -1 } }}
                {...{ whileTap: { scale: 0.98 } }}
              >
                {label}
              </MotionLink>
            ))}
            {!(initialized && token) && (
              <div className="group relative flex items-center gap-1 cursor-pointer">
                <span className={cx("transition", isLight ? "hover:text-brand-maroon" : "hover:text-white")}>Resources</span>
                <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180" />
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="w-52 overflow-hidden rounded-xl border border-white/10 bg-brand-charcoal p-2 shadow-2xl">
                    <Link href="/blog"   className="block rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition">Blog & Advice</Link>
                    <Link href="/help"   className="block rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition">Help Center</Link>
                    <Link href="/safety" className="block rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition">Safety Guidelines</Link>
                    <Link href="/faq"    className="block rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition">FAQ</Link>
                  </div>
                </div>
              </div>
            )}
          </nav>
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
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
                <Link
                  href="/login"
                  className={cx("hidden sm:flex items-center justify-center rounded border px-6 py-2.5 text-sm font-medium transition", isLight ? "border-brand-maroon/20 text-brand-maroon hover:bg-brand-maroon/5" : "border-brand-gold/50 text-white hover:bg-white/5")}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 rounded bg-brand-gold px-6 py-2.5 text-sm font-bold text-brand-charcoal transition hover:bg-brand-gold"
                >
                  Create Profile <Users className="size-4" />
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Open menu"
            className={cx("rounded-full border p-2 lg:hidden transition", isLight ? "border-gray-200 bg-white text-brand-charcoal hover:bg-gray-50" : "border-white/40 bg-white/20 text-white hover:bg-white/30")}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      {mounted && open ? createPortal(
        <div className="fixed inset-0 z-[200] lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            type="button"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] p-6 flex flex-col border-l border-white/10 text-white"
            style={{ backgroundColor: '#A10E4D', boxShadow: '-20px 0 40px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center justify-end mb-8">
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-full border border-white/20 p-2 text-white transition hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="grid gap-2 flex-1">
              {!(initialized && token) && (
                <MotionLink
                  href="/"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3.5 text-base font-bold text-white/90 transition hover:bg-white/10 hover:text-white"
                  {...{ whileHover: { x: 4 } }}
                  {...{ whileTap: { scale: 0.98 } }}
                >
                  Home
                </MotionLink>
              )}
              {links.map(([label, href]) => (
                <MotionLink
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3.5 text-base font-bold text-white/90 transition hover:bg-white/10 hover:text-white"
                  {...{ whileHover: { x: 4 } }}
                  {...{ whileTap: { scale: 0.98 } }}
                >
                  {label}
                </MotionLink>
              ))}
            </nav>

            <div className="mt-8 grid gap-4 pb-6">
              {initialized && token ? (
                <PremiumButton variant="primary" onClick={clearToken} className="w-full min-h-[50px]">
                  Logout
                </PremiumButton>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full min-h-[50px] rounded-xl border border-white/20 text-base font-bold text-white transition hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center w-full min-h-[50px] rounded-xl bg-brand-gold text-brand-charcoal text-base font-bold transition hover:bg-brand-gold/90 shadow-md"
                  >
                    Register Free
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>,
        document.body
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-maroon text-white font-poppins">
      {/* Pre-footer trust strip */}
      <div className="border-b border-white/8 bg-black/10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-5">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: ShieldCheck, label: 'Verified community' },
              { icon: MapPin,      label: 'Australia-wide' },
              { icon: Star,        label: '500+ success stories' },
              { icon: Users,       label: '10,000+ members' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-white/60">
                <Icon className="size-3.5 text-brand-gold" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-14 pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="lg:pr-8">
            <Image
              src="/logo-white.png"
              alt="Vivah Australia"
              width={180}
              height={70}
              className="h-12 w-auto object-contain"
            />
            <p className="mt-5 text-sm leading-7 text-white/90 max-w-xs font-medium">
              Premium Indian matrimonial matchmaking for serious Australian singles and their
              families — built with trust, verification, and cultural understanding at its core.
            </p>
            <p className="mt-4 text-sm text-white/90 font-bold uppercase tracking-widest">
              🇦🇺 Proudly Australian
            </p>

            {/* Social icons */}
            <div className="mt-6 flex gap-3">
              {[
                { label: 'Facebook',  svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                { label: 'Instagram', svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></> },
                { label: 'LinkedIn',  svg: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></> },
              ].map(({ label, svg }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="size-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-brand-gold/20 hover:text-brand-gold transition"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <FooterList
            title="Discover"
            links={[
              ['How It Works',     '/how-it-works'],
              ['Success Stories',  '/success-stories'],
              ['Community',        '/community'],
              ['About Us',         '/about'],
              ['Browse Profiles',  '/search'],
            ]}
          />
          <FooterList
            title="Membership"
            links={[
              ['Plans & Pricing', '/pricing'],
              ['Membership',      '/membership'],
              ['FAQ',             '/faq'],
            ]}
          />
          <FooterList
            title="Resources"
            links={[
              ['Blog & Advice',    '/blog'],
              ['Help Center',      '/help'],
              ['Safety Guidelines','/safety'],
              ['Contact Us',       '/contact'],
            ]}
          />
          <FooterList
            title="Legal"
            links={[
              ['Privacy Policy',       '/privacy'],
              ['Terms of Service',     '/terms'],
              ['Refund Policy',        '/refund-policy'],
              ['Community Guidelines', '/community-guidelines'],
              ['Verification Policy',  '/verification-policy'],
            ]}
          />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/70">
            © {year} Vivah Australia Pty Ltd. All rights reserved.
          </p>
          <p className="text-sm text-white/90 font-medium flex items-center gap-1.5">
            Made with ❤️ by <a href="https://rokoautomations.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand-gold transition-colors font-bold">RokoAutomations</a>
          </p>
        </div>
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
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90 mb-4">{title}</h3>
      <ul className="grid gap-3">
        {links.map(([label, href]) => (
          <li key={`${title}-${href}`}>
            <Link href={href} className="text-sm text-white/80 hover:text-white transition font-medium">
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
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 font-poppins">
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
    <section className="bg-[#FFF9F5] pt-16 pb-12 overflow-hidden relative font-poppins">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#A10E4D]/10" />
      <div
        className={cx(
          'mx-auto max-w-5xl px-4 sm:px-6 lg:px-8',
          align === 'center' ? 'text-center' : 'text-left',
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C] mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#A10E4D] leading-tight mb-4 font-playfair">
          {title}
        </h1>
        <div
          className={cx('h-1 w-16 bg-[#D4A04C] rounded mb-4', align === 'center' ? 'mx-auto' : '')}
        />
        {subtitle ? (
          <p className="max-w-2xl mx-auto text-base text-[#5F5F5F] leading-relaxed">{subtitle}</p>
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
      <div className="max-w-none text-[#2F2F2F] leading-8 text-base space-y-6">{children}</div>
    </PremiumCard>
  );
}

export function FAQAccordion({
  items,
}: Readonly<{
  items: Array<{ question: string; answer: string }>;
}>) {
  const [openIdx, setOpenIdx] = useState<number | null>(items.length > 0 ? 0 : null);
  const shouldReduceMotion = useReducedMotion();
  const contentTransition = {
    duration: shouldReduceMotion ? 0 : 0.26,
    ease: [0.22, 1, 0.36, 1],
  } as const;

  return (
    <div className="space-y-4 font-poppins">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <motion.div
            key={idx}
            className={cx(
              'overflow-hidden rounded-2xl border border-[#A10E4D]/10 bg-white shadow-sm transition-shadow',
              isOpen ? 'shadow-md' : 'hover:shadow-md',
            )}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.18 }}
          >
            <motion.button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-[#2F2F2F] outline-none transition duration-200"
              whileTap={{ scale: 0.995 }}
              whileHover={{ x: 1 }}
            >
              <span>{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.05 : 1 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="grid place-items-center"
              >
                <ChevronDown className="size-5 text-[#A10E4D]" />
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={contentTransition}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={shouldReduceMotion ? false : { y: -4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -4, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                    className="border-t border-[#A10E4D]/5 px-6 pb-5 pt-4 text-sm leading-relaxed text-[#5F5F5F]"
                  >
                    {item.answer}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
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
    <div className="flex flex-col items-center text-center p-6 bg-white border border-[#A10E4D]/10 rounded-2xl shadow-sm hover:shadow-md transition duration-300 font-poppins">
      <div className="size-12 rounded-xl bg-[#E74C7C]/10 flex items-center justify-center text-[#A10E4D] mb-4">
        <Icon className="size-6" />
      </div>
      <h4 className="font-bold text-[#2F2F2F] mb-1 font-cormorant">{title}</h4>
      <p className="text-sm font-semibold text-[#A10E4D] mb-2">{value}</p>
      {description ? <p className="text-xs text-[#5F5F5F]">{description}</p> : null}
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
      className="flex gap-4 p-6 bg-white border border-[#A10E4D]/10 rounded-3xl shadow-sm hover:shadow-md transition hover:-translate-y-0.5 font-poppins"
    >
      <div className="size-12 rounded-2xl bg-[#E74C7C]/10 flex items-center justify-center text-[#A10E4D] shrink-0">
        <IconComponent className="size-6" />
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-[#2F2F2F] mb-1 text-base font-cormorant">{title}</h4>
        <p className="text-sm text-[#5F5F5F] leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
