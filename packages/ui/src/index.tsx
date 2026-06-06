import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const uiTokens = {
  page: 'min-h-screen bg-[#FFF8F1] px-4 py-8 text-[#232323]',
  shell: 'mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]',
  panel: 'rounded-lg border border-[#7A1E3A]/10 bg-white p-6 shadow-sm',
  card: 'rounded-lg border border-[#7A1E3A]/10 bg-white p-4',
  accentCard: 'rounded-lg border border-[#7A1E3A]/10 bg-[#FFF8F1] p-4',
  buttonPrimary: 'rounded-md bg-[#7A1E3A] px-4 py-2 text-sm font-semibold text-white',
  buttonSecondary:
    'rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-semibold text-[#7A1E3A]',
  input:
    'h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-sm outline-none focus:border-[#7A1E3A]',
} as const;

export function PageHeader({
  eyebrow,
  subtitle,
  title,
}: Readonly<{ eyebrow?: string; subtitle?: string; title: string }>) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1E3A]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E6470]">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function MetricCard({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className={uiTokens.accentCard}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function EmptyState({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="rounded-md border border-dashed border-[#7A1E3A]/20 bg-white p-4 text-sm text-[#5E6470]">
      {children}
    </p>
  );
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return (
    <button
      className={cx(
        variant === 'primary' ? uiTokens.buttonPrimary : uiTokens.buttonSecondary,
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(uiTokens.input, className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(uiTokens.input, 'bg-white', className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#5E6470]">
      <input type="checkbox" className="size-4 accent-[#7A1E3A]" {...props} />
      {label}
    </label>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: Readonly<{ children: ReactNode; tone?: 'neutral' | 'success' | 'danger' }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'success' && 'bg-[#F7FBF8] text-[#1F6F4A]',
        tone === 'danger' && 'bg-[#FDECEF] text-[#7A1E3A]',
        tone === 'neutral' && 'bg-[#FFF8F1] text-[#5E6470]',
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  children,
  open,
  title,
}: Readonly<{ children: ReactNode; open: boolean; title: string }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-[#232323]">{title}</h2>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}

export function Drawer({ children, open }: Readonly<{ children: ReactNode; open: boolean }>) {
  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-4 shadow-xl">
      {children}
    </aside>
  );
}

export function Tabs({
  items,
}: Readonly<{ items: Array<{ label: string; active?: boolean; onClick?: () => void }> }>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={cx(
            'rounded-md px-3 py-2 text-sm font-semibold',
            item.active ? 'bg-[#7A1E3A] text-white' : 'border border-[#7A1E3A]/20 text-[#7A1E3A]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ className }: Readonly<{ className?: string }>) {
  return <div className={cx('animate-pulse rounded-md bg-[#FDECEF]', className ?? 'h-4 w-full')} />;
}

export function Pagination({
  onPageChange,
  page,
  totalPages,
}: Readonly<{ onPageChange: (page: number) => void; page: number; totalPages: number }>) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="secondary">
        Previous
      </Button>
      <span className="text-[#5E6470]">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="secondary"
      >
        Next
      </Button>
    </div>
  );
}

export function Avatar({ label, src }: Readonly<{ label: string; src?: string }>) {
  return (
    <div className="grid size-12 place-items-center overflow-hidden rounded-full bg-[#FDECEF] text-sm font-semibold text-[#7A1E3A]">
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        label.slice(0, 1)
      )}
    </div>
  );
}

export function DataTable({
  children,
  headers,
}: Readonly<{ children: ReactNode; headers: string[] }>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#7A1E3A]/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b text-[#5E6470]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

// Custom DatePicker component
export function DatePicker({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">
          {label}
        </span>
      )}
      <input
        type="date"
        className={cx(
          uiTokens.input,
          'bg-white text-[#232323] transition-colors focus:border-[#7A1E3A]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

// Toast Notification System
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cx(
        'flex items-center justify-between gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        toast.type === 'success' && 'bg-[#F7FBF8] border-[#1F6F4A]/20 text-[#1F6F4A]',
        toast.type === 'error' && 'bg-[#FDECEF] border-[#7A1E3A]/20 text-[#7A1E3A]',
        toast.type === 'info' && 'bg-[#FFF8F1] border-[#7A1E3A]/20 text-[#5E6470]',
      )}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-current opacity-70 hover:opacity-100 focus:outline-none text-lg leading-none"
        type="button"
      >
        &times;
      </button>
    </div>
  );
}

// ProfileCard Component
export function ProfileCard({
  avatarUrl,
  name,
  age,
  location,
  occupation,
  isVerified,
  isBoosted,
  onClick,
  actionLabel = 'View Profile',
}: {
  avatarUrl?: string;
  name: string;
  age: number;
  location: string;
  occupation: string;
  isVerified?: boolean;
  isBoosted?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className={cx(uiTokens.card, 'relative overflow-hidden flex flex-col gap-4 group hover:shadow-md transition-all border-[#7A1E3A]/10')}>
      {isBoosted && (
        <div className="absolute top-2 right-2 z-10">
          <Badge tone="danger">Featured</Badge>
        </div>
      )}
      <div className="aspect-[4/5] w-full rounded-md bg-[#FFF8F1] overflow-hidden relative border border-[#7A1E3A]/5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-[#FDECEF] text-[#7A1E3A]">
            <span className="text-3xl font-bold uppercase">{name.slice(0, 2)}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-lg text-[#232323] truncate">{name}</h3>
          {isVerified && (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#1F6F4A] text-[10px] font-bold text-white" title="Verified Member">
              ✓
            </span>
          )}
        </div>
        
        <p className="text-sm text-[#5E6470] font-medium mt-1">
          {age} Yrs • {occupation}
        </p>
        <p className="text-xs text-[#5E6470] mt-0.5">
          {location}
        </p>
      </div>

      {onClick && (
        <Button onClick={onClick} className="w-full mt-auto">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// PlanCard Component
export function PlanCard({
  name,
  price,
  period = 'month',
  features,
  isPopular,
  ctaText = 'Select Plan',
  onCtaClick,
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
}) {
  return (
    <div
      className={cx(
        uiTokens.card,
        'flex flex-col gap-6 relative p-6',
        isPopular ? 'border-2 border-[#7A1E3A] shadow-md' : 'border-[#7A1E3A]/10',
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7A1E3A] px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </div>
      )}
      
      <div className="text-center">
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6470]">{name}</h4>
        <div className="mt-4 flex items-baseline justify-center">
          <span className="text-4xl font-semibold text-[#232323]">{price}</span>
          <span className="text-sm text-[#5E6470] ml-1">/{period}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-3 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[#5E6470]">
            <span className="text-[#1F6F4A] font-bold">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onCtaClick}
        variant={isPopular ? 'primary' : 'secondary'}
        className="w-full"
      >
        {ctaText}
      </Button>
    </div>
  );
}

// FileUploader Component
export function FileUploader({
  accept,
  maxSizeMB = 5,
  onFileSelect,
  isUploading = false,
  error,
  label = 'Upload file',
}: {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  error?: string | null;
  label?: string;
}) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File is too large. Max size is ${maxSizeMB}MB.`);
        return;
      }
      onFileSelect(file);
    }
  }, [maxSizeMB, onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File is too large. Max size is ${maxSizeMB}MB.`);
        return;
      }
      onFileSelect(file);
    }
  }, [maxSizeMB, onFileSelect]);

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cx(
          'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[160px]',
          isDragActive ? 'border-[#7A1E3A] bg-[#FDECEF]' : 'border-[#7A1E3A]/20 bg-white hover:border-[#7A1E3A]/40',
        )}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
        />
        <label htmlFor="file-upload-input" className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full text-center">
          <span className="text-[#7A1E3A] text-2xl font-bold">↑</span>
          <span className="text-sm font-semibold text-[#232323]">{label}</span>
          <span className="text-xs text-[#5E6470]">
            Drag & drop here or click to browse. Max size: {maxSizeMB}MB.
          </span>
        </label>
      </div>
      {isUploading && (
        <p className="text-xs text-[#7A1E3A] animate-pulse">Uploading file...</p>
      )}
      {error && (
        <p className="text-xs text-[#7A1E3A] font-semibold">{error}</p>
      )}
    </div>
  );
}
