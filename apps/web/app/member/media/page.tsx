import MemberShell from '../member-shell';
import MediaManager from './media-manager';

export default function MemberMediaPage() {
  return (
    <MemberShell
      title="Media gallery"
      subtitle="Upload profile photos, manage public and private galleries, and track approval status."
    >
      <MediaManager />
    </MemberShell>
  );
}
