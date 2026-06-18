import type { CampaignBannerData } from '@/lib/public-api';
import BannerStripClient from './banner-strip-client';

async function fetchBanners(): Promise<CampaignBannerData[]> {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:4000').trim();
  try {
    const res = await fetch(`${apiBase}/api/public/banners`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { banners?: CampaignBannerData[] };
    return data.banners ?? [];
  } catch {
    return [];
  }
}

export default async function CampaignBannerStrip() {
  const banners = await fetchBanners();
  if (banners.length === 0) return null;
  return <BannerStripClient banners={banners} />;
}
