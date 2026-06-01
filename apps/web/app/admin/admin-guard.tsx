'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../auth-context';

const adminRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']);

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { initialized, token, userRole } = useAuth();
  const authorized = Boolean(token && userRole && adminRoles.has(userRole));

  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    if (userRole && !adminRoles.has(userRole)) {
      router.replace('/login');
    }
  }, [initialized, router, token, userRole]);

  if (!initialized || !authorized) {
    return (
      <main className="min-h-screen bg-[#FFF8F1] px-6 py-10 text-[#232323]">
        <p className="mx-auto max-w-6xl text-sm font-semibold text-[#7A1E3A]">
          Admin access required.
        </p>
      </main>
    );
  }

  return children;
}
