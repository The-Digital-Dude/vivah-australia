'use client';

import { useState, type FormEvent } from 'react';
import { submitContactInquiry } from '@/lib/public-api';

export default function ContactForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await submitContactInquiry({
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      subject: form.get('subject'),
      message: form.get('message'),
      captchaToken: 'local-placeholder',
    });

    setMessage(result.message);
    setPending(false);

    if (result.ok) {
      event.currentTarget.reset();
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
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-red-700 px-5 text-sm font-semibold text-white disabled:bg-neutral-400"
      >
        {pending ? 'Sending...' : 'Send message'}
      </button>
      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
    </form>
  );
}
