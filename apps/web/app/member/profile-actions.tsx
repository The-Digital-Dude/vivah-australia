'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Ban, CheckCircle2, Flag, Heart, Send, ShieldAlert, X } from 'lucide-react';
import { reportCreateSchema } from '@vivah/shared';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

export default function ProfileActions({
  profileId,
  compact = false,
  onProfileHidden,
}: Readonly<{ profileId: string; compact?: boolean; onProfileHidden?: () => void }>) {
  const memberRequest = useMemberRequest();
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(
    null,
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function action(label: string, path: string, body?: Record<string, unknown>) {
    setPending(label);
    setFeedback(null);
    const result = await memberRequest(path, {
      method: 'POST',
      ...(body ? { body } : {}),
    });
    setPending(null);
    setFeedback({ message: result.message, tone: result.ok ? 'success' : 'error' });
    return result.ok;
  }

  async function hide() {
    const ok = await action('hide', '/api/me/hidden-profiles', { profileId });
    if (ok) {
      onProfileHidden?.();
    }
  }

  async function submitReport(reason: string, severity: string) {
    const parsed = reportCreateSchema.safeParse({
      targetType: 'PROFILE',
      targetId: profileId,
      reason,
      severity,
    });

    if (!parsed.success) {
      setFeedback({ message: validationMessage(parsed.error.issues), tone: 'error' });
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
            label={pending === 'hide' ? 'Hiding' : 'Ignore'}
            icon={<X className="size-3.5" />}
            onClick={() => void hide()}
          />
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#FFF8EC] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B6714]">
              Safety options
            </p>
            <ShieldAlert className="size-4 text-[#8B6714]" />
          </div>
          <div className={compact ? 'mt-2 flex flex-wrap gap-2' : 'mt-2 grid grid-cols-2 gap-2'}>
            <ActionButton
              label="Report issue"
              icon={<Flag className="size-3.5" />}
              onClick={() => setReportOpen(true)}
              variant="safety"
            />
            <ActionButton
              label="Block member"
              icon={<Ban className="size-3.5" />}
              onClick={() => setBlockOpen(true)}
              variant="safety"
            />
          </div>
        </div>
      </div>
      {feedback ? (
        <div
          className={`fixed inset-x-4 bottom-24 z-40 mx-auto w-full max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl md:inset-x-auto md:right-6 md:bottom-6 ${
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-[#F0D6DA] bg-white text-[#7A1E3A]'
          }`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
        >
          <div className="flex items-start gap-3">
            {feedback.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      ) : null}
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
  variant = 'default',
}: Readonly<{
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'safety';
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition ${
        variant === 'safety'
          ? 'border-[#D4AF37]/35 bg-white text-[#7A1E3A] hover:bg-[#FFF4D9]'
          : 'border-[#F0D6DA] bg-white text-[#7A1E3A] hover:bg-[#FFF8F1]'
      }`}
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
