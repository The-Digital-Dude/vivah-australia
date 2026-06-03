'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CreditCard,
  Heart,
  ShieldCheck,
  Trash,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import MemberShell from '../member-shell';
import { useMemberRequest } from '@/lib/member-api';
import { PremiumButton, PremiumCard } from '@/app/components';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function MemberNotificationsPage() {
  const memberRequest = useMemberRequest();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'MATCH' | 'VERIFICATION' | 'BILLING'>('ALL');

  async function load() {
    const result = await memberRequest('/api/me/notifications');
    if (result.ok) {
      setNotifications((result.data as { notifications?: NotificationItem[] }).notifications ?? []);
    } else {
      setMessage(result.message);
      setIsSuccess(false);
    }
  }

  async function markRead(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}/read`, { method: 'PATCH' });
    setMessage(result.ok ? 'Notification marked as read.' : result.message);
    setIsSuccess(result.ok);
    if (result.ok) {
      await load();
    }
  }

  async function markAllRead() {
    const result = await memberRequest('/api/me/notifications/read-all', { method: 'PATCH' });
    setMessage(result.ok ? 'All notifications marked as read.' : result.message);
    setIsSuccess(result.ok);
    if (result.ok) {
      await load();
    }
  }

  async function remove(id: string) {
    const result = await memberRequest(`/api/me/notifications/${id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Notification deleted successfully.' : result.message);
    setIsSuccess(result.ok);
    if (result.ok) {
      await load();
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Helpers to categorize notifications
  const matchTypes = ['INTEREST', 'MATCH', 'VISIT', 'LIKE'];
  const verificationTypes = ['VERIFY', 'DOCUMENT', 'BADGE', 'TRUST', 'SECURITY'];
  const billingTypes = ['BILLING', 'SUBSCRIBE', 'BOOST', 'PAYMENT', 'INVOICE'];

  const unreadCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      MATCH: 0,
      VERIFICATION: 0,
      BILLING: 0,
    };
    notifications.forEach((n) => {
      if (!n.readAt) {
        counts.ALL++;
        const type = n.type.toUpperCase();
        if (matchTypes.some((t) => type.includes(t))) counts.MATCH++;
        else if (verificationTypes.some((t) => type.includes(t))) counts.VERIFICATION++;
        else if (billingTypes.some((t) => type.includes(t))) counts.BILLING++;
      }
    });
    return counts;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === 'ALL') return true;
      const type = n.type.toUpperCase();
      if (filterTab === 'MATCH') return matchTypes.some((t) => type.includes(t));
      if (filterTab === 'VERIFICATION') return verificationTypes.some((t) => type.includes(t));
      if (filterTab === 'BILLING') return billingTypes.some((t) => type.includes(t));
      return true;
    });
  }, [notifications, filterTab]);

  return (
    <MemberShell
      title="Notifications Center"
      subtitle="Track your account activities, matrimonial match requests, trust verifications, and boosts."
    >
      <div className="grid gap-6">
        {/* ─── Header controls & Tabs ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#A10E4D]/10 pb-px">
          {/* Notification Inbox Tabs */}
          <div className="flex overflow-x-auto gap-2 scrollbar-none">
            <button
              onClick={() => setFilterTab('ALL')}
              className={cx(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
                filterTab === 'ALL'
                  ? 'border-[#A10E4D] text-[#A10E4D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#2F2F2F]',
              )}
            >
              📥 All Updates
              {unreadCounts.ALL > 0 && (
                <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[10px] font-bold text-white ml-1.5">
                  {unreadCounts.ALL}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('MATCH')}
              className={cx(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
                filterTab === 'MATCH'
                  ? 'border-[#A10E4D] text-[#A10E4D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#2F2F2F]',
              )}
            >
              💖 Matches & Interests
              {unreadCounts.MATCH > 0 && (
                <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[10px] font-bold text-white ml-1.5">
                  {unreadCounts.MATCH}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('VERIFICATION')}
              className={cx(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
                filterTab === 'VERIFICATION'
                  ? 'border-[#A10E4D] text-[#A10E4D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#2F2F2F]',
              )}
            >
              🛡️ Verification & Security
              {unreadCounts.VERIFICATION > 0 && (
                <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[10px] font-bold text-white ml-1.5">
                  {unreadCounts.VERIFICATION}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('BILLING')}
              className={cx(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap',
                filterTab === 'BILLING'
                  ? 'border-[#A10E4D] text-[#A10E4D]'
                  : 'border-transparent text-[#6B7280] hover:text-[#2F2F2F]',
              )}
            >
              💳 Billing & Boosts
              {unreadCounts.BILLING > 0 && (
                <span className="rounded-full bg-[#A10E4D] px-2 py-0.5 text-[10px] font-bold text-white ml-1.5">
                  {unreadCounts.BILLING}
                </span>
              )}
            </button>
          </div>

          <div className="shrink-0 pb-2 sm:pb-0">
            <PremiumButton
              onClick={() => void markAllRead()}
              variant="secondary"
              className="h-9 px-4 text-xs"
              disabled={unreadCounts.ALL === 0}
            >
              <CheckCircle2 className="size-4" />
              Mark all read
            </PremiumButton>
          </div>
        </div>

        {message ? (
          <p
            className={cx(
              'rounded-2xl border p-4 text-sm font-semibold transition duration-200',
              isSuccess
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-[#A10E4D]',
            )}
          >
            {message}
          </p>
        ) : null}

        {/* ─── Notification Feed ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <PremiumCard className="p-8 text-center border-dashed text-[#6B7280]">
              <Bell className="mx-auto size-8 text-[#6B7280]/40 mb-2" />
              <h3 className="font-semibold text-[#2F2F2F]">No notifications found</h3>
              <p className="text-xs mt-1 text-[#6B7280]">
                You are all caught up. New updates will appear here.
              </p>
            </PremiumCard>
          ) : (
            <div className="grid gap-3">
              {filteredNotifications.map((n) => {
                const isUnread = !n.readAt;
                const type = n.type.toUpperCase();

                const category = (() => {
                  if (matchTypes.some((t) => type.includes(t))) {
                    return {
                      icon: <Heart className="size-5 text-rose-700" />,
                      bg: 'bg-rose-50',
                      label: 'Matrimonial Match',
                    };
                  }
                  if (verificationTypes.some((t) => type.includes(t))) {
                    return {
                      icon: <ShieldCheck className="size-5 text-emerald-700" />,
                      bg: 'bg-emerald-50',
                      label: 'Account Verification',
                    };
                  }
                  if (billingTypes.some((t) => type.includes(t))) {
                    return {
                      icon: <CreditCard className="size-5 text-violet-700" />,
                      bg: 'bg-violet-50',
                      label: 'Payments & Subscriptions',
                    };
                  }
                  return {
                    icon: <Bell className="size-5 text-amber-700" />,
                    bg: 'bg-amber-50',
                    label: 'System Notification',
                  };
                })();

                return (
                  <article
                    key={n._id}
                    className={cx(
                      'rounded-3xl border p-5 flex gap-4 transition hover:-translate-y-0.5 shadow-sm',
                      isUnread
                        ? 'border-[#A10E4D]/15 bg-[#FFF0F3]/25 border-l-4 border-l-[#A10E4D]'
                        : 'border-[#A10E4D]/5 bg-white',
                    )}
                  >
                    <div
                      className={cx(
                        'grid size-10 place-items-center rounded-2xl shrink-0',
                        category.bg,
                      )}
                    >
                      {category.icon}
                    </div>

                    <div className="min-w-0 flex-1 grid gap-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                          {category.label}
                        </span>
                        {isUnread && (
                          <span className="inline-flex size-2 rounded-full bg-[#A10E4D]" />
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-[#2F2F2F] leading-snug">
                        {n.title}
                      </h3>
                      {n.body && (
                        <p className="text-xs leading-relaxed text-[#6B7280] mt-0.5">{n.body}</p>
                      )}

                      <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        <Clock className="size-3" />
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 justify-center sm:flex-row sm:items-center shrink-0 ml-2">
                      {isUnread && (
                        <PremiumButton
                          onClick={() => void markRead(n._id)}
                          className="size-8 rounded-full p-0 flex items-center justify-center shrink-0 min-h-0"
                          variant="secondary"
                          aria-label="Mark as read"
                        >
                          <Check className="size-4" />
                        </PremiumButton>
                      )}
                      <PremiumButton
                        onClick={() => void remove(n._id)}
                        className="size-8 rounded-full p-0 flex items-center justify-center shrink-0 min-h-0 bg-[#FFF0F3] text-[#A10E4D] border-none hover:bg-red-100"
                        variant="danger"
                        aria-label="Delete"
                      >
                        <Trash className="size-4" />
                      </PremiumButton>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MemberShell>
  );
}
