'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate, type Variants } from 'framer-motion';
import { Heart, Map, ShieldCheck, Users } from 'lucide-react';

const communityStats = [
  { value: '15,000+', label: 'Verified Profiles', icon: Users },
  { value: '5,000+', label: 'Successful Matches', icon: Heart },
  { value: '50,000+', label: 'Members', icon: Users },
  { value: '100%', label: 'Privacy Protected', icon: ShieldCheck },
  { value: 'Australia Wide', label: 'Indian Community', icon: Map },
] as const;

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!isInView) return;

    // Parse the value, handles patterns like 15,000+ or 100%
    const match = value.match(/^([\d,]+)(%|\+)?$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const numStr = match[1];
    const suffix = match[2] || '';
    if (!numStr) return;
    const rawNum = parseInt(numStr.replace(/,/g, ''), 10);

    const controls = animate(0, rawNum, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate(latest) {
        const rounded = Math.round(latest);
        const formatted = rounded.toLocaleString();
        setDisplayValue(`${formatted}${suffix}`);
      },
    });

    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export function CommunityStatsStrip() {
  return (
    <section className="relative z-20 -mt-8 px-8 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid overflow-hidden rounded-2xl bg-[#a10e4d] shadow-[0_18px_42px_rgba(161,14,77,0.24)] ring-1 ring-white/35 sm:grid-cols-2 lg:grid-cols-5"
        >
          {communityStats.map(({ value, label, icon: Icon }) => (
            <motion.div
              key={`${value}-${label}`}
              variants={itemVariants}
              className="relative flex min-h-[92px] items-center gap-4 px-5 py-5 text-white after:absolute after:inset-y-5 after:right-0 after:hidden after:w-px after:bg-white/20 last:after:hidden lg:px-6 lg:after:block group"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 8 }}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#d4a04c]/70 text-[#d4a04c] bg-white/5 transition-all duration-300 group-hover:bg-[#d4a04c]/10"
              >
                <Icon className="size-7" strokeWidth={2.1} />
              </motion.div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight tracking-normal sm:text-2xl">
                  <CountUp value={value} />
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-white/90 sm:text-xs">
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
