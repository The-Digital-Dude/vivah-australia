'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Ban, Flag, Heart, Send } from 'lucide-react';
import { reportCreateSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

export default function ProfileActions({
  profileId,
  compact = false,
}: Readonly<{ profileId: string; compact?: boolean }>) {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function action(label: string, path: string, body?: Record<string, unknown>) {
    setPending(label);
    setMessage(null);
    const result = await memberRequest(path, {
      method: 'POST',
      ...(body ? { body } : {}),
    });
    setPending(null);
    setMessage(result.message);
    return result.ok;
  }

  async function submitReport(reason: string, severity: string) {
    const parsed = reportCreateSchema.safeParse({
      targetType: 'PROFILE',
      targetId: profileId,
      reason,
      severity,
    });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const ok = await action('report', '/api/reports', parsed.data);
    if (ok) {
      setReportOpen(false);
    }
  }

  async function block() {
    const ok = await action('block', '/api/me/blocks', { profileId });
    if (ok) {
      setBlockOpen(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-2'}>
        <ActionButton
          label={pending === 'interest' ? 'Sending' : 'Interest'}
          icon={<Send className="size-3.5" />}
          onClick={() => void action('interest', '/api/interests', { profileId })}
        />
        <ActionButton
          label={pending === 'favourite' ? 'Saving' : 'Save'}
          icon={<Heart className="size-3.5" />}
          onClick={() => void action('favourite', '/api/me/favourites', { profileId })}
        />
        <ActionButton
          label="Report"
          icon={<Flag className="size-3.5" />}
          onClick={() => setReportOpen(true)}
        />
        <ActionButton
          label="Block"
          icon={<Ban className="size-3.5" />}
          onClick={() => setBlockOpen(true)}
        />
      </div>
      {message ? <p className="text-xs font-medium text-[#7A1E3A]">{message}</p> : null}
      {reportOpen ? (
        <ReportModal
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, severity) => void submitReport(reason, severity)}
        />
      ) : null}
      {blockOpen ? (
        <ConfirmModal
          title="Block this member?"
          body="They will disappear from search and recommendations, and pending interests between you will be withdrawn."
          confirmLabel={pending === 'block' ? 'Blocking' : 'Block member'}
          onClose={() => setBlockOpen(false)}
          onConfirm={() => void block()}
        />
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon: ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#F0D6DA] bg-white px-3 text-xs font-semibold text-[#7A1E3A] transition hover:bg-[#FFF8F1]"
    >
      {icon}
      {label}
    </button>
  );
}

function ReportModal({
  onClose,
  onSubmit,
}: Readonly<{ onClose: () => void; onSubmit: (reason: string, severity: string) => void }>) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('LOW');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#232323]/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-[#232323]">Report profile</h3>
        <label className="mt-4 grid gap-2 text-sm font-medium text-[#232323]">
          Reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            className="rounded-md border border-[#E8D5D8] px-3 py-2 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
          />
        </label>
        <label className="mt-3 grid gap-2 text-sm font-medium text-[#232323]">
          Severity
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-10 rounded-md border border-[#E8D5D8] px-3 outline-none focus:border-[#7A1E3A] focus:ring-2 focus:ring-[#FDECEF]"
          >
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-[#E8D5D8] px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(reason, severity)}
            className="h-10 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: Readonly<{
  title: string;
  body: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#232323]/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-[#232323]">{title}</h3>
        <p className="mt-2 text-sm text-[#5E6470]">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-[#E8D5D8] px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-md bg-[#7A1E3A] px-4 text-sm font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
