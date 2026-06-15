'use client';

import { useState, type FormEvent } from 'react';
import {
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
  notificationPreferencesSchema,
  profileDraftSchema,
} from '@vivah/shared';
import { Bell, Lock, ShieldCheck, Smartphone, User } from 'lucide-react';
import { PremiumButton, PremiumCard } from '@/app/components';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import ProfileManagementShell from '../profile-management-shell';

const privacySchema = profileDraftSchema.pick({ visibility: true });

type SettingsTab = 'privacy' | 'notifications' | 'account';

const TABS: { key: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'privacy', label: 'Privacy', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'account', label: 'Account', icon: User },
];

function Toggle({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  return (
    <div className="relative shrink-0">
      <input name={name} type="checkbox" className="peer sr-only" defaultChecked={defaultChecked} />
      <div className="h-6 w-11 rounded-full bg-[#E5E7EB] transition peer-checked:bg-[#A10E4D]" />
      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
    </div>
  );
}

export default function MemberSettingsPage() {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<SettingsTab>('privacy');

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
    if (!parsed.success) { setMessage(validationMessage(parsed.error.issues)); return; }
    const result = await memberRequest('/api/me/privacy', { method: 'PATCH', body: parsed.data });
    setMessage(result.message);
  }

  async function saveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      emailNotifications: form.get('emailNotifications') === 'on',
      smsNotifications: form.get('smsNotifications') === 'on',
      pushNotifications: form.get('pushNotifications') === 'on',
      marketingNotifications: form.get('marketingNotifications') === 'on',
    };
    const parsed = notificationPreferencesSchema.safeParse(payload);
    if (!parsed.success) { setMessage(validationMessage(parsed.error.issues)); return; }
    const result = await memberRequest('/api/me/notification-preferences', { method: 'PATCH', body: parsed.data });
    setMessage(result.message);
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = mobileOtpRequestSchema.safeParse({ mobile: form.get('mobile') });
    if (!parsed.success) { setMessage(validationMessage(parsed.error.issues)); return; }
    const result = await memberRequest('/api/me/mobile/request-otp', { method: 'POST', body: parsed.data });
    setMessage(result.message);
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = mobileOtpVerifySchema.safeParse({ mobile: form.get('mobile'), code: form.get('code') });
    if (!parsed.success) { setMessage(validationMessage(parsed.error.issues)); return; }
    const result = await memberRequest('/api/me/mobile/verify-otp', { method: 'POST', body: parsed.data });
    setMessage(result.message);
  }

  async function enablePush() {
    const endpoint = `https://push.local/${crypto.randomUUID()}`;
    const result = await memberRequest('/api/me/push-subscriptions', {
      method: 'POST',
      body: { endpoint, keys: { p256dh: 'local-placeholder-p256dh', auth: 'local-placeholder-auth' }, userAgent: navigator.userAgent },
    });
    setMessage(result.ok ? 'Push placeholder subscription saved.' : result.message);
  }

  return (
    <ProfileManagementShell
      title="Privacy & settings"
      subtitle="Control visibility, notifications, and account options."
      active="settings"
    >
      <div className="grid gap-5">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setMessage(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === key
                  ? 'bg-white text-[#A10E4D] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#2F2F2F]'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#7A1E3A]">
            {message}
          </div>
        )}

        {/* Privacy tab */}
        {tab === 'privacy' && (
          <PremiumCard className="rounded-[28px] p-6">
            <form className="grid gap-5" onSubmit={(event) => void savePrivacy(event)}>
              <label className="grid gap-2 text-sm font-semibold text-[#2F2F2F]">
                Profile visibility
                <select
                  name="status"
                  className="h-11 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 text-sm outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                >
                  {['PUBLIC', 'MEMBERS_ONLY', 'MATCHES_ONLY', 'HIDDEN'].map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { name: 'showPhoto', title: 'Show profile photos' },
                  { name: 'showIncome', title: 'Show income details' },
                  { name: 'showEmployer', title: 'Show employer' },
                  { name: 'showLastName', title: 'Show last name' },
                ].map((item) => (
                  <label
                    key={item.name}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-white"
                  >
                    <Toggle name={item.name} />
                    <span>{item.title}</span>
                  </label>
                ))}
              </div>

              <PremiumButton type="submit" className="w-full sm:w-auto">Save privacy</PremiumButton>
            </form>
          </PremiumCard>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <PremiumCard className="rounded-[28px] p-6">
            <form className="grid gap-2" onSubmit={(event) => void saveNotifications(event)}>
              {[
                { name: 'emailNotifications', title: 'Email notifications', defaultOn: true },
                { name: 'smsNotifications', title: 'SMS notifications', defaultOn: false },
                { name: 'pushNotifications', title: 'Push notifications', defaultOn: false },
                { name: 'marketingNotifications', title: 'Product updates', defaultOn: false },
              ].map((item) => (
                <label
                  key={item.name}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[#A10E4D]/10 bg-white px-4 py-3 text-sm font-semibold text-[#2F2F2F] transition hover:bg-[#FFF9F5]"
                >
                  <span className="flex-1">{item.title}</span>
                  <Toggle name={item.name} defaultChecked={item.defaultOn} />
                </label>
              ))}

              <div className="mt-2 flex items-center justify-between gap-4">
                <PremiumButton type="submit" variant="secondary" className="w-full sm:w-auto">
                  Save notifications
                </PremiumButton>
                <PremiumButton type="button" variant="secondary" onClick={() => void enablePush()} className="w-full sm:w-auto">
                  <Smartphone className="size-4" />
                  Enable push
                </PremiumButton>
              </div>
            </form>
          </PremiumCard>
        )}

        {/* Account tab */}
        {tab === 'account' && (
          <div className="grid gap-4">
            <PremiumCard className="rounded-[28px] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#2F2F2F]">
                <ShieldCheck className="size-4 text-[#A10E4D]" />
                Verify mobile number
              </h2>
              <form className="grid gap-3" onSubmit={(event) => void requestOtp(event)}>
                <input
                  name="mobile"
                  placeholder="+61412345678"
                  className="h-11 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 text-sm outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                />
                <PremiumButton type="submit" variant="secondary" className="w-full">Send code</PremiumButton>
              </form>
              <form className="mt-3 grid gap-3" onSubmit={(event) => void verifyOtp(event)}>
                <input
                  name="mobile"
                  placeholder="+61412345678"
                  className="h-11 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 text-sm outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                />
                <input
                  name="code"
                  placeholder="123456"
                  className="h-11 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 text-sm outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
                />
                <PremiumButton type="submit" className="w-full">Verify number</PremiumButton>
              </form>
            </PremiumCard>

            <PremiumCard className="rounded-[28px] border border-red-200/40 bg-[#FFF0F3]/20 p-6">
              <h2 className="mb-4 text-base font-semibold text-red-700">Danger zone</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2F2F2F]">Deactivate profile</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Hide from search and discovery. You can reactivate anytime.</p>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        if (confirm('Deactivate your profile? This hides you from all members.')) {
                          const res = await memberRequest('/api/me/deactivate', { method: 'POST' });
                          setMessage(res.message);
                          if (res.ok) {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('refresh_token');
                            window.location.href = '/login';
                          }
                        }
                      })();
                    }}
                    className="mt-3 w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
                  >
                    Deactivate
                  </button>
                </div>

                <div className="rounded-2xl border border-red-200 bg-white p-4">
                  <p className="text-sm font-semibold text-red-700">Delete account</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Permanently erase your profile, messages, and data. Irreversible.</p>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        if (confirm('Permanently delete your account? This cannot be undone.')) {
                          const res = await memberRequest('/api/me/delete-request', { method: 'POST' });
                          setMessage(res.message);
                          if (res.ok) {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('refresh_token');
                            window.location.href = '/';
                          }
                        }
                      })();
                    }}
                    className="mt-3 w-full h-10 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm transition"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </PremiumCard>
          </div>
        )}
      </div>
    </ProfileManagementShell>
  );
}
