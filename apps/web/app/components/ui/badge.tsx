import * as React from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type BadgeVariant = 'default' | 'premium' | 'gold' | 'emerald' | 'outline' | 'vip';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#FFF0F3] text-[#A10E4D] border-[#A10E4D]/10',
  premium: 'bg-[#A10E4D] text-white border-[#A10E4D]',
  gold: 'bg-[#FFF2CD] text-[#7A5200] border-[#D4A04C]/30',
  emerald: 'bg-[#F0FBF6] text-[#1F6F4A] border-[#1F6F4A]/15',
  outline: 'bg-transparent text-[#A10E4D] border-[#A10E4D]/30',
  vip: 'bg-[linear-gradient(135deg,#D4A04C,#A10E4D)] text-white border-transparent',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
