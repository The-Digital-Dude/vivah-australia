'use client';

import { useState, type FormEvent } from 'react';
import {
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
  notificationPreferencesSchema,
  profileDraftSchema,
} from '@vivah/shared';
import { Bell, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { PremiumButton, PremiumCard } from '@/app/components';
import { useMemberRequest, validationMessage } from '@/lib/member-api';
import ProfileManagementShell from '../profile-management-shell';

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
      pushNotifications: form.get('pushNotifications') === 'on',
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
    <ProfileManagementShell
      title="Privacy & settings"
      subtitle="Control who can see your profile, how members contact you, and how Vivah reaches you."
      active="settings"
      utility={
        <>
          <PremiumCard className="rounded-[30px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Privacy philosophy
            </p>
            <h3 className="mt-3 font-playfair text-2xl font-semibold text-[#2F2F2F]">
              Openness with boundaries
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Fine-tune how much information is visible so you can stay approachable without giving
              up control over personal details.
            </p>
          </PremiumCard>

          <PremiumCard className="rounded-[30px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A04C]">
              Best next steps
            </p>
            <div className="mt-4 space-y-3 text-sm text-[#2F2F2F]">
              <div className="rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3">
                Show your strongest photos publicly and keep private albums for deeper trust.
              </div>
              <div className="rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3">
                Keep email notifications on for time-sensitive interest and moderation updates.
              </div>
              <div className="rounded-[22px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-3">
                Verify your mobile number and documents to strengthen trust before sharing more.
              </div>
            </div>
          </PremiumCard>
        </>
      }
    >
      <div className="grid gap-6">
        <PremiumCard className="rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-[#A10E4D]/10 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#A10E4D]">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2F2F2F]">Visibility & profile privacy</h2>
              <p className="text-sm text-[#6B7280]">
                Decide how open your profile should feel while still protecting sensitive details.
              </p>
            </div>
          </div>

          <form className="mt-6 grid gap-5" onSubmit={(event) => void savePrivacy(event)}>
            <label className="grid gap-2 text-sm font-semibold text-[#2F2F2F]">
              Profile visibility
              <select
                name="status"
                className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
              >
                {['PUBLIC', 'MEMBERS_ONLY', 'MATCHES_ONLY', 'HIDDEN'].map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  name: 'showPhoto',
                  title: 'Show profile photos',
                  body: 'Allow members to see the photos you have chosen to make visible.',
                },
                {
                  name: 'showIncome',
                  title: 'Show income details',
                  body: 'Share financial range signals only if you are comfortable making them visible.',
                },
                {
                  name: 'showEmployer',
                  title: 'Show employer',
                  body: 'Display your employer name publicly to support professional trust signals.',
                },
                {
                  name: 'showLastName',
                  title: 'Show last name',
                  body: 'Reveal your full surname only if it fits the pace of introductions you prefer.',
                },
              ].map((item) => (
                <label
                  key={item.name}
                  className="flex gap-3 rounded-[24px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-4 text-sm text-[#2F2F2F]"
                >
                  <input name={item.name} type="checkbox" className="mt-1 size-4 shrink-0" />
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#6B7280]">{item.body}</span>
                  </span>
                </label>
              ))}
            </div>

            <PremiumButton type="submit" className="w-full sm:w-auto">
              Save privacy settings
            </PremiumButton>
          </form>
        </PremiumCard>

        <PremiumCard className="rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-[#A10E4D]/10 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF8EC] text-[#B7832E]">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2F2F2F]">Notification preferences</h2>
              <p className="text-sm text-[#6B7280]">
                Choose how and when you want to hear about new introductions, moderation updates,
                and product announcements.
              </p>
            </div>
          </div>

          <form className="mt-6 grid gap-3" onSubmit={(event) => void saveNotifications(event)}>
            {[
              {
                name: 'emailNotifications',
                title: 'Email notifications',
                body: 'Best for match activity, moderation updates, and profile-related reminders.',
              },
              {
                name: 'smsNotifications',
                title: 'SMS notifications',
                body: 'Useful for urgent alerts and time-sensitive verification updates.',
              },
              {
                name: 'pushNotifications',
                title: 'Push notifications',
                body: 'Stay aware of immediate activity when browser push is available.',
              },
              {
                name: 'marketingNotifications',
                title: 'Membership and product updates',
                body: 'Hear about premium features, offers, and new platform improvements.',
              },
            ].map((item) => (
              <label
                key={item.name}
                className="flex gap-3 rounded-[24px] border border-[#A10E4D]/10 bg-white px-4 py-4 text-sm text-[#2F2F2F]"
              >
                <input
                  name={item.name}
                  type="checkbox"
                  className="mt-1 size-4 shrink-0"
                  defaultChecked={item.name === 'emailNotifications'}
                />
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#6B7280]">{item.body}</span>
                </span>
              </label>
            ))}

            <PremiumButton type="submit" variant="secondary" className="w-full sm:w-auto">
              Save notifications
            </PremiumButton>
          </form>
        </PremiumCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <PremiumCard className="rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#A10E4D]/10 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#A10E4D]">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2F2F2F]">Mobile OTP trust check</h2>
                <p className="text-sm text-[#6B7280]">
                  Verify your number to strengthen trust and keep future account recovery easier.
                </p>
              </div>
            </div>

            <form
              className="mt-6 grid gap-3"
              onSubmit={(event) => void requestOtp(event)}
            >
              <input
                name="mobile"
                placeholder="+61412345678"
                className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
              />
              <PremiumButton type="submit" variant="secondary" className="w-full">
                Send verification code
              </PremiumButton>
            </form>

            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => void verifyOtp(event)}
            >
              <input
                name="mobile"
                placeholder="+61412345678"
                className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
              />
              <input
                name="code"
                placeholder="123456"
                className="h-12 rounded-2xl border border-[#A10E4D]/15 bg-[#FFF9F5]/60 px-4 outline-none focus:border-[#A10E4D] focus:ring-4 focus:ring-[#FFF0F3]"
              />
              <PremiumButton type="submit" className="w-full">
                Verify mobile number
              </PremiumButton>
            </form>
          </PremiumCard>

          <PremiumCard className="rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#A10E4D]/10 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF8EC] text-[#B7832E]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2F2F2F]">Browser push placeholder</h2>
                <p className="text-sm text-[#6B7280]">
                  Save a local placeholder subscription for the current environment without changing
                  any messaging logic.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#D4A04C]/20 bg-[#FFF8EC] px-4 py-4 text-sm leading-6 text-[#6B7280]">
              This is still a development-friendly placeholder flow. It preserves the current
              product behavior while keeping notification setup visible inside the settings
              workspace.
            </div>

            <PremiumButton
              type="button"
              onClick={() => void enablePush()}
              variant="secondary"
              className="mt-4 w-full"
            >
              Save placeholder subscription
            </PremiumButton>
          </PremiumCard>
        </div>

        <PremiumCard className="rounded-[32px] border border-red-200/40 bg-[#FFF0F3]/30 p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-[#A10E4D]/10 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F3] text-red-700">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2F2F2F]">Danger Zone</h2>
              <p className="text-sm text-[#6B7280]">
                Temporarily deactivate your matrimonial profile or permanently delete your account.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[#A10E4D]/10 bg-white p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-[#2F2F2F] text-base">Deactivate Profile</h3>
                <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                  Hide your profile from search, discovery, and recommendations. You can log back in later to reactivate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    if (confirm('Are you sure you want to deactivate your profile? This hides you from all members.')) {
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
                className="mt-4 w-full h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
              >
                Deactivate profile
              </button>
            </div>

            <div className="rounded-[24px] border border-red-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-red-700 text-base">Delete Account</h3>
                <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                  Permanently delete your profile, conversations, uploads, and data. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    if (confirm('Are you sure you want to delete your account? This will permanently erase your profile, matches, and messages.')) {
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
                className="mt-4 w-full h-11 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm transition"
              >
                Delete account
              </button>
            </div>
          </div>
        </PremiumCard>

        {message ? (
          <div className="rounded-[24px] border border-[#A10E4D]/10 bg-[#FFF9F5] px-4 py-4 text-sm font-semibold text-[#7A1E3A]">
            {message}
          </div>
        ) : null}
      </div>
    </ProfileManagementShell>
  );
}
