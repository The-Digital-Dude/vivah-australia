interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  value?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  error?: string | undefined;
  placeholder?: string | undefined;
}

export default function FormField({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
}: Readonly<FormFieldProps>) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="grid gap-2 text-sm font-bold text-brand-charcoal">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`h-12 w-full rounded-2xl border bg-white px-4 text-brand-charcoal placeholder-gray-400 outline-none transition focus:ring-4 text-sm ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-brand-maroon/20 focus:border-brand-maroon focus:ring-brand-maroon/8'
        }`}
      />
      {error && (
        <span id={errorId} className="text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
