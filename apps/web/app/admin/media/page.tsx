import AdminMediaReview from './admin-media-review';
import AdminGuard from '../admin-guard';

export default function AdminMediaPage() {
  return (
    <AdminGuard>
      <AdminMediaReview />
    </AdminGuard>
  );
}
