'use client';

import { motion } from 'framer-motion';
import { Heart, Map, ShieldCheck, Users } from 'lucide-react';

const communityStats = [
  { value: '15,000+', label: 'Verified Profiles', icon: Users },
  { value: '5,000+', label: 'Successful Matches', icon: Heart },
  { value: '50,000+', label: 'Members', icon: Users },
  { value: '100%', label: 'Privacy Protected', icon: ShieldCheck },
  { value: 'Australia Wide', label: 'Indian Community', icon: Map },
] as const;

export function CommunityStatsStrip() {
  return (
    <section className="relative z-20 -mt-8 px-8 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_rgba(0,0,0,0.05)] border border-[#E74C7C]/15 sm:grid-cols-2 lg:grid-cols-5">
          {communityStats.map(({ value, label, icon: Icon }) => (
            <motion.div
              key={`${value}-${label}`}
              className="relative flex min-h-[92px] items-center gap-4 px-5 py-5 text-[#1A1A1A] after:absolute after:inset-y-5 after:right-0 after:hidden after:w-px after:bg-[#E74C7C]/15 last:after:hidden lg:px-6 lg:after:block"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#E74C7C]/30 bg-gradient-to-br from-[#FFF1F5] to-white text-[#A10E4D] shadow-sm">
                <Icon className="size-6" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight tracking-normal sm:text-2xl">
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-[#5f5f5f] sm:text-xs">
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
