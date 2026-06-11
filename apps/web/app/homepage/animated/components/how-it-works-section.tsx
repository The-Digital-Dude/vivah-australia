'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight, Search, Send, ShieldCheck, UserRoundPlus } from 'lucide-react';
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
  yIndex = 40,
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
        ease: 'easeOut',
      },
    }),
  };

  return (
    <motion.div
      custom={index}
      initial="initial"
      variants={fadeInAnimationVariants}
      viewport={{ once: true, amount: 0.25 }}
      whileInView="animate"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="bg-[#fff9f5] px-8 py-16 sm:px-12 lg:px-16 overflow-hidden">
      <div className="container mx-auto relative">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c] mb-2 font-poppins">
            Four Simple Steps
          </p>
          <h2 className="text-center font-playfair text-3xl font-bold leading-tight text-[#2f2f2f] sm:text-4xl">
            How Vivah Australia Works
          </h2>
        </div>

        {/* Connecting Timeline Line behind step circles */}
        <div className="absolute top-[52%] left-[12%] right-[12%] hidden h-[2px] -translate-y-1/2 bg-gradient-to-r from-[#d4a04c]/5 via-[#d4a04c]/50 to-[#d4a04c]/5 xl:block z-0" />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8 relative z-10">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <FadeInAnimation key={title} index={index}>
              <motion.article 
                whileHover="hover"
                variants={{
                  hover: { y: -6 }
                }}
                className="group relative flex h-full min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-[#d4a04c]/20 bg-white px-6 py-10 text-center shadow-[0_12px_28px_rgba(212,160,76,0.03)] hover:shadow-[0_20px_45px_rgba(161,14,77,0.06)] hover:border-[#a10e4d]/40 transition-all duration-300 cursor-pointer"
              >
                <motion.span
                  variants={{
                    hover: { scale: 1.15, y: -2, transition: { type: 'spring', stiffness: 400, damping: 10 } }
                  }}
                  className="absolute left-6 top-6 flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-[#a10e4d] to-[#8e0d43] text-sm font-bold text-white shadow-[0_8px_20px_rgba(161,14,77,0.22)]"
                >
                  {index + 1}
                </motion.span>

                <motion.div
                  variants={{
                    hover: { scale: 1.08, rotate: [0, -6, 6, 0], transition: { duration: 0.45, ease: 'easeInOut' } }
                  }}
                  className="flex size-20 items-center justify-center rounded-full border border-[#d4a04c]/10 bg-[rgba(231,76,124,0.08)] text-[#a10e4d] transition-colors duration-300 group-hover:bg-[#a10e4d] group-hover:text-white group-hover:shadow-[0_10px_25px_rgba(161,14,77,0.15)] shadow-inner"
                >
                  <Icon
                    className="size-9"
                    strokeWidth={1.8}
                  />
                </motion.div>

                <h3 className="mt-6 text-lg font-bold leading-tight text-[#2f2f2f] font-playfair">{title}</h3>
                <p className="mt-3 max-w-[210px] text-sm font-medium leading-relaxed text-[#5f5f5f] font-poppins">
                  {description}
                </p>

                {index < steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[calc(100%+0.25rem)] top-[52%] hidden -translate-y-1/2 text-[#a10e4d]/30 xl:block z-10"
                  >
                    <ChevronRight className="size-6" strokeWidth={2.5} />
                  </div>
                ) : null}
              </motion.article>
            </FadeInAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
