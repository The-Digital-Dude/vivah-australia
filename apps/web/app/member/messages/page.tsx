import MemberShell from '../member-shell';
import MessagesClient from './messages-client';

export const metadata = {
  title: 'Messages | Vivah Australia',
};

export default function MessagesPage() {
  return (
    <MemberShell
      title="Messages"
      subtitle="Continue serious conversations in a safer, more relationship-focused messaging space."
    >
      <MessagesClient />
    </MemberShell>
  );
}
