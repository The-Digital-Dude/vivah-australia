import type { ReactNode } from 'react';

export function HeroSelect({
  children,
  label,
  name,
}: Readonly<{
  children: ReactNode;
  label: string;
  name: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/90">
      {label}
      <select
        className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-[#a10e4d] focus:ring-4 focus:ring-[#e74c7c]/15 [&>option]:bg-[#0B0407]"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
