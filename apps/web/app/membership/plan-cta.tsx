'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/auth-context';

interface Props {
  tierKey: 'FREE' | 'PREMIUM' | 'GOLD' | 'PLATINUM';
  label: string;
  style: string;
  freeHref?: string;
}

export default function PlanCTA({ tierKey, label, style, freeHref = '/register' }: Props) {
  const router = useRouter();
  const { token, initialized } = useAuth();

  function handleClick() {
    if (tierKey === 'FREE') {
      router.push(initialized && token ? '/member' : freeHref);
      return;
    }
    const dest = `/pricing?tier=${tierKey}`;
    router.push(initialized && token ? dest : `/register?returnUrl=${encodeURIComponent(dest)}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition ${style}`}
    >
      {label} <ArrowRight className="size-4" />
    </button>
  );
}
