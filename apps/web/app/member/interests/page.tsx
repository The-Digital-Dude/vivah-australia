import MemberShell from '../member-shell';
import InterestsManager from './interests-manager';

export const metadata = {
  title: 'Interests | Vivah Australia',
};

export default function InterestsPage() {
  return (
    <MemberShell
      title="Interests"
      subtitle="Review received interests, respond safely, and manage the interests you have sent."
    >
      <InterestsManager />
    </MemberShell>
  );
}
