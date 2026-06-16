'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MemberShell from '../member-shell';
import {
  EmptyState,
  PremiumButton,
  PremiumCard,
  VerificationBadge,
} from '@/app/components';
import { useMemberRequest } from '@/lib/member-api';
import {
  Bell,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  Loader2,
  Star,
} from 'lucide-react';

type ActivityTab =
  | 'received'
  | 'sent'
  | 'favourites'
  | 'recentlyViewed'
  | 'viewedMe'
  | 'notifications';

interface InterestProfile {
  id: string;
  firstName?: string;
  age?: number;
  city?: string;
  occupation?: string;
  verificationLevel?: string;
}

interface InterestItem {
  id: string;
  status: string;
  sender?: InterestProfile;
  receiver?: InterestProfile;
  createdAt: string;
}

interface FavouriteItem {
  id: string;
  profile: {
    id: string;
    firstName?: string;
    age?: number;
    city?: string;
    occupation?: string;
    verificationLevel?: string;
  };
}

interface RecentlyViewedItem {
  viewedAt: string;
  profile: {
    _id: string;
    displayId: string;
    personal?: { firstName?: string; age?: number };
    location?: { city?: string; state?: string };
    religion?: { religion?: string };
    verification?: { level?: string };
  };
}

interface ViewerEntry {
  viewedAt: string;
  blurred: boolean;
  viewer: {
    id: string | null;
    displayId: string | null;
    firstName: string | null;
    age?: number;
    city?: string;
    state?: string;
    occupation?: string;
    religion?: string;
    verificationLevel: string;
  } | null;
}

interface ProfileViewersResponse {
  total: number;
  isPaid: boolean;
  viewers: ViewerEntry[];
}

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

function Avatar({ name }: { name: string | null | undefined }) {
  const initial = (name ?? 'V').slice(0, 1).toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFF0F3_0%,#FFDCE8_100%)] text-sm font-bold text-[#A10E4D]"
    >
      {initial}
    </div>
  );
}

function formatRelative(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function InterestPreview({
  item,
  mode,
}: Readonly<{ item: InterestItem; mode: 'received' | 'sent' }>) {
  const profile = mode === 'received' ? item.sender : item.receiver;
  const href = profile?.id ? `/profiles/${profile.id}` : '/member/matches';
  const statusColors: Record<string, string> = {
    ACCEPTED: 'bg-[#E8F7EF] text-[#1F6F4A]',
    PENDING: 'bg-[#FFF0F3] text-[#A10E4D]',
    REJECTED: 'bg-[#FEF2F2] text-red-700',
  };

  return (
    <Link
      href={href}
      className="flex flex-col rounded-3xl border border-[#A10E4D]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={profile?.firstName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#2F2F2F]">
              {profile?.firstName ?? 'Vivah member'}
              {profile?.age ? `, ${profile.age}` : ''}
            </p>
            <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]', statusColors[item.status] ?? 'bg-[#FFF0F3] text-[#A10E4D]')}>
              {item.status.toLowerCase()}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {[profile?.city, profile?.occupation].filter(Boolean).join(' • ') || 'Australia'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#A10E4D]/6 pt-3">
        <VerificationBadge level={profile?.verificationLevel} />
        <span className="text-xs font-medium text-[#6B7280]">{formatRelative(item.createdAt)}</span>
      </div>
    </Link>
  );
}

function FavouritePreview({ item }: Readonly<{ item: FavouriteItem }>) {
  return (
    <Link
      href={`/profiles/${item.profile.id}`}
      className="flex flex-col rounded-3xl border border-[#A10E4D]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={item.profile.firstName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#2F2F2F]">
              {item.profile.firstName ?? 'Vivah member'}
              {item.profile.age ? `, ${item.profile.age}` : ''}
            </p>
            <Heart className="size-4 shrink-0 text-[#A10E4D]" />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {[item.profile.city, item.profile.occupation].filter(Boolean).join(' • ') || 'Australia'}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-[#A10E4D]/6 pt-3">
        <VerificationBadge level={item.profile.verificationLevel} />
      </div>
    </Link>
  );
}

function RecentlyViewedPreview({ item }: Readonly<{ item: RecentlyViewedItem }>) {
  const profile = item.profile;
  return (
    <Link
      href={`/profiles/${profile._id}`}
      className="flex flex-col rounded-3xl border border-[#A10E4D]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={profile.personal?.firstName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#2F2F2F]">
              {profile.personal?.firstName ?? profile.displayId}
              {profile.personal?.age ? `, ${profile.personal.age}` : ''}
            </p>
            <Clock3 className="size-4 shrink-0 text-[#A10E4D]" />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {[profile.location?.city, profile.location?.state].filter(Boolean).join(', ') || 'Australia'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#A10E4D]/6 pt-3">
        <VerificationBadge level={profile.verification?.level ?? 'Verified'} />
        <span className="text-xs font-medium text-[#6B7280]">{formatRelative(item.viewedAt)}</span>
      </div>
    </Link>
  );
}

function ViewerPreview({
  entry,
  isPaid,
}: Readonly<{ entry: ViewerEntry; isPaid: boolean }>) {
  if (entry.blurred || !entry.viewer?.id) {
    return (
      <Link
        href="/member/subscription"
        className="flex flex-col rounded-3xl border border-[#D4A04C]/30 bg-[linear-gradient(135deg,#FFF8EC_0%,#FFFFFF_100%)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4A04C]/30 bg-[#FFF8EC]">
            <Eye className="size-4 text-[#D4A04C]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2F2F2F]">Premium viewer insight</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">Upgrade to reveal who viewed your profile.</p>
          </div>
        </div>
        <p className="mt-3 border-t border-[#D4A04C]/15 pt-3 text-xs font-medium text-[#A10E4D]">
          Viewed {formatRelative(entry.viewedAt)}
        </p>
      </Link>
    );
  }

  const viewer = entry.viewer;
  return (
    <Link
      href={`/profiles/${viewer.id}`}
      className="flex flex-col rounded-3xl border border-[#A10E4D]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={viewer.firstName ?? undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#2F2F2F]">
              {viewer.firstName ?? viewer.displayId}
              {viewer.age ? `, ${viewer.age}` : ''}
            </p>
            <Eye className={cx('size-4 shrink-0', isPaid ? 'text-[#A10E4D]' : 'text-[#D4A04C]')} />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {[viewer.city ?? viewer.state, viewer.occupation].filter(Boolean).join(' • ') || 'Australia'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#A10E4D]/6 pt-3">
        <VerificationBadge level={viewer.verificationLevel} />
        <span className="text-xs font-medium text-[#6B7280]">{formatRelative(entry.viewedAt)}</span>
      </div>
    </Link>
  );
}

function NotificationPreview({ item }: Readonly<{ item: NotificationItem }>) {
  const isUnread = !item.readAt;
  return (
    <Link
      href="/member/notifications"
      className={cx(
        'flex flex-col rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md',
        isUnread ? 'border-[#A10E4D]/20 bg-[#FFF9F5]' : 'border-[#A10E4D]/10 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isUnread ? 'bg-[#FFF0F3]' : 'bg-[#FFF8EC]'
        )}>
          {isUnread ? <Bell className="size-4 text-[#A10E4D]" /> : <Star className="size-4 text-[#D4A04C]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#2F2F2F] line-clamp-1">{item.title}</p>
            {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#A10E4D] mt-1" />}
          </div>
          {item.body ? <p className="mt-0.5 text-xs leading-5 text-[#6B7280] line-clamp-2">{item.body}</p> : null}
        </div>
      </div>
      <p className="mt-3 border-t border-[#A10E4D]/6 pt-3 text-xs font-medium text-[#6B7280]">{formatRelative(item.createdAt)}</p>
    </Link>
  );
}

export default function ActivityHubPage() {
  const memberRequest = useMemberRequest();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>('received');
  const [receivedInterests, setReceivedInterests] = useState<InterestItem[]>([]);
  const [sentInterests, setSentInterests] = useState<InterestItem[]>([]);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [profileViewers, setProfileViewers] = useState<ProfileViewersResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab]);

  useEffect(() => {
    void (async () => {
      const [
        receivedResult,
        sentResult,
        favouritesResult,
        recentlyViewedResult,
        viewersResult,
        notificationsResult,
      ] = await Promise.all([
        memberRequest('/api/me/interests?box=received'),
        memberRequest('/api/me/interests?box=sent'),
        memberRequest('/api/me/favourites'),
        memberRequest('/api/me/recently-viewed'),
        memberRequest('/api/me/profile-viewers'),
        memberRequest('/api/me/notifications'),
      ]);

      if (receivedResult.ok) {
        setReceivedInterests(
          ((receivedResult.data as { interests?: InterestItem[] }).interests ?? []).filter(Boolean),
        );
      } else {
        setMessage(receivedResult.message);
      }

      if (sentResult.ok) {
        setSentInterests(
          ((sentResult.data as { interests?: InterestItem[] }).interests ?? []).filter(Boolean),
        );
      }

      if (favouritesResult.ok) {
        setFavourites((favouritesResult.data as { favourites?: FavouriteItem[] }).favourites ?? []);
      }

      if (recentlyViewedResult.ok) {
        setRecentlyViewed(
          (recentlyViewedResult.data as { items?: RecentlyViewedItem[] }).items ?? [],
        );
      }

      if (viewersResult.ok) {
        setProfileViewers(viewersResult.data as ProfileViewersResponse);
      }

      if (notificationsResult.ok) {
        setNotifications(
          (notificationsResult.data as { notifications?: NotificationItem[] }).notifications ?? [],
        );
      }

      setLoading(false);
    })();
  }, [memberRequest]);

  const tabs = useMemo(
    () => [
      { key: 'received' as const, label: 'Received interests', count: receivedInterests.length, href: '/member/interests' },
      { key: 'sent' as const, label: 'Sent interests', count: sentInterests.length, href: '/member/interests' },
      { key: 'favourites' as const, label: 'Favourites', count: favourites.length, href: '/member/favourites' },
      { key: 'recentlyViewed' as const, label: 'Recently viewed', count: recentlyViewed.length, href: '/member/recently-viewed' },
      { key: 'viewedMe' as const, label: 'Viewed me', count: profileViewers?.total ?? 0, href: '/member/profile-viewers' },
      {
        key: 'notifications' as const,
        label: 'Notifications',
        count: notifications.filter((item) => !item.readAt).length,
        href: '/member/notifications',
      },
    ],
    [favourites.length, notifications, profileViewers?.total, receivedInterests.length, recentlyViewed.length, sentInterests.length],
  );

  const activeItems = (() => {
    switch (activeTab) {
      case 'received':
        return receivedInterests.slice(0, visibleCount).map((item) => <InterestPreview key={item.id} item={item} mode="received" />);
      case 'sent':
        return sentInterests.slice(0, visibleCount).map((item) => <InterestPreview key={item.id} item={item} mode="sent" />);
      case 'favourites':
        return favourites.slice(0, visibleCount).map((item) => <FavouritePreview key={item.id} item={item} />);
      case 'recentlyViewed':
        return recentlyViewed
          .slice(0, visibleCount)
          .map((item) => <RecentlyViewedPreview key={`${item.profile._id}-${item.viewedAt}`} item={item} />);
      case 'viewedMe':
        return (profileViewers?.viewers ?? [])
          .slice(0, visibleCount)
          .map((entry, index) => (
            <ViewerPreview
              key={`${entry.viewer?.id ?? 'blurred'}-${index}`}
              entry={entry}
              isPaid={Boolean(profileViewers?.isPaid)}
            />
          ));
      case 'notifications':
        return notifications
          .slice(0, visibleCount)
          .map((item) => <NotificationPreview key={item._id} item={item} />);
      default:
        return [];
    }
  })();

  const activeTabMeta = tabs.find((tab) => tab.key === activeTab);

  if (loading) {
    return (
      <MemberShell
        title="Activity"
        subtitle="Your interests, favourites, profile attention, and notifications in one place."
      >
        <div className="flex min-h-[360px] items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#A10E4D]" />
          <p className="text-sm font-semibold text-[#6B7280]">Loading your activity hub...</p>
        </div>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="Activity"
      subtitle="Interests, favourites, viewers, and notifications."
    >
      <div className="grid gap-4">
        {message ? (
          <p className="rounded-2xl border border-[#A10E4D]/10 bg-[#FFF8F1] p-4 text-sm font-semibold text-[#A10E4D]">
            {message}
          </p>
        ) : null}

        <PremiumCard className="rounded-2xl border border-[#A10E4D]/10 bg-white p-4">
          {/* Tab bar */}
          <div className="-mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cx(
                  'inline-flex snap-start items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition',
                  activeTab === tab.key
                    ? 'bg-[#A10E4D] text-white'
                    : 'text-[#6B7280] hover:bg-[#FFF0F3] hover:text-[#A10E4D]',
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#FFF0F3] text-[#A10E4D]')}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* View-all link */}
          {activeTabMeta && (
            <div className="mt-3 flex items-center justify-end">
              <PremiumButton href={activeTabMeta.href} variant="secondary" className="text-xs h-8 px-3">
                Open full page <ChevronRight className="size-3.5" />
              </PremiumButton>
            </div>
          )}

          {/* Content */}
          <div className="mt-4">
            {activeItems.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{activeItems}</div>
            ) : (
              <EmptyState title="Nothing here yet">
                This section will fill as you interact with other profiles.
              </EmptyState>
            )}
            
            {activeTabMeta && activeItems.length < activeTabMeta.count && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="rounded-xl border border-[#A10E4D]/20 bg-[#FFF0F3] px-6 py-2 text-sm font-semibold text-[#A10E4D] hover:bg-[#A10E4D] hover:text-white transition"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </MemberShell>
  );
}
