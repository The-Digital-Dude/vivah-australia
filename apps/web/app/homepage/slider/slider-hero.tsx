'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';

const slides = [
  {
    eyebrow: 'Premium Australian Matrimony',
    titleA: 'Meaningful Connections.',
    titleB: 'Lifetime Together.',
    body: "Australia's trusted matrimonial platform for the Indian and South Asian community. Verified profiles, genuine intent, lifelong connections.",
    image: '/home/hero-vivah-australia.jpg',
    /* keep faces in frame — portrait ceremony couple */
    imagePosition: '50% 30%',
    ctaLabel: 'Create Your Profile',
    ctaHref: '/register',
    ctaIcon: UserPlus,
  },
  {
    eyebrow: 'Trust-first introductions',
    titleA: 'Verified Profiles.',
    titleB: 'Genuine Intent.',
    body: 'Every member completes identity, employment, and visa checks — so the first conversation already starts with confidence.',
    image: '/home/hero-vivah-australia-2.jpg',
    imagePosition: '50% 20%',
    ctaLabel: 'Browse Matches',
    ctaHref: '/matches',
    ctaIcon: ShieldCheck,
  },
  {
    eyebrow: 'Real stories of love',
    titleA: 'Your Story',
    titleB: 'Begins Here.',
    body: 'Thousands of couples across Australia found each other on Vivah. Family-friendly, respectful, and built for serious journeys.',
    image: '/home/success-stories/couple-06.jpg',
    imagePosition: '50% 20%',
    ctaLabel: 'See Success Stories',
    ctaHref: '/blog',
    ctaIcon: Heart,
  },
] as const;

const autoAdvanceMs = 6000;

export function SliderHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const goTo = useCallback((i: number) => {
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused || reduce) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), autoAdvanceMs);
    return () => clearInterval(id);
  }, [paused, reduce]);

  const slide = slides[index]!;
  const CtaIcon = slide.ctaIcon;

  return (
    <section
      className="relative h-[640px] overflow-hidden bg-[#6B0934] sm:h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* slide backgrounds — all stay mounted so images never reload; crossfade by opacity */}
      {slides.map((s, i) => (
        <motion.div
          key={s.image}
          initial={false}
          animate={
            reduce
              ? { opacity: index === i ? 1 : 0 }
              : { opacity: index === i ? 1 : 0, scale: index === i ? 1 : 1.06 }
          }
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src={s.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            quality={82}
            className="object-cover"
            style={{ objectPosition: s.imagePosition }}
          />
        </motion.div>
      ))}

      {/* cinematic maroon overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(107,9,52,0.92)_0%,rgba(107,9,52,0.72)_38%,rgba(107,9,52,0.25)_70%,rgba(107,9,52,0.15)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_70%,rgba(47,9,28,0.55)_100%)]" />

      {/* slide content */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-xl pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              {...(reduce ? {} : { exit: { opacity: 0, y: -18 } })}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4A04C]/40 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="size-3.5 text-[#D4A04C]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F7D88A]">
                  {slide.eyebrow}
                </span>
              </div>
              <h1 className="font-playfair font-bold leading-[1.06] text-white">
                <span className="block text-4xl sm:text-5xl lg:text-6xl">{slide.titleA}</span>
                <span className="mt-1 block text-4xl text-[#D4A04C] sm:text-5xl lg:text-6xl">
                  {slide.titleB}
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/80">{slide.body}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={slide.ctaHref}
                  className="btn-shimmer inline-flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-[#D4A04C] px-8 py-3.5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(212,160,76,0.40)] transition hover:-translate-y-0.5 hover:bg-[#C4913C]"
                >
                  <CtaIcon className="size-4" />
                  {slide.ctaLabel}
                </Link>
                <Link
                  href="/membership"
                  className="inline-flex min-w-[190px] items-center justify-center rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                >
                  View Membership Plans
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* arrows */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
        className="absolute left-4 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:inline-flex lg:left-8"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
        className="absolute right-4 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:inline-flex lg:right-8"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* dots + progress */}
      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {slides.map((s, i) => (
          <button
            key={s.titleA}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={index === i ? 'true' : undefined}
            onClick={() => goTo(i)}
            className={
              index === i
                ? 'relative h-2.5 w-9 overflow-hidden rounded-full bg-white/30'
                : 'size-2.5 rounded-full bg-white/30 transition hover:bg-white/60'
            }
          >
            {index === i && (
              <motion.span
                key={`progress-${index}-${paused}`}
                initial={{ width: reduce || paused ? '100%' : '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: reduce || paused ? 0 : autoAdvanceMs / 1000, ease: 'linear' }}
                className="absolute inset-y-0 left-0 rounded-full bg-[#D4A04C]"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
