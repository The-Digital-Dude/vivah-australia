'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, Unlock } from 'lucide-react';
import { reportCreateSchema } from '@vivah/shared';
import { optionalString, useMemberRequest, validationMessage } from '@/lib/member-api';

interface BlockItem {
  id: string;
  profile: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
  };
}

export default function SafetyManager() {
  const memberRequest = useMemberRequest();
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function loadBlocks() {
    const result = await memberRequest('/api/me/blocks');
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setBlocks((result.data as { blocks?: BlockItem[] }).blocks ?? []);
  }

  useEffect(() => {
    void loadBlocks();
  }, []);

  async function unblock(profileId: string) {
    const result = await memberRequest(`/api/me/blocks/${profileId}`, { method: 'DELETE' });
    setMessage(result.message);
    if (result.ok) {
      await loadBlocks();
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = reportCreateSchema.safeParse({
      targetType: 'PROFILE',
      targetId: optionalString(form.get('profileId')),
      reason: optionalString(form.get('reason')),
      severity: optionalString(form.get('severity')) ?? 'LOW',
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest('/api/reports', { method: 'POST', body: parsed.data });
    setMessage(result.message);
    if (result.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-lg border border-[#F0D6DA] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#1F9D68]" />
          <h2 className="text-xl font-semibold text-[#232323]">Submit report</h2>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={(event) => void submitReport(event)}>
          <Field label="Profile ID" name="profileId" placeholder="Paste the profile id" />
          <label className="grid gap-2 text-sm font-medium text-[#232323]">
            Severity
            <select
              name="severity"
              className="h-10 rounded-md border border-[#E8D5D8] px-3 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
            >
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#232323]">
            Reason
            <textarea
              name="reason"
              rows={5}
              className="rounded-md border border-[#E8D5D8] px-3 py-2 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
            />
          </label>
          <button className="h-11 rounded-md bg-[#7A1E3A] px-5 text-sm font-semibold text-white">
            Submit report
          </button>
        </form>
        {message ? (
          <p className="mt-4 rounded-md bg-[#FFF8F1] p-3 text-sm text-[#7A1E3A]">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[#F0D6DA] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[#232323]">Blocked members</h2>
        <div className="mt-5 grid gap-3">
          {blocks.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#F0D6DA] p-3"
            >
              <div>
                <p className="font-semibold text-[#232323]">
                  {item.profile.firstName ?? 'Vivah member'}, {item.profile.age ?? 'age hidden'}
                </p>
                <p className="text-sm text-[#5E6470]">{item.profile.city}</p>
              </div>
              <button
                type="button"
                onClick={() => void unblock(item.profile.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#F0D6DA] px-3 text-xs font-semibold text-[#7A1E3A] hover:bg-[#FFF8F1]"
              >
                <Unlock className="size-3.5" />
                Unblock
              </button>
            </article>
          ))}
          {blocks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#D6A84F] p-6 text-center text-sm text-[#5E6470]">
              No blocked members.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
}: Readonly<{ label: string; name: string; placeholder?: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#232323]">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        className="h-10 rounded-md border border-[#E8D5D8] px-3 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
      />
    </label>
  );
}
