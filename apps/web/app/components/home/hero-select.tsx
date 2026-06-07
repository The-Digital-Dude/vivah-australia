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
        className="h-12 w-full rounded-lg border border-[#a10e4d]/12 bg-[#fff9f5] px-4 text-base text-[#2f2f2f] outline-none transition focus:border-[#a10e4d] focus:ring-4 focus:ring-[#e74c7c]/15"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
