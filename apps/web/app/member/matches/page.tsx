import MemberShell from '../member-shell';
import MatchDiscovery from './match-discovery';

export const metadata = {
  title: 'Matches | Vivah Australia',
};

export default function MatchesPage() {
  return (
    <MemberShell
      title="Search matches"
      subtitle="Use structured filters and compatibility signals to find serious, approved profiles."
    >
      <MatchDiscovery />
    </MemberShell>
  );
}
