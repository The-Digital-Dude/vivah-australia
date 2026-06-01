'use client';

import { useState, type FormEvent } from 'react';
import {
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
  notificationPreferencesSchema,
  profileDraftSchema,
} from '@vivah/shared';
import MemberShell from '../member-shell';
import { useMemberRequest, validationMessage } from '@/lib/member-api';

const privacySchema = profileDraftSchema.pick({ visibility: true });

export default function MemberSettingsPage() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);

  async function savePrivacy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      visibility: {
        status: form.get('status'),
        showPhoto: form.get('showPhoto') === 'on',
        showIncome: form.get('showIncome') === 'on',
        showEmployer: form.get('showEmployer') === 'on',
        showLastName: form.get('showLastName') === 'on',
      },
    };
    const parsed = privacySchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest('/api/me/privacy', {
      method: 'PATCH',
      body: parsed.data,
    });
    setMessage(result.message);
  }

  async function saveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      emailNotifications: form.get('emailNotifications') === 'on',
      smsNotifications: form.get('smsNotifications') === 'on',
      marketingNotifications: form.get('marketingNotifications') === 'on',
    };
    const parsed = notificationPreferencesSchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }

    const result = await memberRequest('/api/me/notification-preferences', {
      method: 'PATCH',
      body: parsed.data,
    });
    setMessage(result.message);
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = mobileOtpRequestSchema.safeParse({ mobile: form.get('mobile') });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest('/api/me/mobile/request-otp', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.message);
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = mobileOtpVerifySchema.safeParse({
      mobile: form.get('mobile'),
      code: form.get('code'),
    });
    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      return;
    }
    const result = await memberRequest('/api/me/mobile/verify-otp', {
      method: 'POST',
      body: parsed.data,
    });
    setMessage(result.message);
  }

  async function enablePush() {
    const endpoint = `https://push.local/${crypto.randomUUID()}`;
    const result = await memberRequest('/api/me/push-subscriptions', {
      method: 'POST',
      body: {
        endpoint,
        keys: { p256dh: 'local-placeholder-p256dh', auth: 'local-placeholder-auth' },
        userAgent: navigator.userAgent,
      },
    });
    setMessage(result.ok ? 'Push placeholder subscription saved.' : result.message);
  }

  return (
    <MemberShell
      title="Account settings"
      subtitle="Manage profile visibility and notification preferences."
    >
      <div className="grid gap-8">
        <form className="grid gap-4" onSubmit={(event) => void savePrivacy(event)}>
          <label className="grid gap-2 text-sm font-medium">
            Profile visibility
            <select name="status" className="h-11 rounded-md border border-neutral-300 px-3">
              {['PUBLIC', 'MEMBERS_ONLY', 'MATCHES_ONLY', 'HIDDEN'].map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          {['showPhoto', 'showIncome', 'showEmployer', 'showLastName'].map((name) => (
            <label key={name} className="flex gap-3 text-sm text-neutral-700">
              <input name={name} type="checkbox" className="mt-1 size-4" />
              {name.replace('show', 'Show ')}
            </label>
          ))}
          <button className="h-11 rounded-md bg-red-700 px-5 text-sm font-semibold text-white">
            Save privacy
          </button>
        </form>
        <form
          className="grid gap-4 border-t border-neutral-200 pt-6"
          onSubmit={(event) => void saveNotifications(event)}
        >
          {['emailNotifications', 'smsNotifications', 'marketingNotifications'].map((name) => (
            <label key={name} className="flex gap-3 text-sm text-neutral-700">
              <input
                name={name}
                type="checkbox"
                className="mt-1 size-4"
                defaultChecked={name === 'emailNotifications'}
              />
              {name.replace('Notifications', ' notifications')}
            </label>
          ))}
          <button className="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold">
            Save notifications
          </button>
        </form>
        <section className="grid gap-4 border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold">Mobile OTP</h2>
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={(event) => void requestOtp(event)}
          >
            <input
              name="mobile"
              placeholder="+61412345678"
              className="h-11 rounded-md border border-neutral-300 px-3"
            />
            <button className="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold">
              Send code
            </button>
          </form>
          <form
            className="grid gap-3 md:grid-cols-[1fr_140px_auto]"
            onSubmit={(event) => void verifyOtp(event)}
          >
            <input
              name="mobile"
              placeholder="+61412345678"
              className="h-11 rounded-md border border-neutral-300 px-3"
            />
            <input
              name="code"
              placeholder="123456"
              className="h-11 rounded-md border border-neutral-300 px-3"
            />
            <button className="h-11 rounded-md bg-red-700 px-5 text-sm font-semibold text-white">
              Verify
            </button>
          </form>
        </section>
        <section className="grid gap-3 border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold">Push notifications</h2>
          <button
            type="button"
            onClick={() => void enablePush()}
            className="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold"
          >
            Save placeholder subscription
          </button>
        </section>
        {message ? (
          <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{message}</p>
        ) : null}
      </div>
    </MemberShell>
  );
}
