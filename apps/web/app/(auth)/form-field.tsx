interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}

export default function FormField({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
}: Readonly<FormFieldProps>) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#1A1A1A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-12 rounded-2xl border border-[#7A1F2B]/20 bg-white px-4 text-[#1A1A1A] placeholder-[#6B7280] outline-none transition focus:border-[#7A1F2B] focus:ring-4 focus:ring-[#F8E8E8] text-sm"
      />
    </label>
  );
}
