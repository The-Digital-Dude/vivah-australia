'use client';

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

      <div className="grid gap-3">
        {items.map((item) => {
          const profile = box === 'received' ? item.sender : item.receiver;
          return (
            <article
              key={item.id}
              className="grid gap-4 rounded-lg border border-[#F0D6DA] bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#232323]">
                    {profile?.firstName ?? 'Vivah member'}, {profile?.age ?? 'age hidden'}
                  </h3>
                  <span className="rounded-full bg-[#FDECEF] px-2.5 py-1 text-xs font-bold text-[#7A1E3A]">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5E6470]">
                  {[profile?.city, profile?.occupation, profile?.verificationLevel]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {box === 'received' && item.status === 'PENDING' ? (
                  <>
                    <Button
                      label="Accept"
                      icon={<Check className="size-4" />}
                      onClick={() => void update(item.id, 'ACCEPT')}
                    />
                    <Button
                      label="Reject"
                      icon={<X className="size-4" />}
                      onClick={() => void update(item.id, 'REJECT')}
                    />
                  </>
                ) : null}
                {box === 'sent' && item.status === 'PENDING' ? (
                  <Button
                    label="Withdraw"
                    icon={<RotateCcw className="size-4" />}
                    onClick={() => void update(item.id, 'WITHDRAW')}
                  />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#D6A84F] bg-white p-6 text-center text-sm text-[#5E6470]">
          No {box} interests yet.
        </div>
      ) : null}
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
