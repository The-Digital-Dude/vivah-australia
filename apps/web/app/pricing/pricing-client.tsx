'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
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
    <main className="min-h-screen bg-[#f8f5ef] text-[#241c15]">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c7a3] bg-white px-4 py-2 text-sm font-semibold text-[#8b5e1b]">
            <Sparkles className="h-4 w-4" />
            Premium matchmaking access
          </div>
          <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">
            Choose the visibility and connection tools that match your search.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[#675f55]">
            Upgrade for deeper search, higher recommendation limits, profile boosts, and full
            payment history from your member dashboard.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="flex min-h-[420px] flex-col justify-between rounded-lg border border-[#e1d8c8] bg-white p-6 shadow-sm"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665b]">
                      {plan.description ?? 'Thoughtful tools for serious introductions.'}
                    </p>
                  </div>
                  {plan.code !== 'FREE' ? <Crown className="h-6 w-6 text-[#b9821f]" /> : null}
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
                className="mt-8 rounded-md bg-[#241c15] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b2f24]"
              >
                {plan.code === 'FREE' ? 'Current free access' : 'Upgrade'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <UpgradeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </main>
  );
}
