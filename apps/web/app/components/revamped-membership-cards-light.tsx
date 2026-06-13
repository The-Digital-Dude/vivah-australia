'use client';

import { Check, Sparkles, Crown, Gem } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Basic',
    icon: Gem,
    price: 'Free',
    duration: 'forever',
    description: 'Perfect for exploring the community.',
    features: ['Create a verified profile', 'Browse basic matches', 'Receive interests'],
    isPopular: false,
    color: 'from-white to-[#FDFBF7] border border-[#D9A05B]/20',
    buttonColor: 'bg-white border border-[#D9A05B]/40 text-[#C48C45] hover:bg-[#FCF8F2] shadow-sm',
  },
  {
    name: 'Premium',
    icon: Sparkles,
    price: '$49',
    duration: 'per month',
    description: 'Our most popular choice for serious commitment.',
    features: ['Unlimited direct messaging', 'View all private photos', 'Priority search ranking', 'Advanced compatibility filters'],
    isPopular: true,
    color: 'from-[#F7D88A]/20 to-[#D4A04C]/10 border border-[#D9A05B]/30',
    buttonColor: 'bg-gradient-to-r from-[#D9A05B] to-[#C48C45] hover:from-[#C48C45] hover:to-[#AF7830] text-white shadow-lg shadow-[#D9A05B]/30',
    borderColor: 'border-[#A10E4D]/30',
  },
  {
    name: 'Platinum',
    icon: Crown,
    price: '$99',
    duration: 'per month',
    description: 'The ultimate VIP concierge experience.',
    features: ['Dedicated personal matchmaker', 'Hand-picked VIP introductions', 'Premium background verification badge', '24/7 priority support'],
    isPopular: false,
    color: 'from-white to-[#FDFBF7] border border-[#D9A05B]/30',
    buttonColor: 'bg-gradient-to-r from-[#2A111A] to-[#4A0E25] text-white hover:from-[#1A0A10] hover:to-[#2A111A] shadow-lg',
  },
];

export function RevampedMembershipCards() {
  return (
    <section className="relative px-8 py-24 sm:px-12 lg:px-16 overflow-hidden bg-transparent border-b border-[#D9A05B]/20">
      <div className="mx-auto max-w-7xl relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4A04C]">
            Premium Matchmaking Plans
          </p>
          <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight text-[#2A111A] sm:text-5xl">
            Invest in a Lifetime of Happiness.
          </h2>
          <p className="mt-6 text-lg text-[#5f5f5f]">
            Join thousands of serious Indian singles. Upgrade your membership to unlock direct messaging, enhanced visibility, and dedicated matchmaking support.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative h-full rounded-2xl border p-8 bg-gradient-to-br from-white to-[#FDFBF7] shadow-[0_40px_100px_rgba(217,160,91,0.1)] flex flex-col ${plan.isPopular ? 'lg:-mt-8 lg:mb-8 border-[#D9A05B]/40 shadow-[0_50px_120px_rgba(217,160,91,0.2)]' : 'border-[#D9A05B]/20'}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D9A05B] to-[#C48C45] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className={`mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color} shadow-inner`}>
                  <Icon className={`size-6 ${plan.isPopular ? 'text-[#A10E4D]' : 'text-zinc-700'}`} />
                </div>
                
                <h3 className="text-3xl font-playfair font-bold text-[#2A111A]">{plan.name}</h3>
                <p className="mt-2 text-sm text-[#4A0E25]/80 min-h-[40px]">{plan.description}</p>
                
                <div className="my-8 flex items-baseline gap-2">
                  <span className="font-playfair text-5xl font-bold text-[#2A111A]">{plan.price}</span>
                  <span className="text-sm font-medium text-[#4A0E25]/80">/{plan.duration}</span>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#D9A05B]/10">
                        <Check className="size-3 text-[#D9A05B]" />
                      </div>
                      <span className="text-[15px] text-[#2A111A] font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full rounded-xl py-4 font-bold transition-all duration-200 shadow-md ${plan.buttonColor}`}>
                  Choose {plan.name}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
