import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const uiTokens = {
  page: 'min-h-screen bg-[#FFF8F1] px-4 py-8 text-[#232323]',
  shell: 'mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]',
  panel: 'rounded-lg border border-[#7A1E3A]/10 bg-white p-6 shadow-sm',
  card: 'rounded-lg border border-[#7A1E3A]/10 bg-white p-4',
  accentCard: 'rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4',
  buttonPrimary: 'rounded-md bg-[#7A1E3A] px-4 py-2 text-sm font-semibold text-white',
  buttonSecondary:
    'rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-semibold text-[#7A1E3A]',
  input:
    'h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm outline-none focus:border-[#7A1E3A]',
} as const;

export function PageHeader({
  eyebrow,
  subtitle,
  title,
}: Readonly<{ eyebrow?: string; subtitle?: string; title: string }>) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E6470]">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function MetricCard({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className={uiTokens.accentCard}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function EmptyState({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="rounded-md border border-dashed border-[#7A1E3A]/20 bg-white p-4 text-sm text-[#5E6470]">
      {children}
    </p>
  );
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return (
    <button
      className={cx(
        variant === 'primary' ? uiTokens.buttonPrimary : uiTokens.buttonSecondary,
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(uiTokens.input, className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(uiTokens.input, 'bg-white', className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#5E6470]">
      <input type="checkbox" className="size-4 accent-[#7A1E3A]" {...props} />
      {label}
    </label>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: Readonly<{ children: ReactNode; tone?: 'neutral' | 'success' | 'danger' }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'success' && 'bg-[#F7FBF8] text-[#1F6F4A]',
        tone === 'danger' && 'bg-[#FDECEF] text-[#7A1E3A]',
        tone === 'neutral' && 'bg-[#FFF8F1] text-[#5E6470]',
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  children,
  open,
  title,
}: Readonly<{ children: ReactNode; open: boolean; title: string }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-[#232323]">{title}</h2>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}

export function Drawer({ children, open }: Readonly<{ children: ReactNode; open: boolean }>) {
  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-4 shadow-xl">
      {children}
    </aside>
  );
}

export function Tabs({
  items,
}: Readonly<{ items: Array<{ label: string; active?: boolean; onClick?: () => void }> }>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={cx(
            'rounded-md px-3 py-2 text-sm font-semibold',
            item.active ? 'bg-[#7A1E3A] text-white' : 'border border-[#7A1E3A]/20 text-[#7A1E3A]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ className }: Readonly<{ className?: string }>) {
  return <div className={cx('animate-pulse rounded-md bg-[#FDECEF]', className ?? 'h-4 w-full')} />;
}

export function Pagination({
  onPageChange,
  page,
  totalPages,
}: Readonly<{ onPageChange: (page: number) => void; page: number; totalPages: number }>) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="secondary">
        Previous
      </Button>
      <span className="text-[#5E6470]">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="secondary"
      >
        Next
      </Button>
    </div>
  );
}

export function Avatar({ label, src }: Readonly<{ label: string; src?: string }>) {
  return (
    <div className="grid size-12 place-items-center overflow-hidden rounded-full bg-[#FDECEF] text-sm font-semibold text-[#7A1E3A]">
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        label.slice(0, 1)
      )}
    </div>
  );
}

export function DataTable({
  children,
  headers,
}: Readonly<{ children: ReactNode; headers: string[] }>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#7A1E3A]/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b text-[#5E6470]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}
