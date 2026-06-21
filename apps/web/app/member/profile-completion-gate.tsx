'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Lock } from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import type { ProfileStrengthAction } from './profile-strength-meter';

interface ProfileCompletionGateProps {
  percentage: number;
  threshold: number;
  missing: ProfileStrengthAction[];
  nextActionHref: string;
}

export default function ProfileCompletionGate({
  percentage,
  threshold,
  missing,
  nextActionHref,
}: ProfileCompletionGateProps) {
  const remaining = Math.max(0, threshold - percentage);
  const topMissing = missing.slice(0, 4);

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center px-3 py-8 sm:px-6">
      {/* Soft backdrop over the blurred dashboard preview behind this gate */}
      <div className="absolute inset-0 bg-[#FFF9F5]/70" aria-hidden />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#A10E4D]/15 bg-white shadow-[0_24px_64px_rgba(122,31,43,0.22)]">
        <div className="bg-[linear-gradient(135deg,#A10E4D_0%,#890B40_48%,#4A0A14_100%)] px-6 py-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Lock className="size-6 text-[#D4A04C]" />
          </div>
          <h2 className="mt-4 text-xl font-bold sm:text-2xl">Complete your profile to unlock Vivah</h2>
          <p className="mt-2 text-sm text-white/80">
            Your profile is only <span className="font-bold text-white">{percentage}%</span> complete.
            Members with stronger profiles get up to <span className="font-bold text-white">5x more matches</span> —
            finish setup to unlock your dashboard, matches and messages.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#6B7280]">
            <span>{percentage}% complete</span>
            <span>{remaining}% to unlock</span>
          </div>
          <Progress
            value={percentage}
            className="h-2.5 bg-[#A10E4D]/10"
            indicatorClassName="bg-[linear-gradient(90deg,#A10E4D_0%,#D4A04C_100%)]"
          />

          {topMissing.length > 0 ? (
            <ul className="mt-5 grid gap-2">
              {topMissing.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start gap-3 rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-3 py-2.5"
                >
                  <Circle className="mt-0.5 size-4 shrink-0 text-[#A10E4D]/40" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2F2F2F]">{item.label}</p>
                    <p className="text-xs text-[#6B7280]">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href={nextActionHref}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A10E4D] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#890B40]"
          >
            Complete profile now
            <ArrowRight className="size-4" />
          </Link>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[#8A8F99]">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Takes just a few minutes — your matches are waiting.
          </p>
        </div>
      </div>
    </div>
  );
}
