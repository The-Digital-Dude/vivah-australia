'use client';

import { motion, type Variants } from 'framer-motion';
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

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
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
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
};

export function TrustVerificationStrip() {
  return (
    <section className="border-y border-[#d4a04c]/18 bg-[#fff9f5] px-8 py-6 sm:px-12 lg:px-16 overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid gap-y-6 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-[#d4a04c]/20"
        >
          {trustFeatures.map(({ label, icon: Icon }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              whileHover="hover"
              className="flex items-center gap-4 px-2 sm:justify-center lg:px-5 xl:px-7 group cursor-pointer"
            >
              <motion.span
                variants={{
                  hover: { scale: 1.12, rotate: [0, -10, 10, 0] }
                }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#d4a04c]/35 bg-white text-[#a10e4d] shadow-[0_8px_22px_rgba(161,14,77,0.06)] group-hover:border-[#a10e4d]/40 group-hover:bg-[#fff4f8] transition-colors duration-300"
              >
                <Icon className="size-7" strokeWidth={1.8} />
              </motion.span>
              <motion.p
                variants={{
                  hover: { x: 3 }
                }}
                transition={{ duration: 0.2 }}
                className="max-w-[180px] text-sm font-bold leading-5 text-[#2f2f2f] lg:text-[15px]"
              >
                {label}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
