'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';

export interface ProfileStrengthAction {
  key: string;
  label: string;
  description: string;
  actionLabel: string;
  section: string;
  href: string;
}

export interface ProfileStrength {
  percentage: number;
  missing: ProfileStrengthAction[];
  nextAction: ProfileStrengthAction | null;
}

interface ProfileStrengthMeterProps {
  strength?: ProfileStrength | null;
  compact?: boolean;
  onAction?: (action: ProfileStrengthAction) => void;
}

export default function ProfileStrengthMeter({
  strength,
  compact = false,
  onAction,
}: ProfileStrengthMeterProps) {
  const percentage = strength?.percentage ?? 0;
  const nextAction = strength?.nextAction ?? null;
  const isStrong = percentage >= 80;

  const actionControl = nextAction ? (
    onAction ? (
      <button
        type="button"
        onClick={() => onAction(nextAction)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#A10E4D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#890B40]"
      >
        {nextAction.actionLabel}
        <ArrowRight className="size-3.5" />
      </button>
    ) : (
      <Link
        href={nextAction.href}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#A10E4D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#890B40]"
      >
        {nextAction.actionLabel}
        <ArrowRight className="size-3.5" />
      </Link>
    )
  ) : null;

  return (
    <section
      className={
        compact
          ? 'rounded-2xl border border-[#A10E4D]/10 bg-white p-4'
          : 'rounded-2xl border border-[#A10E4D]/20 bg-[linear-gradient(135deg,#FFF0F3_0%,#FFFFFF_100%)] p-4 shadow-sm'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#D4A04C]" />
            <p className="text-sm font-bold text-[#A10E4D]">Profile Strength</p>
          </div>
          {!compact ? (
            <p className="mt-1 text-xs font-medium text-[#6B7280]">
              Complete your profile to get more relevant matches.
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-bold text-[#A10E4D]">{percentage}%</p>
      </div>

      <Progress
        value={percentage}
        className="mt-3 h-2 bg-[#A10E4D]/10"
        indicatorClassName="bg-[linear-gradient(90deg,#A10E4D_0%,#D4A04C_100%)]"
      />

      {nextAction ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-[#2F2F2F]">{nextAction.label}</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">{nextAction.description}</p>
          </div>
          {actionControl}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          {isStrong
            ? 'Great job. Your profile is ready to make a strong impression.'
            : 'Your profile is ready for the next step.'}
        </p>
      )}
    </section>
  );
}
