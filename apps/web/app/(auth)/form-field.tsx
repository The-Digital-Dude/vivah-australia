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
    <label className="grid gap-2 text-sm font-bold text-brand-charcoal">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-12 rounded-2xl border border-brand-maroon/20 bg-white px-4 text-brand-charcoal placeholder-gray-400 outline-none transition focus:border-brand-maroon focus:ring-4 focus:ring-brand-maroon/8 text-sm"
      />
    </label>
  );
}
