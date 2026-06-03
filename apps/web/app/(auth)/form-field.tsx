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
    <label className="grid gap-2 text-sm font-bold text-[#2F2F2F]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-12 rounded-2xl border border-[#A10E4D]/20 bg-white px-4 text-[#2F2F2F] placeholder-[#6B7280] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3] text-sm"
      />
    </label>
  );
}
