'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScrollProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Disable smooth scrolling on member and admin routes.
    if (pathname?.startsWith('/member') || pathname?.startsWith('/admin')) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      lerp: 0.08,
      smoothWheel: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };

    frame = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
