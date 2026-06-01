'use client';

import { useEffect, useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { PageHero, PublicFooter, PublicHeader } from '@/app/components';
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
      <PageHero
        eyebrow="Premium matchmaking access"
        title="Choose the visibility and connection tools that match your search."
      >
            Upgrade for deeper search, higher recommendation limits, profile boosts, and full
            payment history from your member dashboard.
      </PageHero>
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.08)]"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665b]">
                      {plan.description ?? 'Thoughtful tools for serious introductions.'}
                    </p>
                  </div>
                  {plan.code !== 'FREE' ? <Crown className="h-6 w-6 text-[#D4AF37]" /> : null}
                </div>

                <div>
                  <span className="text-4xl font-semibold">
                    ${(plan.priceCents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm uppercase text-[#6f665b]"> / {plan.interval}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-6 text-[#3d352d]">
                      <Check className="mt-1 h-4 w-4 flex-none text-[#2f7d57]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className="mt-8 rounded-2xl bg-[#7A1F2B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#651925]"
              >
                {plan.code === 'FREE' ? 'Current free access' : 'Upgrade'}
              </button>
            </article>
          ))}
        </div>
      </main>

      <UpgradeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      <PublicFooter />
    </div>
  );
}
