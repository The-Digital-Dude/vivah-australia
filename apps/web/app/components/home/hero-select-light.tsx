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
    <label className="grid gap-2 text-sm font-semibold text-[#2f2f2f]">
      {label}
      <select
        className="h-12 w-full rounded-lg border border-[#A10E4D]/20 bg-white px-4 text-base text-[#1A1A1A] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#A10E4D]/10 shadow-sm"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
