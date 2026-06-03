import MemberShell from '../member-shell';
import { MatchGridSkeleton, PremiumCard } from '@/app/components';

export default function MemberMatchesLoading() {
  return (
    <MemberShell
      title="Search matches"
      subtitle="Use structured filters and compatibility signals to find serious, approved profiles."
    >
      <div className="grid gap-6 sm:gap-8">
        <section className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-4 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <div className="h-3 w-28 rounded bg-[#F8E8E8] animate-pulse" />
              <div className="h-9 w-80 max-w-full rounded bg-[#F8E8E8] animate-pulse" />
              <div className="h-4 w-full max-w-2xl rounded bg-[#F8E8E8] animate-pulse" />
            </div>
            <div className="grid gap-4 rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-4 lg:grid-cols-[1.1fr_0.9fr_auto] lg:items-end">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid gap-2">
                  <div className="h-4 w-24 rounded bg-[#F8E8E8] animate-pulse" />
                  <div className="h-12 rounded-2xl bg-[#F8E8E8] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-11 w-32 rounded-full bg-[#F8E8E8] animate-pulse" />
          ))}
        </div>

        <PremiumCard className="rounded-[28px] border-[#7A1F2B]/10 bg-[#FCFAF7] p-5">
          <div className="h-3 w-24 rounded bg-[#F8E8E8] animate-pulse" />
          <div className="mt-3 h-8 w-72 max-w-full rounded bg-[#F8E8E8] animate-pulse" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-[#F8E8E8] animate-pulse" />
        </PremiumCard>

        <MatchGridSkeleton />
      </div>
    </MemberShell>
  );
}
