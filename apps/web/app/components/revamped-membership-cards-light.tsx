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
    color: 'from-[#FFF1F5] to-white border border-[#E74C7C]/20',
    buttonColor: 'bg-white border border-[#E74C7C]/30 text-[#A10E4D] hover:bg-[#FFF1F5]',
  },
  {
    name: 'Premium',
    icon: Sparkles,
    price: '$49',
    duration: 'per month',
    description: 'Our most popular choice for serious commitment.',
    features: ['Unlimited direct messaging', 'View all private photos', 'Priority search ranking', 'Advanced compatibility filters'],
    isPopular: true,
    color: 'from-[#E74C7C]/20 to-[#A10E4D]/10 border border-[#A10E4D]/20',
    buttonColor: 'bg-gradient-to-r from-[#A10E4D] to-[#E74C7C] hover:from-[#8E0D43] hover:to-[#A10E4D] text-white shadow-lg shadow-[#A10E4D]/25',
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
    color: 'from-[#F7D88A]/30 to-[#D4A04C]/20 border border-[#D4A04C]/30',
    buttonColor: 'bg-gradient-to-r from-[#D4A04C] to-[#C4913C] text-white hover:from-[#C4913C] hover:to-[#B3802B] shadow-lg shadow-[#D4A04C]/25',
  },
];

export function RevampedMembershipCards() {
  return (
    <section className="relative px-8 py-24 sm:px-12 lg:px-16 overflow-hidden bg-white border-b border-[#E74C7C]/10">
      <div className="mx-auto max-w-7xl relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
            Premium Matchmaking Plans
          </p>
          <h2 className="mt-4 font-playfair text-4xl font-bold leading-tight text-[#1A1A1A] sm:text-5xl">
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
                className={`relative h-full rounded-sm border p-8 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.04)] flex flex-col ${plan.isPopular ? 'lg:-mt-8 lg:mb-8 border-[#A10E4D]/20 shadow-[0_50px_120px_rgba(161,14,77,0.08)] bg-[#FFF9F5]' : 'border-[#E74C7C]/15'}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#E74C7C] to-[#A10E4D] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className={`mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color} shadow-inner`}>
                  <Icon className={`size-6 ${plan.isPopular ? 'text-[#A10E4D]' : 'text-zinc-700'}`} />
                </div>
                
                <h3 className="text-3xl font-playfair font-bold text-[#1A1A1A]">{plan.name}</h3>
                <p className="mt-2 text-sm text-[#5f5f5f] min-h-[40px]">{plan.description}</p>
                
                <div className="my-8 flex items-baseline gap-2">
                  <span className="font-playfair text-5xl font-bold text-[#2f2f2f]">{plan.price}</span>
                  <span className="text-sm font-medium text-[#5f5f5f]">/{plan.duration}</span>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#A10E4D]/10">
                        <Check className="size-3 text-[#A10E4D]" />
                      </div>
                      <span className="text-[15px] text-[#2f2f2f] font-medium leading-tight">{feature}</span>
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
