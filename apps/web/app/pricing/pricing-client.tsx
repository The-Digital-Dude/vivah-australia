'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { PublicFooter, PublicHeader, StaticPageHero, PremiumButton } from '@/app/components';
import UpgradeModal from '../member/upgrade-modal';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  features: string[];
  limits: Record<string, number>;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    void fetch(`${apiBaseUrl}/api/plans`)
      .then((response) => response.json())
      .then((data: { plans?: Plan[] }) => setPlans(data.plans ?? []))
      .catch(() => setPlans([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A]">
      <PublicHeader />
      <StaticPageHero
        eyebrow="Premium matchmaking access"
        title="Choose the visibility and connection tools that match your search."
        subtitle="Upgrade for deeper search, higher recommendation limits, profile boosts, and full payment history from your member dashboard."
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const isFree = plan.code === 'FREE';
            const isPremium =
              plan.code === 'GOLD' || plan.code === 'VIP' || plan.code === 'PLATINUM';

            return (
              <article
                key={plan.id}
                className={cx(
                  'relative flex min-h-[460px] flex-col justify-between rounded-3xl p-7 transition duration-200 hover:-translate-y-0.5 bg-white shadow-[0_18px_50px_rgba(122,31,43,0.06)] border',
                  isPremium
                    ? 'border-[#D4AF37] shadow-[0_20px_50px_rgba(212,175,55,0.12)]'
                    : 'border-[#7A1F2B]/10',
                )}
              >
                {/* Popular Ribbon for Premium Plan */}
                {isPremium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] shadow-md flex items-center gap-1 select-none">
                    <Sparkles className="size-3 text-[#1A1A1A]" /> Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1A1A1A]">{plan.name}</h2>
                      <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                        {plan.description ?? 'Thoughtful tools for serious introductions.'}
                      </p>
                    </div>
                    {!isFree && <Crown className="size-6 text-[#D4AF37] shrink-0" />}
                  </div>

                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-[#1A1A1A]">
                      ${(plan.priceCents / 100).toFixed(0)}
                    </span>
                    <span className="text-xs uppercase font-semibold text-[#6B7280] ml-1.5">
                      / {plan.interval.toLowerCase()}
                    </span>
                  </div>

                  <hr className="border-[#7A1F2B]/10" />

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-sm leading-6 text-[#3d352d] font-medium"
                      >
                        <Check className="mt-1 size-4 flex-none text-emerald-600 font-bold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <PremiumButton
                    onClick={() => setSelectedPlan(plan)}
                    variant={isFree ? 'secondary' : isPremium ? 'gold' : 'primary'}
                    className="w-full h-12"
                    disabled={isFree}
                  >
                    {isFree ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </PremiumButton>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <UpgradeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      <PublicFooter />
    </div>
  );
}
