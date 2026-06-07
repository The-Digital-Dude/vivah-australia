'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { CheckCircle2, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

const pricingPlans = [
  {
    name: 'Free',
    subtitle: 'Basic access',
    price: 'A$0',
    period: 'forever',
    cta: 'Get started',
    href: '/register',
    highlights: ['Browse profiles', '5 interests per day', 'Standard visibility'],
    featured: false,
  },
  {
    name: 'Silver',
    subtitle: 'Enhanced access',
    price: 'A$29',
    period: 'month',
    cta: 'Choose Silver',
    href: '/pricing',
    highlights: ['Contact details', '20 interests per day', '1 monthly boost'],
    featured: false,
  },
  {
    name: 'Gold',
    subtitle: 'Premium access',
    price: 'A$49',
    period: 'month',
    cta: 'Choose Gold',
    href: '/pricing',
    highlights: ['Unlimited access', 'Higher visibility', '5 monthly boosts'],
    featured: true,
  },
  {
    name: 'Platinum',
    subtitle: 'Ultimate access',
    price: 'A$79',
    period: 'month',
    cta: 'Choose Platinum',
    href: '/pricing',
    highlights: ['Maximum visibility', '10 monthly boosts', '24/7 priority support'],
    featured: false,
  },
] as const;

type FadeInAnimationProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  index?: number;
  yIndex?: number;
};

function FadeInAnimation({
  children,
  delay = 0.12,
  duration = 0.48,
  index,
  yIndex = 50,
}: FadeInAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  const fadeInAnimationVariants: Variants = {
    initial: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : yIndex,
    },
    animate: (customIndex: number | undefined) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion
          ? 0
          : customIndex !== undefined
            ? delay * (customIndex + 1)
            : delay,
        duration: shouldReduceMotion ? 0 : duration,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <motion.div
      className="h-full"
      custom={index}
      initial="initial"
      variants={fadeInAnimationVariants}
      viewport={{ once: true, amount: 0.35 }}
      whileInView="animate"
    >
      {children}
    </motion.div>
  );
}

export function MinimalPricingSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
              Membership plans
            </p>
            <h2 className="mt-3 font-playfair text-4xl font-bold leading-tight text-[#2f2f2f] sm:text-5xl">
              Find the plan that fits your search
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#5f5f5f]">
              Start free, then upgrade when you are ready for direct communication, better
              visibility, and priority support.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#a10e4d]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#a10e4d] shadow-sm transition hover:bg-[#fff3f7] focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
          >
            Compare all features
          </Link>
        </div>

        <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-[#a10e4d]/10 shadow-[0_20px_55px_rgba(47,47,47,0.07)] md:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan, index) => (
            <FadeInAnimation key={plan.name} index={index}>
              <article
                className={[
                  'relative flex h-full min-h-[360px] flex-col p-6',
                  plan.featured
                    ? 'bg-[linear-gradient(180deg,#fff9ef_0%,#ffffff_100%)] ring-1 ring-inset ring-[#d4a04c]'
                    : 'bg-white',
                ].join(' ')}
              >
                {plan.featured ? (
                  <div className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-[#d4a04c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f2f2f] shadow-sm">
                    <Crown className="size-3.5" />
                    Best value
                  </div>
                ) : (
                  <div className="mb-4 h-6" aria-hidden="true" />
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-playfair text-2xl font-bold text-[#2f2f2f]">{plan.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5f5f5f]">
                      {plan.subtitle}
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff3f7] text-[#a10e4d]">
                    {plan.featured ? (
                      <Sparkles className="size-5" />
                    ) : (
                      <ShieldCheck className="size-5" />
                    )}
                  </span>
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold leading-none text-[#2f2f2f]">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm font-medium text-[#5f5f5f]">/ {plan.period}</span>
                </div>

                <ul className="mt-6 grid gap-3 text-sm leading-5 text-[#5f5f5f]">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1f9d68]" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={[
                    'mt-auto inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20',
                    plan.featured
                      ? 'bg-[#a10e4d] text-white shadow-[0_16px_34px_rgba(161,14,77,0.2)] hover:bg-[#8e0d43]'
                      : 'border border-[#a10e4d]/25 bg-white text-[#a10e4d] hover:bg-[#fff3f7]',
                  ].join(' ')}
                >
                  {plan.cta}
                </Link>
              </article>
            </FadeInAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
