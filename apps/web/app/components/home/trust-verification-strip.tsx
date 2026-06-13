'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, BriefcaseBusiness, Headset, LockKeyhole, ScanFace } from 'lucide-react';

const trustFeatures = [
  {
    label: 'Manual & AI Verified Profiles',
    icon: BadgeCheck,
  },
  {
    label: 'ID, Visa & Employment Verification',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Facial Verification Available',
    icon: ScanFace,
  },
  {
    label: 'Australian Based Customer Support',
    icon: Headset,
  },
  {
    label: 'Your Privacy is Our Priority',
    icon: LockKeyhole,
  },
] as const;

export function TrustVerificationStrip() {
  return (
    <section className="border-y border-white/10 bg-transparent backdrop-blur-md px-8 py-5 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <div className="grid gap-y-5 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-white/10">
          {trustFeatures.map(({ label, icon: Icon }) => (
            <motion.div
              key={label}
              className="flex items-center gap-4 px-2 sm:justify-center lg:px-5 xl:px-7"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_0_15px_rgba(212,160,76,0.2)]">
                <Icon className="size-7" strokeWidth={1.8} />
              </span>
              <p className="max-w-[180px] text-sm font-bold leading-5 text-white/90 lg:text-[15px]">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
