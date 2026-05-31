import MemberShell from '../member-shell';
import SafetyManager from './safety-manager';

export const metadata = {
  title: 'Safety | Vivah Australia',
};

export default function SafetyPage() {
  return (
    <MemberShell
      title="Safety"
      subtitle="Review blocked members and submit reports for suspicious or unsafe behaviour."
    >
      <SafetyManager />
    </MemberShell>
  );
}
