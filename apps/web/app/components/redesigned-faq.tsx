'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqItems = [
  {
    question: 'How do I know the profiles are genuine?',
    answer: "Trust is our foundation. Every member undergoes strict verification, including ID, selfie, and mobile checks. Look for the '100% Verified' badge on profiles for complete peace of mind.",
  },
  {
    question: 'Is my data and privacy protected?',
    answer: 'Absolutely. You have full control over who sees your photos and contact details. We use bank-level encryption and never share your data with third parties.',
  },
  {
    question: 'Can my parents manage my account?',
    answer: "Yes! We offer a dedicated 'Family Managed' mode that allows parents or siblings to create and manage a profile on behalf of the bride or groom.",
  },
  {
    question: 'What makes Vivah Australia different from other apps?',
    answer: 'Unlike casual dating apps, we cater exclusively to Indians in Australia seeking serious, marriage-minded relationships. Our platform honors traditional values while embracing modern compatibility.',
  },
  {
    question: 'Can I use the platform for free?',
    answer: 'Yes, you can create a profile, upload photos, and browse potential matches for free. To initiate direct conversations and unlock advanced features, we recommend our Premium plans.',
  },
];

export function RedesignedFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative px-8 py-24 sm:px-12 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
          
          {/* Sticky Left Column */}
          <div className="lg:sticky lg:top-32">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
              Support & Information
            </p>
            <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight text-[#2f2f2f] sm:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5f5f5f]">
              Everything you need to know about privacy, safety, and how our premium matchmaking experience works.
            </p>
            
            <div className="mt-10 rounded-2xl bg-[#A10E4D]/5 p-6 border border-[#A10E4D]/10">
              <h3 className="font-semibold text-[#2f2f2f]">Still have questions?</h3>
              <p className="mt-2 text-sm text-[#5f5f5f]">Our concierge team is here to help you navigate your journey.</p>
              <a href="/contact" className="mt-4 inline-flex items-center text-sm font-bold text-[#A10E4D] hover:underline">
                Contact Support &rarr;
              </a>
            </div>
          </div>

          {/* Right Column Accordions */}
          <div className="flex flex-col gap-4">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'border-[#A10E4D]/20 bg-white/80 shadow-[0_8px_30px_rgba(161,14,77,0.06)] backdrop-blur-md' : 'border-[#2f2f2f]/10 bg-white/40 hover:border-[#A10E4D]/30'}`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className={`font-semibold transition-colors duration-200 ${isOpen ? 'text-[#A10E4D]' : 'text-[#2f2f2f]'}`}>
                      {item.question}
                    </span>
                    <span className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[#A10E4D] text-white' : 'bg-[#A10E4D]/10 text-[#A10E4D]'}`}>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-base leading-relaxed text-[#5f5f5f]">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
