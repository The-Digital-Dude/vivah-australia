import { MatchGridSkeleton, PremiumCard, PublicFooter, PublicHeader } from '@/app/components';

export default function PublicMatchesLoading() {
  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2F2F2F]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 rounded-[32px] border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.08)] sm:p-7">
          <div className="grid gap-3">
            <div className="h-3 w-28 rounded bg-[#FFF0F3] animate-pulse" />
            <div className="h-10 w-3/4 rounded bg-[#FFF0F3] animate-pulse" />
            <div className="h-4 w-full max-w-3xl rounded bg-[#FFF0F3] animate-pulse" />
          </div>
          <div className="grid gap-3 rounded-[28px] border border-[#A10E4D]/10 bg-[#FFF9F5] p-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-2">
                <div className="h-4 w-24 rounded bg-[#FFF0F3] animate-pulse" />
                <div className="h-12 rounded-2xl bg-[#FFF0F3] animate-pulse" />
              </div>
            ))}
            <div className="h-11 rounded-2xl bg-[#FFF0F3] animate-pulse sm:col-span-2" />
          </div>
        </section>

        <section className="mt-8 grid gap-6">
          <div className="grid gap-3">
            <div className="h-3 w-24 rounded bg-[#FFF0F3] animate-pulse" />
            <div className="h-8 w-96 max-w-full rounded bg-[#FFF0F3] animate-pulse" />
            <div className="h-4 w-full max-w-2xl rounded bg-[#FFF0F3] animate-pulse" />
          </div>
          <MatchGridSkeleton />
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PremiumCard key={index} className="rounded-[28px] p-6">
              <div className="h-12 w-12 rounded-2xl bg-[#FFF0F3] animate-pulse" />
              <div className="mt-4 h-6 w-40 rounded bg-[#FFF0F3] animate-pulse" />
              <div className="mt-3 h-4 w-full rounded bg-[#FFF0F3] animate-pulse" />
              <div className="mt-2 h-4 w-5/6 rounded bg-[#FFF0F3] animate-pulse" />
            </PremiumCard>
          ))}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
