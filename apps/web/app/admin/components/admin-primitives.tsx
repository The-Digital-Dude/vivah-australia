'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

// ─── ADMIN PAGE HEADER ───────────────────────────────────────────────────────
export function AdminPageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#7A1F2B] transition">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── ADMIN METRIC CARD ───────────────────────────────────────────────────────
export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  trendType = 'positive',
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  description?: string | undefined;
  trend?: string | undefined;
  trendType?: 'positive' | 'negative' | 'neutral' | undefined;
}) {
  const trendColors = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    negative: 'bg-rose-50 text-rose-700 border-rose-100',
    neutral: 'bg-neutral-50 text-neutral-600 border-neutral-100',
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</span>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-500">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-neutral-900">{value}</span>
        {trend && (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${trendColors[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
    </div>
  );
}

// ─── ADMIN STATUS BADGE ──────────────────────────────────────────────────────
export function AdminStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const normalized = (status ?? 'PENDING').toUpperCase();

  const styles: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    SUCCESS: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    SUCCESSFUL: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    PAID: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    PUBLISHED: 'bg-emerald-50 text-emerald-800 border-emerald-250',
    
    PENDING: 'bg-amber-50 text-amber-800 border-amber-250',
    REVIEWING: 'bg-amber-50 text-amber-800 border-amber-250',
    INVESTIGATING: 'bg-amber-50 text-amber-800 border-amber-250',
    DRAFT: 'bg-amber-50 text-amber-800 border-amber-250',
    SCHEDULED: 'bg-amber-50 text-amber-800 border-amber-250',
    
    REJECTED: 'bg-rose-50 text-rose-800 border-rose-250',
    SUSPENDED: 'bg-rose-50 text-rose-800 border-rose-250',
    FAILED: 'bg-rose-50 text-rose-800 border-rose-250',
    CLOSED: 'bg-rose-50 text-rose-800 border-rose-250',
    HIGH_RISK: 'bg-rose-50 text-rose-800 border-rose-250',
    
    DISMISSED: 'bg-neutral-50 text-neutral-800 border-neutral-250',
    RESOLVED: 'bg-blue-50 text-blue-800 border-blue-250',
    REFUNDED: 'bg-blue-50 text-blue-800 border-blue-250',
    ARCHIVED: 'bg-neutral-50 text-neutral-800 border-neutral-250',
  };

  const currentStyle = styles[normalized] || 'bg-neutral-50 text-neutral-800 border-neutral-250';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentStyle}`}>
      {normalized}
    </span>
  );
}

// ─── ADMIN EMPTY STATE ───────────────────────────────────────────────────────
export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center bg-white shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 border border-neutral-200 text-neutral-400">
        📭
      </div>
      <h3 className="mt-4 text-base font-bold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── ADMIN LOADING STATE ─────────────────────────────────────────────────────
export function AdminLoadingState({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-10 w-24 animate-pulse rounded-xl bg-neutral-200" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 bg-neutral-50 p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-neutral-200" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-neutral-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: cols }).map((_, j) => (
                  <div key={j} className="h-4 animate-pulse rounded bg-neutral-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DROPDOWN MENU ───────────────────────────────────────────────────────────
export function AdminActionMenu({
  actions,
}: {
  actions: Array<{ label: string; onClick: () => void; isDestructive?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 shadow-sm transition"
        type="button"
        aria-label="Action menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl border border-neutral-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
          {actions.map((act, index) => (
            <button
              key={index}
              onClick={() => {
                setOpen(false);
                act.onClick();
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                act.isDestructive
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              type="button"
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ERROR STATE ───────────────────────────────────────────────────────
export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-rose-100 p-8 text-center bg-rose-50/20 shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-650">
        ⚠️
      </div>
      <h3 className="mt-4 text-base font-bold text-neutral-900">Operational Error</h3>
      <p className="mt-2 text-sm text-neutral-500 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-xl bg-[#7A1F2B] hover:bg-[#651925] px-4.5 py-2 text-xs font-bold text-white shadow-sm transition"
          type="button"
        >
          Retry Request
        </button>
      )}
    </div>
  );
}

