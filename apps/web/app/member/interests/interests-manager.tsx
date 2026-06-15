'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { useMemberRequest } from '@/lib/member-api';

interface InterestProfile {
  id: string;
  firstName?: string;
  age?: number;
  city?: string;
  occupation?: string;
  verificationLevel?: string;
}

interface InterestItem {
  id: string;
  status: string;
  sender?: InterestProfile;
  receiver?: InterestProfile;
  createdAt: string;
}

export default function InterestsManager() {
  const memberRequest = useMemberRequest();
  const [box, setBox] = useState<'received' | 'sent'>('received');
  const [items, setItems] = useState<InterestItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load(nextBox = box) {
    const result = await memberRequest(`/api/me/interests?box=${nextBox}`);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setItems(((result.data as { interests?: InterestItem[] }).interests ?? []).filter(Boolean));
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, action: 'ACCEPT' | 'REJECT' | 'WITHDRAW') {
    const result = await memberRequest(`/api/interests/${id}`, {
      method: 'PATCH',
      body: { action },
    });
    setMessage(result.message);
    if (result.ok) {
      await load();
    }
  }

  function switchBox(nextBox: 'received' | 'sent') {
    setBox(nextBox);
    void load(nextBox);
  }

  return (
    <div className="grid gap-5">
      <div className="inline-flex w-fit rounded-lg border border-[#F0D6DA] bg-white p-1">
        {(['received', 'sent'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchBox(item)}
            className={`h-9 rounded-md px-4 text-sm font-semibold ${
              box === item ? 'bg-[#7A1E3A] text-white' : 'text-[#5E6470]'
            }`}
          >
            {item === 'received' ? 'Received' : 'Sent'}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
      ) : null}

      <div className="grid gap-2">
        {items.map((item) => {
          const profile = box === 'received' ? item.sender : item.receiver;
          const statusColors: Record<string, string> = {
            ACCEPTED: 'bg-[#E8F7EF] text-[#1F6F4A]',
            PENDING: 'bg-[#FFF0F3] text-[#A10E4D]',
            REJECTED: 'bg-[#FEF2F2] text-red-700',
          };
          return (
            <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#F0D6DA] bg-white px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0F3] text-sm font-bold text-[#A10E4D]">
                {(profile?.firstName ?? 'V').slice(0, 1)}
              </div>
              <Link href={profile?.id ? `/profiles/${profile.id}` : '/member/matches'} className="min-w-0 flex-1 transition hover:opacity-80">
                <span className="text-sm font-semibold text-[#232323]">
                  {profile?.firstName ?? 'Vivah member'}{profile?.age ? `, ${profile.age}` : ''}
                </span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[item.status] ?? 'bg-[#FFF0F3] text-[#A10E4D]'}`}>
                  {item.status.toLowerCase()}
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                {box === 'received' && item.status === 'PENDING' && (
                  <>
                    <button type="button" onClick={() => void update(item.id, 'ACCEPT')} className="flex h-8 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                      <Check className="size-3.5" /> Accept
                    </button>
                    <button type="button" onClick={() => void update(item.id, 'REJECT')} className="flex h-8 items-center gap-1 rounded-xl border border-red-100 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                      <X className="size-3.5" /> Reject
                    </button>
                  </>
                )}
                {box === 'sent' && item.status === 'PENDING' && (
                  <button type="button" onClick={() => void update(item.id, 'WITHDRAW')} className="flex h-8 items-center gap-1 rounded-xl border border-[#F0D6DA] px-2.5 text-xs font-semibold text-[#7A1E3A] transition hover:bg-[#FFF8F1]">
                    <RotateCcw className="size-3.5" /> Withdraw
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D6A84F] bg-white p-6 text-center text-sm text-[#5E6470]">
          No {box} interests yet.
        </div>
      )}
    </div>
  );
}

function Button({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon: React.ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#F0D6DA] px-3 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]"
    >
      {icon}
      {label}
    </button>
  );
}
