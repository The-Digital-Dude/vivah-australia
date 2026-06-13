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
        className="h-12 w-full rounded-lg border border-white/50 bg-white/70 backdrop-blur px-4 text-base text-[#2f2f2f] outline-none transition focus:border-[#D4A04C] focus:ring-4 focus:ring-[#D4A04C]/20"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
