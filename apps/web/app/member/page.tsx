import Link from 'next/link';
import MemberShell from './member-shell';

export const metadata = {
  title: 'Member Dashboard | Vivah Australia',
};

export default function MemberDashboardPage() {
  const dashboardLinks = [
    ['Complete your profile', '/member/onboarding'],
    ['Search matches', '/member/matches'],
    ['View messages', '/member/messages'],
    ['Check notifications', '/member/notifications'],
  ] as const;

  return (
    <MemberShell
      title="Dashboard"
      subtitle="Start from your profile, matches, messages, and account updates."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {dashboardLinks.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-3xl border border-[#7A1F2B]/10 bg-[#FCFAF7] p-5 text-sm font-semibold text-[#7A1F2B] transition hover:bg-[#F8E8E8]"
          >
            {label}
          </Link>
        ))}
      </div>
    </MemberShell>
  );
}
