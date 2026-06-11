'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Lock, MapPin, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react';

const trustItems = [
  { label: '100% Verified Profiles', icon: ShieldCheck },
  { label: 'Safe & Secure', icon: Lock },
  { label: 'Genuine Matches', icon: Users },
  { label: 'Australian Support', icon: MapPin },
] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
};


export function HeroClientSection() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Zoom in/out Ken Burns animation wrapper for the background image */}
      <motion.div
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
        className="absolute inset-0 z-0 select-none pointer-events-none"
      >
        <Image
          src="/home/hero-vivah-australia.jpg"
          alt="Indian couple in wedding attire beside Sydney Harbour"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      </motion.div>

      {/* Elegant multi-directional gradients for luxury tone and high legibility */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,245,0.99)_0%,rgba(255,249,245,0.93)_32%,rgba(255,249,245,0.38)_46%,rgba(255,249,245,0.06)_55%)] z-1" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,245,0)_50%,rgba(255,249,245,0.85)_100%)] z-1" />

      <div className="px-8 sm:px-12 lg:px-16 relative z-10">
        <div className="relative mx-auto flex justify-center min-h-[calc(100vh-80px)] container flex-col">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl pt-10 sm:pt-14 lg:pt-8"
          >
            {/* Tagline/Eyebrow Badge */}
            <motion.div
              variants={itemVariants}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#d4a04c]/30 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#a10e4d] shadow-[0_4px_12px_rgba(212,160,76,0.08)] backdrop-blur-sm"
            >
              <span className="size-1.5 rounded-full bg-[#d4a04c] animate-pulse" />
              Trusted Australian Matrimony
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="max-w-xl font-playfair text-5xl font-bold leading-[1.02] text-[#2f2f2f] sm:text-6xl lg:text-7xl tracking-tight"
            >
              Meaningful Connections.
              <span className="mt-2 block text-[#a10e4d] relative">
                Lifetime Together.
                <span className="absolute -bottom-2 left-0 h-[3px] w-28 bg-gradient-to-r from-[#d4a04c] to-transparent rounded-full" />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mt-8 max-w-lg text-base font-medium leading-7 text-[#2f2f2f]/85 sm:text-lg sm:leading-8 font-poppins"
            >
              Vivah Australia is the premier, verified matrimonial platform dedicated to the Indian and South Asian community in Australia.
            </motion.p>

            {/* Trust Items Grid */}
            <motion.div
              variants={itemVariants}
              className="mt-8 grid max-w-xl grid-cols-2 gap-x-4 gap-y-5 divide-[#a10e4d]/10 sm:grid-cols-4 sm:divide-x"
            >
              {trustItems.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="px-3 text-center first:pl-0 last:pr-0 group transition duration-300"
                >
                  <div className="relative mx-auto flex size-12 items-center justify-center rounded-full border border-[#d4a04c]/30 bg-white/60 shadow-[0_8px_16px_rgba(212,160,76,0.05)] transition-all duration-300 group-hover:scale-110 group-hover:border-[#a10e4d]/40 group-hover:bg-[#fff9f5] group-hover:shadow-[0_12px_22px_rgba(161,14,77,0.1)] backdrop-blur-sm">
                    <Icon className="size-6 text-[#a10e4d]" strokeWidth={1.8} />
                  </div>
                  <p className="mt-3 max-w-[100px] mx-auto flex items-center justify-center text-xs font-semibold leading-5 text-[#2f2f2f] sm:text-[13px] tracking-tight">
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap"
            >
              <motion.div
                whileHover="hover"
                variants={{
                  hover: { scale: 1.02, y: -2 },
                }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  href="/register"
                  className="relative overflow-hidden inline-flex min-h-12 min-w-[214px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a10e4d] to-[#8e0d43] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(161,14,77,0.28)] hover:shadow-[0_24px_50px_rgba(161,14,77,0.4)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
                >
                  {/* Gold shimmer sweep animation */}
                  <motion.span
                    variants={{
                      hover: { x: ['-150%', '150%'] },
                    }}
                    initial={{ x: '-150%' }}
                    transition={{
                      duration: 0.85,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#d4a04c]/40 to-transparent -skew-x-12 select-none pointer-events-none"
                  />
                  <UserPlus className="size-5 z-10" />
                  <span className="z-10">Create Your Profile</span>
                  <Sparkles className="size-4 text-[#d4a04c] animate-pulse z-10 shrink-0" />
                </Link>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={{
                  hover: { scale: 1.02, y: -2 },
                }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  href="/membership"
                  className="relative overflow-hidden inline-flex min-h-12 min-w-[214px] items-center justify-center rounded-xl border-2 border-[#a10e4d]/30 bg-white/90 px-7 py-3.5 text-base font-semibold text-[#a10e4d] shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:border-[#a10e4d]/60 hover:bg-[#fff9f5] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#e74c7c]/20"
                >
                  <motion.span
                    variants={{
                      hover: { x: ['-150%', '150%'] },
                    }}
                    initial={{ x: '-150%' }}
                    transition={{
                      duration: 0.85,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#d4a04c]/20 to-transparent -skew-x-12 select-none pointer-events-none"
                  />
                  <span className="z-10">View Membership Plans</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
