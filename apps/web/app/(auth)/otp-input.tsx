'use client';

import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OtpInputProps {
  disabled?: boolean;
  name?: string;
  onChange: (value: string) => void;
  value: string;
}

const OTP_LENGTH = 6;

export default function OtpInput({
  disabled = false,
  name = 'code',
  onChange,
  value,
}: Readonly<OtpInputProps>) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(
    () =>
      Array.from({ length: OTP_LENGTH }, (_, index) => {
        const digit = value[index];
        return typeof digit === 'string' ? digit : '';
      }),
    [value],
  );

  function focusIndex(index: number) {
    inputRefs.current[index]?.focus();
  }

  function updateDigit(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    onChange(nextDigits.join(''));

    if (digit && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      onChange(nextDigits.join(''));
      focusIndex(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pastedValue) return;
    onChange(pastedValue);
    focusIndex(Math.min(pastedValue.length, OTP_LENGTH) - 1);
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-[#2F2F2F]">Verification Code</label>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            aria-label={`Verification digit ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            className="h-14 w-full rounded-2xl border border-[#A10E4D]/20 bg-white text-center text-xl font-bold tracking-[0.2em] text-[#2F2F2F] outline-none transition focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3] disabled:opacity-60"
            disabled={disabled}
            inputMode="numeric"
            maxLength={1}
            name={index === 0 ? name : undefined}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            onPaste={onPaste}
            pattern="[0-9]*"
            required={index === 0}
            type="text"
            value={digit}
          />
        ))}
      </div>
      <p className="text-xs text-[#6B7280]">
        Enter the 6-digit code we sent by SMS. You can also paste the whole code.
      </p>
    </div>
  );
}
