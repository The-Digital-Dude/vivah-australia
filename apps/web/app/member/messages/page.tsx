import MemberShell from '../member-shell';
import MessagesClient from './messages-client';

export const metadata = {
  title: 'Messages | Vivah Australia',
};

export default function MessagesPage() {
  return (
    <MemberShell
      title="Messages"
      subtitle="Message accepted interests safely, with read receipts, attachments, and chat safety actions."
    >
      <MessagesClient />
    </MemberShell>
  );
}
