import AdminMediaReview from './admin-media-review';
import AdminShell from '../admin-shell';

export default function AdminMediaPage() {
  return (
    <AdminShell
      title="Media Approval Queue"
      subtitle="Review uploaded profile photos, public gallery media, and private gallery media before member-facing display."
    >
      <AdminMediaReview />
    </AdminShell>
  );
}
