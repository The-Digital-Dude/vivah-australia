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
    <section className="relative z-20 bg-white px-8 py-24 sm:px-12 lg:px-16 border-b border-[#E74C7C]/10">
      <div className="container mx-auto">
        <h2 className="text-center font-playfair text-4xl font-bold leading-tight text-[#1A1A1A] sm:text-5xl">
          Your Journey to Forever, Simplified.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <FadeInAnimation key={title} index={index}>
              <article className="group relative flex min-h-[250px] flex-col items-center justify-center rounded-sm border border-[#E74C7C]/15 bg-[#FFF9F5] px-6 py-10 text-center hover:-translate-y-2 transition duration-500">
                <span className="absolute left-6 top-6 flex size-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#A10E4D] shadow-sm border border-[#A10E4D]/20">
                  {index + 1}
                </span>

                <div className="flex size-20 items-center justify-center rounded-full bg-white border border-[#D4A04C]/30 shadow-sm text-[#D4A04C] transition duration-500 group-hover:scale-110 group-hover:shadow-md">
                  <Icon
                    className="size-10 transition duration-500 group-hover:scale-110"
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="mt-6 text-xl font-bold leading-tight text-[#1A1A1A] font-playfair">{title}</h3>
                <p className="mt-3 max-w-[210px] text-sm font-medium leading-relaxed text-[#5f5f5f]">
                  {description}
                </p>

                {index < steps.length - 1 ? (
                    className="pointer-events-none absolute left-[calc(100%+0.25rem)] top-1/2 hidden -translate-y-1/2 text-[#D4A04C]/30 xl:block z-10"
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
