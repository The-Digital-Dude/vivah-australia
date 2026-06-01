'use client';

import { useEffect, useState } from 'react';
import { ProfileMatchCard } from '@/app/components';
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
          <ProfileMatchCard
            key={`${item.profile._id}-${item.viewedAt}`}
            compact
            profile={{
              age: item.profile.personal?.age,
              city: [item.profile.location?.city, item.profile.location?.state]
                .filter(Boolean)
                .join(', '),
              id: item.profile._id,
              name: item.profile.personal?.firstName ?? item.profile.displayId,
              religion: item.profile.religion?.religion,
              verificationLevel: item.profile.verification?.level ?? 'Verified',
            }}
            actions={
              <p className="text-xs text-[#6B7280]">
                Viewed {new Date(item.viewedAt).toLocaleString()}
              </p>
            }
          />
        ))}
      </div>
      {!items.length ? (
        <p className="text-sm text-neutral-600">No recently viewed profiles yet.</p>
      ) : null}
    </MemberShell>
  );
}
