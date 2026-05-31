'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useState, useRef, type FormEvent } from 'react';
import { submitContactInquiry } from '@/lib/public-api';

export default function ContactForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    if (!captchaToken) {
      setMessage('Please complete the CAPTCHA before submitting.');
      setPending(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const result = await submitContactInquiry({
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      subject: form.get('subject'),
      message: form.get('message'),
      captchaToken,
    });

    setMessage(result.message);
    setPending(false);

    if (result.ok) {
      event.currentTarget.reset();
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
      {[
        ['Name', 'name', 'text'],
        ['Email', 'email', 'email'],
        ['Phone', 'phone', 'tel'],
        ['Subject', 'subject', 'text'],
      ].map(([label, name, type]) => (
        <label key={name} className="grid gap-2 text-sm font-medium text-neutral-800">
          {label}
          <input
            name={name}
            type={type}
            required={name !== 'phone'}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
          />
        </label>
      ))}
      <label className="grid gap-2 text-sm font-medium text-neutral-800">
        Message
        <textarea
          name="message"
          required
          rows={6}
          className="rounded-md border border-neutral-300 px-3 py-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
        />
      </label>

      {sitekey ? (
        <HCaptcha
          ref={captchaRef}
          sitekey={sitekey}
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
        />
      ) : (
        <p className="text-sm text-red-600">
          hCaptcha site key is not configured. Please set NEXT_PUBLIC_HCAPTCHA_SITEKEY.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !captchaToken}
        className="h-11 rounded-md bg-red-700 px-5 text-sm font-semibold text-white disabled:bg-neutral-400"
      >
        {pending ? 'Sending...' : 'Send message'}
      </button>
      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
    </form>
  );
}
