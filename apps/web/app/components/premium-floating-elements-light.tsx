'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';

export function PremiumFloatingElements({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-[#FCF8F2]">
      {/* Background Ambient Gold/Rose Gold Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Layer 1 - Massive, ultra-soft glows */}
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15], x: [0, 80, 0], y: [0, -40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-[10%] top-[5%] h-[700px] w-[700px] rounded-full bg-[#E8C39E] blur-[140px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], x: [0, -100, 0], y: [0, 80, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-[15%] top-[25%] h-[800px] w-[800px] rounded-full bg-[#E7A5A5] blur-[150px]" />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0], y: [0, -100, 0] }} transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-[#E8C39E] blur-[130px]" />
        
        {/* Layer 2 - Extra warmth */}
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08], x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }} className="absolute right-[20%] top-[5%] h-[650px] w-[650px] rounded-full bg-[#D9A05B] blur-[140px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12], x: [0, 90, 0], y: [0, -70, 0] }} transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[30%] top-[50%] h-[750px] w-[750px] rounded-full bg-[#E7A5A5] blur-[160px]" />
      </div>

      {/* Floating UI Elements (Aggressive Parallax) */}
      
      {/* Viewport-fixed floating icons so they are always dense on screen */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block">
        {/* Love & Star Floating Icons scattered across the page */}
        {[
          { type: 'heart', x: '5%', y: '8%', delay: 0, dur: 7, size: 6, color: '#E74C7C' },
          { type: 'star', x: '12%', y: '20%', delay: 1, dur: 9, size: 5, color: '#D4A04C' },
          { type: 'heart', x: '8%', y: '35%', delay: 2, dur: 8, size: 7, color: '#A10E4D' },
          { type: 'star', x: '3%', y: '50%', delay: 0.5, dur: 10, size: 4, color: '#F7D88A' },
          { type: 'heart', x: '15%', y: '65%', delay: 1.5, dur: 7.5, size: 8, color: '#E74C7C' },
          { type: 'star', x: '10%', y: '80%', delay: 2.5, dur: 11, size: 6, color: '#D4A04C' },
          { type: 'heart', x: '6%', y: '95%', delay: 0.2, dur: 8.5, size: 5, color: '#A10E4D' },
          
          { type: 'star', x: '25%', y: '5%', delay: 1.2, dur: 9.5, size: 5, color: '#F7D88A' },
          { type: 'heart', x: '22%', y: '45%', delay: 0.8, dur: 6.5, size: 6, color: '#E74C7C' },
          { type: 'star', x: '28%', y: '75%', delay: 2.2, dur: 10.5, size: 7, color: '#D4A04C' },
          
          { type: 'heart', x: '45%', y: '15%', delay: 1.8, dur: 8.2, size: 5, color: '#A10E4D' },
          { type: 'star', x: '40%', y: '85%', delay: 0.4, dur: 9.8, size: 4, color: '#F7D88A' },
          
          { type: 'star', x: '65%', y: '8%', delay: 2.8, dur: 7.8, size: 6, color: '#D4A04C' },
          { type: 'heart', x: '60%', y: '40%', delay: 1.1, dur: 8.8, size: 7, color: '#E74C7C' },
          { type: 'star', x: '68%', y: '90%', delay: 0.6, dur: 11.2, size: 5, color: '#F7D88A' },
          
          { type: 'heart', x: '82%', y: '12%', delay: 1.6, dur: 9.2, size: 8, color: '#A10E4D' },
          { type: 'star', x: '85%', y: '30%', delay: 2.6, dur: 8.4, size: 4, color: '#D4A04C' },
          { type: 'heart', x: '78%', y: '55%', delay: 0.9, dur: 7.6, size: 6, color: '#E74C7C' },
          { type: 'star', x: '88%', y: '70%', delay: 1.9, dur: 10.4, size: 7, color: '#F7D88A' },
          { type: 'heart', x: '80%', y: '98%', delay: 2.1, dur: 8.9, size: 5, color: '#A10E4D' },
          
          { type: 'star', x: '95%', y: '5%', delay: 0.3, dur: 11.5, size: 5, color: '#D4A04C' },
          { type: 'heart', x: '92%', y: '25%', delay: 1.4, dur: 7.2, size: 6, color: '#E74C7C' },
          { type: 'star', x: '97%', y: '45%', delay: 2.4, dur: 9.6, size: 4, color: '#F7D88A' },
          { type: 'heart', x: '90%', y: '60%', delay: 0.7, dur: 8.1, size: 7, color: '#A10E4D' },
          { type: 'star', x: '96%', y: '85%', delay: 1.7, dur: 10.8, size: 6, color: '#D4A04C' },
        ].map((item, i) => {
          const Icon = item.type === 'heart' ? Heart : Star;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: item.x, top: item.y }}
              animate={{
                y: [0, i % 2 === 0 ? -40 : 40, 0],
                opacity: [0.2, 0.6, 0.2],
                rotate: i % 3 === 0 ? [0, 20, 0] : i % 2 === 0 ? [0, -15, 0] : 0,
              }}
              transition={{
                duration: item.dur,
                delay: item.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Icon
                className="opacity-70"
                style={{
                  width: `${item.size * 4}px`,
                  height: `${item.size * 4}px`,
                  color: item.color,
                  fill: item.color,
                  fillOpacity: 0.4,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Parallax UI Cards (Absolute to page) */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block">

        {/* UI Cards - Kept only Matched, Premium Design, and New Connection */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -350]) }} className="absolute left-[2%] top-[15%]">
          <FloatingCard icon={Heart} text="Matched!" color="text-[#E74C7C]" />
        </motion.div>

        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -250]) }} className="absolute left-[3%] top-[45%]">
          <FloatingCard icon={Sparkles} text="Premium Design" color="text-[#A10E4D]" />
        </motion.div>

        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -550]) }} className="absolute right-[1%] top-[60%]">
          <FloatingCard icon={Heart} text="New Connection" color="text-[#E74C7C]" />
        </motion.div>

      </div>

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

function FloatingCard({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#D9A05B]/30 bg-gradient-to-br from-white to-[#FDFBF7] px-5 py-3 shadow-[0_16px_40px_rgba(217,160,91,0.15)] transition hover:scale-105">
      <div className={`flex size-8 items-center justify-center rounded-full bg-white shadow-sm border border-[#D9A05B]/20 ${color}`}>
        <Icon className="size-4" />
      </div>
      <span className="font-semibold text-[#2A111A]">{text}</span>
    </div>
  );
}
