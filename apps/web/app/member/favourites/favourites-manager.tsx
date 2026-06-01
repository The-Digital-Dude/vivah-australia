'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProfileMatchCard } from '@/app/components';
import { useMemberRequest } from '@/lib/member-api';
import ProfileActions from '../profile-actions';

interface FavouriteItem {
  id: string;
  profile: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
    occupation?: string;
    verificationLevel?: string;
  };
}

export default function FavouritesManager() {
  const memberRequest = useMemberRequest();
  const [items, setItems] = useState<FavouriteItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const result = await memberRequest('/api/me/favourites');
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setItems((result.data as { favourites?: FavouriteItem[] }).favourites ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(profileId: string) {
    const result = await memberRequest(`/api/me/favourites/${profileId}`, { method: 'DELETE' });
    setMessage(result.message);
    if (result.ok) {
      await load();
    }
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <p className="rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}
      {items.map((item) => (
        <ProfileMatchCard
          key={item.id}
          profile={{
            age: item.profile.age ?? 'age hidden',
            city: item.profile.city,
            id: item.profile.id,
            name: item.profile.firstName ?? 'Vivah member',
            occupation: item.profile.occupation,
            verificationLevel: item.profile.verificationLevel,
          }}
          actions={
            <div className="grid gap-2">
              <ProfileActions profileId={item.profile.id} compact />
              <button
                type="button"
                onClick={() => void remove(item.profile.id)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#F0D6DA] px-3 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]"
              >
                <Trash2 className="size-3.5" />
                Remove favourite
              </button>
            </div>
          }
        />
      ))}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#D6A84F] bg-white p-6 text-center text-sm text-[#5E6470]">
          Saved profiles will appear here.
        </div>
      ) : null}
    </div>
  );
}
