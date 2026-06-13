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
        <div className="grid overflow-hidden rounded-2xl bg-gradient-to-br from-white to-[#FDFBF7] shadow-[0_30px_70px_rgba(217,160,91,0.1)] border border-[#D9A05B]/20 sm:grid-cols-2 lg:grid-cols-5">
          {communityStats.map(({ value, label, icon: Icon }) => (
            <motion.div
              key={`${value}-${label}`}
              className="group relative flex min-h-[92px] items-center gap-4 px-5 py-5 text-[#2A111A] after:absolute after:inset-y-5 after:right-0 after:hidden after:w-px after:bg-[#D9A05B]/20 last:after:hidden lg:px-6 lg:after:block"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#D9A05B] border border-[#D9A05B]/20 shadow-sm transition duration-300 group-hover:scale-110">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="font-playfair text-2xl font-bold leading-none text-[#2A111A] tracking-tight">{value}</div>
                <div className="mt-1 text-[13px] font-medium uppercase tracking-wider text-[#4A0E25]/80">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
