'use client';

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
