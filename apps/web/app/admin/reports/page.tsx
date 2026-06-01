import AdminReports from './reports-review';
import AdminGuard from '../admin-guard';

export const metadata = {
  title: 'Reports | Vivah Australia Admin',
};

export default function AdminReportsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#FFF8F1] px-6 py-10 text-[#232323]">
        <div className="mx-auto grid max-w-6xl gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
              Admin CRM
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Reports queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5E6470]">
              Review member-submitted reports, assign ownership, and close resolved or dismissed
              safety items.
            </p>
          </div>
          <AdminReports />
        </div>
      </main>
    </AdminGuard>
  );
}
