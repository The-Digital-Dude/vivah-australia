'use client';

import { useState, type FormEvent } from 'react';
import { notificationPreferencesSchema, profileDraftSchema } from '@vivah/shared';
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
        {message ? (
          <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{message}</p>
        ) : null}
      </div>
    </MemberShell>
  );
}
