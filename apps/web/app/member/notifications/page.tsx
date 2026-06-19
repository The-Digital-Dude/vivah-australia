'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  CreditCard,
  Heart,
  ShieldCheck,
  Trash,
} from 'lucide-react';
import MemberShell from '../member-shell';
import Link from 'next/link';
import { useNotifications, getNotificationUrl } from '../use-notifications';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function MemberNotificationsPage() {
  const { notifications, message, isSuccess, markRead, markAllRead, remove } = useNotifications();
  const [filterTab, setFilterTab] = useState<'ALL' | 'MATCH' | 'VERIFICATION' | 'BILLING'>('ALL');

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
      title="Notifications"
      subtitle="Interests, verification, and billing updates."
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-x-auto gap-1 scrollbar-none">
            {([
              { key: 'ALL', label: 'All', icon: Bell },
              { key: 'MATCH', label: 'Matches', icon: Heart },
              { key: 'VERIFICATION', label: 'Verification', icon: ShieldCheck },
              { key: 'BILLING', label: 'Billing', icon: CreditCard },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilterTab(key)}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition whitespace-nowrap',
                  filterTab === key
                    ? 'bg-[#A10E4D] text-white'
                    : 'text-[#6B7280] hover:bg-[#FFF0F3] hover:text-[#A10E4D]',
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {unreadCounts[key] > 0 && (
                  <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', filterTab === key ? 'bg-white/20 text-white' : 'bg-[#FFF0F3] text-[#A10E4D]')}>
                    {unreadCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <PremiumButton
            onClick={() => void markAllRead()}
            variant="secondary"
            className="h-8 px-3 text-xs"
            disabled={unreadCounts.ALL === 0}
          >
            <CheckCircle2 className="size-3.5" />
            Mark all read
          </PremiumButton>
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

        <div className="grid gap-2">
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
                      icon: <Heart className="size-4 text-rose-700" />,
                      bg: 'bg-rose-50',
                      label: 'Matrimonial Match',
                    };
                  }
                  if (verificationTypes.some((t) => type.includes(t))) {
                    return {
                      icon: <ShieldCheck className="size-4 text-emerald-700" />,
                      bg: 'bg-emerald-50',
                      label: 'Account Verification',
                    };
                  }
                  if (billingTypes.some((t) => type.includes(t))) {
                    return {
                      icon: <CreditCard className="size-4 text-violet-700" />,
                      bg: 'bg-violet-50',
                      label: 'Payments & Subscriptions',
                    };
                  }
                  return {
                    icon: <Bell className="size-4 text-amber-700" />,
                    bg: 'bg-amber-50',
                    label: 'System Notification',
                  };
                })();

                return (
                  <Link
                    href={getNotificationUrl(n)}
                    key={n._id}
                    onClick={() => { if (isUnread) markRead(n._id); }}
                    className={cx(
                      'rounded-2xl border px-4 py-3 flex gap-3 transition hover:border-[#A10E4D]/30 block',
                      isUnread
                        ? 'border-[#A10E4D]/15 bg-[#FFF9F5] border-l-4 border-l-[#A10E4D]'
                        : 'border-[#A10E4D]/8 bg-white',
                    )}
                  >
                    <div className={cx('grid size-8 shrink-0 place-items-center rounded-xl mt-0.5', category.bg)}>
                      {category.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="flex-1 text-sm font-semibold text-[#2F2F2F] leading-snug">
                          {n.title}
                          {isUnread && <span className="ml-1.5 inline-flex size-1.5 rounded-full bg-[#A10E4D] align-middle" />}
                        </h3>
                      </div>
                      {n.body && <p className="mt-0.5 text-xs leading-5 text-[#6B7280] line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.preventDefault()}>
                      {isUnread && (
                        <button onClick={() => void markRead(n._id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#A10E4D]/20 text-[#A10E4D] transition hover:bg-[#FFF0F3]" aria-label="Mark as read">
                          <Check className="size-3.5" />
                        </button>
                      )}
                      <button onClick={() => void remove(n._id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50" aria-label="Delete">
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MemberShell>
  );
}
