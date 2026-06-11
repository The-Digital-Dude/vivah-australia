'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type AnimatedWordPlayProps = {
  eyebrow: string;
  prefix: string;
  words: readonly string[];
  suffix: string;
  body: string;
  align?: 'left' | 'center';
};

export function AnimatedWordPlay({
  align = 'left',
  body,
  eyebrow,
  prefix,
  suffix,
  words,
}: Readonly<AnimatedWordPlayProps>) {
  const shouldReduceMotion = useReducedMotion();
  const wordList = useMemo(() => (words.length ? words : ['connection']), [words]);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion || wordList.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveWordIndex((current) => (current + 1) % wordList.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, wordList.length]);

  const activeWord = wordList[activeWordIndex] ?? wordList[0];

  return (
    <motion.div
      className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d4a04c]">
        {eyebrow}
      </p>

      <h1 className="mt-4 font-playfair text-5xl font-bold leading-[0.96] text-[#2f2f2f] sm:text-6xl lg:text-7xl">
        <span className="block">{prefix}</span>
        <span className="mt-2 block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeWord}
              className="inline-block text-[#a10e4d]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              {...(shouldReduceMotion ? {} : { exit: { opacity: 0, y: -18, rotateX: 80 } })}
              transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeWord}
            </motion.span>
          </AnimatePresence>
          <span className="text-[#2f2f2f]">{suffix}</span>
        </span>
      </h1>

      <p className="mt-6 text-lg leading-8 text-[#5f5f5f]">{body}</p>
    </motion.div>
  );
}
