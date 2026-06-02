'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MemberShell from '../member-shell';
import {
  EmptyState,
  PremiumButton,
  PremiumCard,
  SectionHeader,
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
  ShieldCheck,
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

  return (
    <Link
      href={href}
      className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {profile?.firstName ?? 'Vivah member'}
            {profile?.age ? `, ${profile.age}` : ''}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {[profile?.city, profile?.occupation].filter(Boolean).join(' • ') || 'Australia'}
          </p>
        </div>
        <span className="rounded-full bg-[#F8E8E8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
          {item.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
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
      className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {item.profile.firstName ?? 'Vivah member'}
            {item.profile.age ? `, ${item.profile.age}` : ''}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {[item.profile.city, item.profile.occupation].filter(Boolean).join(' • ') ||
              'Australia'}
          </p>
        </div>
        <Heart className="size-4 text-[#7A1F2B]" />
      </div>
      <div className="mt-3">
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
      className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {profile.personal?.firstName ?? profile.displayId}
            {profile.personal?.age ? `, ${profile.personal.age}` : ''}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {[profile.location?.city, profile.location?.state].filter(Boolean).join(', ') ||
              'Australia'}
          </p>
        </div>
        <Clock3 className="size-4 text-[#7A1F2B]" />
      </div>
      <div className="mt-3 flex items-center justify-between">
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
        className="rounded-3xl border border-[#D4AF37]/30 bg-[#FFF8EC] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Premium viewer insight</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Upgrade to reveal who viewed your profile.
            </p>
          </div>
          <Eye className="size-4 text-[#D4AF37]" />
        </div>
        <p className="mt-3 text-xs font-medium text-[#7A1F2B]">
          Viewed {formatRelative(entry.viewedAt)}
        </p>
      </Link>
    );
  }

  const viewer = entry.viewer;
  return (
    <Link
      href={`/profiles/${viewer.id}`}
      className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {viewer.firstName ?? viewer.displayId}
            {viewer.age ? `, ${viewer.age}` : ''}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {[viewer.city ?? viewer.state, viewer.occupation].filter(Boolean).join(' • ') ||
              'Australia'}
          </p>
        </div>
        <Eye className={cx('size-4', isPaid ? 'text-[#7A1F2B]' : 'text-[#D4AF37]')} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <VerificationBadge level={viewer.verificationLevel} />
        <span className="text-xs font-medium text-[#6B7280]">{formatRelative(entry.viewedAt)}</span>
      </div>
    </Link>
  );
}

function NotificationPreview({ item }: Readonly<{ item: NotificationItem }>) {
  return (
    <Link
      href="/member/notifications"
      className="rounded-3xl border border-[#7A1F2B]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">{item.title}</p>
          {item.body ? <p className="mt-1 text-sm text-[#6B7280]">{item.body}</p> : null}
        </div>
        {!item.readAt ? <Bell className="size-4 text-[#7A1F2B]" /> : <Star className="size-4 text-[#D4AF37]" />}
      </div>
      <p className="mt-3 text-xs font-medium text-[#6B7280]">{formatRelative(item.createdAt)}</p>
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

  const summaryCards = [
    {
      label: 'Received interests',
      value: receivedInterests.length,
      body: 'People who have already shown direct interest in your profile.',
      icon: Heart,
      href: '/member/interests',
    },
    {
      label: 'Favourites',
      value: favourites.length,
      body: 'Profiles you may want to revisit before the momentum cools.',
      icon: Star,
      href: '/member/favourites',
    },
    {
      label: 'Viewed me',
      value: profileViewers?.total ?? 0,
      body: 'Profile attention is one of the clearest signals of discovery momentum.',
      icon: Eye,
      href: '/member/profile-viewers',
    },
    {
      label: 'Unread notifications',
      value: notifications.filter((item) => !item.readAt).length,
      body: 'System, interest, and billing updates waiting for your attention.',
      icon: Bell,
      href: '/member/notifications',
    },
  ];

  const activeItems = (() => {
    switch (activeTab) {
      case 'received':
        return receivedInterests.slice(0, 6).map((item) => <InterestPreview key={item.id} item={item} mode="received" />);
      case 'sent':
        return sentInterests.slice(0, 6).map((item) => <InterestPreview key={item.id} item={item} mode="sent" />);
      case 'favourites':
        return favourites.slice(0, 6).map((item) => <FavouritePreview key={item.id} item={item} />);
      case 'recentlyViewed':
        return recentlyViewed
          .slice(0, 6)
          .map((item) => <RecentlyViewedPreview key={`${item.profile._id}-${item.viewedAt}`} item={item} />);
      case 'viewedMe':
        return (profileViewers?.viewers ?? [])
          .slice(0, 6)
          .map((entry, index) => (
            <ViewerPreview
              key={`${entry.viewer?.id ?? 'blurred'}-${index}`}
              entry={entry}
              isPaid={Boolean(profileViewers?.isPaid)}
            />
          ));
      case 'notifications':
        return notifications
          .slice(0, 6)
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
          <Loader2 className="size-8 animate-spin text-[#7A1F2B]" />
          <p className="text-sm font-semibold text-[#6B7280]">Loading your activity hub...</p>
        </div>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="Activity"
      subtitle="A calmer view of your interest flow, saved profiles, profile attention, and important updates."
    >
      <div className="grid gap-8">
        {message ? (
          <p className="rounded-2xl border border-[#7A1F2B]/10 bg-[#FFF8F1] p-4 text-sm font-semibold text-[#7A1F2B]">
            {message}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="group">
                <PremiumCard className="h-full rounded-[28px] border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(122,31,43,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[#1A1A1A]">{card.value}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8E8E8] p-3 text-[#7A1F2B]">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#6B7280]">{card.body}</p>
                </PremiumCard>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.06)] sm:p-6">
          <SectionHeader
            eyebrow="Activity hub"
            title="Switch between the moments that matter most"
            subtitle="Use one place to review interest responses, revisit saved profiles, check who viewed you, and stay on top of notifications."
          />

          <div className="mt-6 flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cx(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold transition',
                  activeTab === tab.key
                    ? 'bg-[#7A1F2B] text-white'
                    : 'text-[#6B7280] hover:bg-[#F8E8E8] hover:text-[#7A1F2B]',
                )}
              >
                {tab.label}
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#F8E8E8] text-[#7A1F2B]',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-[#7A1F2B]/10 bg-[#FCFAF7] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                  Current view
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#1A1A1A]">
                  {activeTabMeta?.label ?? 'Activity'}
                </h3>
              </div>
              {activeTabMeta ? (
                <PremiumButton href={activeTabMeta.href} variant="secondary" className="w-full sm:w-auto">
                  Open full page
                  <ChevronRight className="size-4" />
                </PremiumButton>
              ) : null}
            </div>

            <div className="mt-5">
              {activeItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{activeItems}</div>
              ) : (
                <EmptyState title="Nothing here yet">
                  This section will fill as you send interests, save favourites, get profile views,
                  and receive important account updates.
                </EmptyState>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#F8E8E8] p-3 text-[#7A1F2B]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Keep the right pace</h3>
                <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                  Activity works best when you revisit warm signals quickly. Replying to interests,
                  reviewing profile viewers, and revisiting favourites early usually leads to better
                  conversations.
                </p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="rounded-[30px] border border-[#7A1F2B]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#F8E8E8] p-3 text-[#7A1F2B]">
                <Clock3 className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Stay relationship-focused</h3>
                <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                  This hub is here to reduce route-hopping. Use it as your daily check-in point,
                  then move into the full page only when you need to go deeper.
                </p>
              </div>
            </div>
          </PremiumCard>
        </section>
      </div>
    </MemberShell>
  );
}
