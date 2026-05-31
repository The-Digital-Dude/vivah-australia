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
    <label className="grid gap-2 text-sm font-medium text-neutral-800">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-950 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}
