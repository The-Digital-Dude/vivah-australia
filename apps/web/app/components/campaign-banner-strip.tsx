'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Info, AlertCircle, Zap } from 'lucide-react';
import type { CampaignBannerData } from '@/lib/public-api';

const STORAGE_KEY = 'vivah_dismissed_banners';

function getDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function dismiss(key: string) {
  try {
    const dismissed = getDismissed();
    if (!dismissed.includes(key)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed, key]));
    }
  } catch {
    // ignore
  }
}

const TYPE_STYLES = {
  INFO: {
    bg: 'bg-blue-600',
    text: 'text-white',
    icon: Info,
    ctaBorder: 'border-white/30 bg-white/20 hover:bg-white/30',
  },
  WARNING: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: AlertCircle,
    ctaBorder: 'border-white/30 bg-white/20 hover:bg-white/30',
  },
  PROMO: {
    bg: 'bg-gradient-to-r from-[#A10E4D] to-[#E74C7C]',
    text: 'text-white',
    icon: Zap,
    ctaBorder: 'border-white/30 bg-white/20 hover:bg-white/30',
  },
};

export default function CampaignBannerStrip() {
  const [banners, setBanners] = useState<CampaignBannerData[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    void fetch(`${apiBase}/api/public/banners`)
      .then(r => r.json())
      .then((data: { banners?: CampaignBannerData[] }) => setBanners(data.banners ?? []))
      .catch(() => {
        // silently fail — banners are non-critical
      });
  }, []);

  const visible = banners.filter(b => !dismissed.includes(b.key));

  if (visible.length === 0) return null;

  const banner = visible[0]!;
  const styles = TYPE_STYLES[banner.type] ?? TYPE_STYLES.INFO;
  const Icon = styles.icon;

  const handleDismiss = () => {
    dismiss(banner.key);
    setDismissed(prev => [...prev, banner.key]);
  };

  return (
    <div
      className={`relative z-50 flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 ${styles.bg} ${styles.text}`}
      role="alert"
      aria-label="Site announcement"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 flex-shrink-0 opacity-80" aria-hidden="true" />
        <p className="text-sm font-semibold leading-tight">{banner.message}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {banner.ctaLabel && banner.ctaHref && (
          <Link
            href={banner.ctaHref}
            className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${styles.ctaBorder}`}
          >
            {banner.ctaLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-white/20 transition"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
