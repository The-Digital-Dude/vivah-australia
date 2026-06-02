import AdminReports from './reports-review';
import AdminShell from '../admin-shell';

export default function AdminReportsPage() {
  return (
    <AdminShell
      title="Safety Triage Queue"
      subtitle="Review member-submitted reports, assign ownership, and close resolved or dismissed safety items."
    >
      <AdminReports />
    </AdminShell>
  );
}
