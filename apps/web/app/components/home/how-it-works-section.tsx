'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Search, Send, ShieldCheck, UserRoundPlus } from 'lucide-react';
import type { ReactNode } from 'react';

const steps = [
  {
    title: 'Create Profile',
    description: 'Build your profile and complete verification',
    icon: UserRoundPlus,
  },
  {
    title: 'Search & Match',
    description: 'Find suitable matches with advanced filters',
    icon: Search,
  },
  {
    title: 'Connect',
    description: 'Express interest and start conversations',
    icon: Send,
  },
  {
    title: 'Build Relationship',
    description: 'Find your life partner with trust and confidence',
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
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-0">
      <div className="container mx-auto">
        <h2 className="text-center font-playfair text-3xl font-bold leading-tight text-[#2f2f2f] sm:text-4xl">
          How Vivah Australia Works
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <FadeInAnimation key={title} index={index}>
              <article className="group relative flex min-h-[210px] flex-col items-center justify-center px-5 py-8 text-center transition duration-300">
                <span className="absolute left-12 top-4 flex size-8 items-center justify-center rounded-full bg-[#d60b4f] text-base font-bold text-white shadow-[0_10px_24px_rgba(214,11,79,0.22)]">
                  {index + 1}
                </span>

                <div className="flex size-20 items-center justify-center rounded-full bg-[rgba(231,76,124,0.14)] text-[#a10e4d] transition duration-300 group-hover:scale-110 group-hover:bg-[rgba(231,76,124,0.2)]">
                  <Icon
                    className="size-11 transition duration-300 group-hover:scale-110"
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="mt-6 text-lg font-bold leading-tight text-[#1f1f1f]">{title}</h3>
                <p className="mt-3 max-w-[190px] text-sm font-medium leading-6 text-[#2f2f2f]">
                  {description}
                </p>

                {index < steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[calc(100%+0.25rem)] top-1/2 hidden w-7 -translate-y-1/2 xl:block"
                  >
                    <div className="relative border-t-2 border-dotted border-[#2f2f2f]/55">
                      <span className="absolute -right-1.5 -top-[5px] size-2.5 rotate-45 border-r-2 border-t-2 border-[#2f2f2f]/55" />
                    </div>
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
