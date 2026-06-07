import { Heart, Map, ShieldCheck, Users } from 'lucide-react';

const communityStats = [
  { value: '15,000+', label: 'Verified Profiles', icon: Users },
  { value: '5,000+', label: 'Successful Matches', icon: Heart },
  { value: '50,000+', label: 'Members', icon: Users },
  { value: '100%', label: 'Privacy Protected', icon: ShieldCheck },
  { value: 'Australia Wide', label: 'Indian Community', icon: Map },
] as const;

export function CommunityStatsStrip() {
  return (
    <section className="relative z-20 -mt-8 px-8 sm:px-12 lg:px-16">
      <div className="container mx-auto">
        <div className="grid overflow-hidden rounded-2xl bg-[#a10e4d] shadow-[0_18px_42px_rgba(161,14,77,0.24)] ring-1 ring-white/35 sm:grid-cols-2 lg:grid-cols-5">
          {communityStats.map(({ value, label, icon: Icon }) => (
            <div
              key={`${value}-${label}`}
              className="relative flex min-h-[92px] items-center gap-4 px-5 py-5 text-white after:absolute after:inset-y-5 after:right-0 after:hidden after:w-px after:bg-white/20 last:after:hidden lg:px-6 lg:after:block"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#d4a04c]/70 text-[#d4a04c]">
                <Icon className="size-7" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight tracking-normal sm:text-2xl">
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-white/90 sm:text-xs">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
