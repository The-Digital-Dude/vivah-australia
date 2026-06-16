'use client';

import type { ReactNode } from 'react';
import { PublicFooter, PublicHeader } from '@/app/components';

export default function AuthShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-xl px-6 text-center">
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">{subtitle}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* Form card */}
      <main className="flex-1 flex flex-col items-center px-4 mt-8 pb-16 sm:px-6">
        <section className="w-full max-w-md bg-white border border-brand-maroon/10 rounded-3xl p-8 shadow-[0_18px_50px_rgba(122,31,43,0.08)] sm:p-10">
          <div className="mt-4">{children}</div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
