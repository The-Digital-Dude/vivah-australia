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
      className="h-12 rounded-2xl bg-[#7A1F2B] px-6 text-sm font-bold text-white transition hover:bg-[#651925] disabled:cursor-not-allowed disabled:bg-neutral-300 w-full flex items-center justify-center shadow-sm"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
