'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';

interface RecentlyViewedItem {
  viewedAt: string;
  profile: {
    _id: string;
    displayId: string;
    personal?: { firstName?: string; age?: number };
    location?: { city?: string; state?: string };
    religion?: { religion?: string };
    verification?: { level?: string };
  };
}

export default function RecentlyViewedPage() {
  const memberRequest = useMemberRequest();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void memberRequest('/api/me/recently-viewed').then((result) => {
      if (result.ok) setItems((result.data as { items?: RecentlyViewedItem[] }).items ?? []);
      else setMessage(result.message);
    });
  }, [memberRequest]);

  return (
    <MemberShell
      title="Recently viewed"
      subtitle="Return to profiles you have opened recently. Private and blocked profiles are still filtered by visibility rules."
    >
      {message ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={`${item.profile._id}-${item.viewedAt}`}
            href={`/profiles/${item.profile._id}`}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-red-200 hover:bg-red-50/30"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
              {item.profile.verification?.level ?? 'Verified'} · {item.profile.displayId}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {item.profile.personal?.firstName ?? 'Member'}
              {item.profile.personal?.age ? `, ${item.profile.personal.age}` : ''}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {[item.profile.location?.city, item.profile.location?.state]
                .filter(Boolean)
                .join(', ')}
              {item.profile.religion?.religion ? ` · ${item.profile.religion.religion}` : ''}
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              Viewed {new Date(item.viewedAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
      {!items.length ? (
        <p className="text-sm text-neutral-600">No recently viewed profiles yet.</p>
      ) : null}
    </MemberShell>
  );
}
