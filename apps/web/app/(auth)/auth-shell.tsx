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
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F] grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left Emotional Brand Panel (Desktop-only) */}
      <section className="hidden lg:flex flex-col justify-between p-16 text-white relative overflow-hidden bg-gradient-to-br from-[#A10E4D] via-[#890B40] to-[#4A0A14] border-r border-[#A10E4D]/10">
        {/* Background decorative glowing element */}
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-[#D4A04C]/5 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-[#A10E4D]/20 blur-[120px] pointer-events-none" />

        {/* Top Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="font-serif font-extrabold text-2xl tracking-wide text-white">
            VIVAH <span className="text-[#D4A04C]">AUSTRALIA</span>
          </span>
        </div>

        {/* Center Marketing & Matrimonial Taglines */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="w-16 h-1.5 bg-[#D4A04C] rounded-full mb-8 shadow-sm" />
          <h2 className="font-serif font-bold text-4xl leading-tight mb-6">
            Australia's Premium Matrimonial Platform for the South Asian Community
          </h2>
          <p className="text-base text-white/80 leading-relaxed mb-10">
            Fostering trust-first, verified connections that lead to meaningful matrimonial unions.
            Begin your journey with peace of mind.
          </p>

          <ul className="grid gap-4 mt-8">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-[#D4A04C]/10 flex items-center justify-center text-[#D4A04C] shrink-0 border border-[#D4A04C]/20">
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
            <div className="size-8 rounded-full bg-[#D4A04C]/20 flex items-center justify-center text-[#D4A04C] text-xs font-bold font-serif border border-[#D4A04C]/30">
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
      <main className="flex flex-col justify-between min-h-screen bg-[#FFF9F5]">
        <PublicHeader />

        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <section className="w-full max-w-md bg-white border border-[#A10E4D]/10 rounded-3xl p-8 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-10 transition-shadow hover:shadow-[0_18px_50px_rgba(122,31,43,0.08)]">
            <h1 className="font-serif font-bold text-2xl text-[#2F2F2F]">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </section>
        </div>

        <PublicFooter />
      </main>
    </div>
  );
}
