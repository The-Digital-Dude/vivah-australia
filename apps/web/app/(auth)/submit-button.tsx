'use client';

export default function SubmitButton({
  label,
  pendingLabel,
  pending,
}: Readonly<{ label: string; pendingLabel: string; pending: boolean }>) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
