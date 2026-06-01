import type { ReactNode } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

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
