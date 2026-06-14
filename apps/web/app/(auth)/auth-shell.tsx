'use client';

import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/app/components';

export default function AuthShell({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle: string; children: ReactNode }>) {
  const trustItems = [
    '100% Verified Matrimonial Profiles',
    'Strict Privacy & Security Controls',
    'Culturally Aligned Search Preferences',
    'Safe & Secure Matrimonial Chats',
  ];

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-charcoal font-poppins grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left Emotional Brand Panel (Desktop-only) */}
      <section className="hidden lg:flex flex-col justify-between p-16 text-white relative overflow-hidden bg-brand-maroon border-r border-brand-maroon/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        {/* Top Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="font-playfair font-extrabold text-2xl tracking-wide text-white">
            VIVAH <span className="text-brand-gold">AUSTRALIA</span>
          </span>
        </div>

        {/* Center Marketing & Matrimonial Taglines */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="w-16 h-1.5 bg-brand-gold rounded-full mb-8 shadow-sm" />
          <h2 className="font-playfair font-bold text-4xl leading-tight mb-6">
            Australia's Premium Matrimonial Platform for the South Asian Community
          </h2>
          <p className="text-base text-white/80 leading-relaxed mb-10">
            Fostering trust-first, verified connections that lead to meaningful matrimonial unions.
            Begin your journey with peace of mind.
          </p>

          <ul className="grid gap-4 mt-8">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span className="text-sm font-semibold tracking-wide text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Testimonial/Quote Block */}
        <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-xl max-w-lg mt-auto">
          <p className="text-sm italic leading-relaxed text-white/90">
            "We wanted a platform that understood our cultural heritage while prioritizing security
            and serious compatibility. Vivah Australia made the process warm, safe, and premium."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold text-xs font-bold font-playfair border border-brand-gold/30">
              S
            </div>
            <div>
              <p className="text-xs font-bold text-white">Shalini & Arjun</p>
              <p className="text-[10px] text-white/60">Married in Melbourne, 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Form Card Panel */}
      <main className="flex flex-col justify-between min-h-screen bg-brand-ivory">
        <PublicHeader />

        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <section className="w-full max-w-md bg-white border border-brand-maroon/10 rounded-3xl p-8 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-10 transition-shadow hover:shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
            <h1 className="font-playfair font-bold text-2xl text-brand-charcoal">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </section>
        </div>

        <PublicFooter />
      </main>
    </div>
  );
}
