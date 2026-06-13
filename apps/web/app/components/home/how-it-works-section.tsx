'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight, Search, Send, ShieldCheck, UserRoundPlus } from 'lucide-react';
import type { ReactNode } from 'react';

const steps = [
  {
    title: 'Create Your Profile',
    description: 'Sign up in minutes and complete our strict verification process to join a secure community.',
    icon: UserRoundPlus,
  },
  {
    title: 'Discover Matches',
    description: 'Use advanced filters to find singles who align with your lifestyle, profession, and family background.',
    icon: Search,
  },
  {
    title: 'Connect & Converse',
    description: 'Express interest and start meaningful conversations with members who catch your eye.',
    icon: Send,
  },
  {
    title: 'Meet & Marry',
    description: 'Take your connection offline, involve your families, and begin planning your beautiful future together.',
    icon: ShieldCheck,
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

export function HowItWorksSection() {
  return (
    <section className="bg-[#0B0407] px-8 py-14 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <h2 className="text-center font-playfair text-3xl font-bold leading-tight text-white sm:text-4xl">
          Your Journey to Forever, Simplified.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <FadeInAnimation key={title} index={index}>
              <article className="group relative flex min-h-[250px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md px-6 py-10 text-center shadow-sm hover:shadow-[0_0_30px_rgba(161,14,77,0.2)] hover:border-white/20 hover:-translate-y-1 transition duration-300">
                <span className="absolute left-6 top-6 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A04C] to-[#E74C7C] text-sm font-bold text-white shadow-[0_0_15px_rgba(212,160,76,0.4)]">
                  {index + 1}
                </span>

                <div className="flex size-20 items-center justify-center rounded-full bg-white/10 text-white transition duration-300 group-hover:scale-110 group-hover:bg-white/20">
                  <Icon
                    className="size-10 transition duration-300 group-hover:scale-110 drop-shadow-md"
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="mt-6 text-lg font-bold leading-tight text-white">{title}</h3>
                <p className="mt-3 max-w-[210px] text-sm font-medium leading-relaxed text-white/80">
                  {description}
                </p>

                {index < steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[calc(100%+0.25rem)] top-1/2 hidden -translate-y-1/2 text-white/20 xl:block z-10"
                  >
                    <ChevronRight className="size-7" strokeWidth={2.5} />
                  </div>
                ) : null}
              </article>
            </FadeInAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
