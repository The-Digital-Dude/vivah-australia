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
    <label className="grid gap-2 text-sm font-semibold text-[#2A111A]">
      {label}
      <select
        className="h-12 w-full rounded-lg border border-[#D9A05B]/30 bg-white/80 px-4 text-base text-[#2A111A] outline-none transition focus:border-[#D9A05B] focus:ring-4 focus:ring-[#D9A05B]/20 shadow-sm"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
