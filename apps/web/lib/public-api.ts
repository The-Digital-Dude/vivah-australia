const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface PublicPlan {
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface FeaturedProfile {
  id?: string;
  _id?: string;
  displayId: string;
  slug?: string;
  isBoosted?: boolean;
  personal?: {
    firstName?: string;
    age?: number;
    gender?: string;
  };
  location?: {
    city?: string;
    state?: string;
  };
  religion?: {
    religion?: string;
  };
  employment?: {
    occupation?: string;
  };
  verification?: {
    level?: string;
  };
  stats?: {
    lastActiveAt?: string;
  };
}

export interface PublicMatchPreviewResponse {
  profiles: FeaturedProfile[];
  limit: number;
  gated: boolean;
}

export interface PublicContentItem {
  slug?: string;
  title?: string;
  body?: string;
  name?: string;
  quote?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublicPage {
  slug: string;
  title: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface HomeContent {
  hero?: {
    title?: string;
    subtitle?: string;
    primaryAction?: string;
    secondaryAction?: string;
  };
  howItWorks?: string[];
  safety?: string[];
  faq?: Array<{ question?: string; answer?: string }>;
  contact?: {
    email?: string;
    location?: string;
  };
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getHomeContent() {
  return getJson<HomeContent>('/api/public/home', {});
}

export async function getFeaturedProfiles() {
  return getJson<{ profiles: FeaturedProfile[] }>('/api/public/featured-profiles', {
    profiles: [],
  });
}

export async function getPublicMatches(query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const suffix = params.size ? `?${params.toString()}` : '';
  return getJson<PublicMatchPreviewResponse>(`/api/public/matches${suffix}`, {
    profiles: [],
    limit: 0,
    gated: true,
  });
}

export async function getPlans() {
  return getJson<{ plans: PublicPlan[] }>('/api/public/plans', { plans: [] });
}

export async function getSuccessStories() {
  return getJson<{ stories: PublicContentItem[] }>('/api/public/success-stories', { stories: [] });
}

export async function getTestimonials() {
  return getJson<{ testimonials: PublicContentItem[] }>('/api/public/testimonials', {
    testimonials: [],
  });
}

export async function getBlogs(limit = 3) {
  return getJson<{ blogs: PublicContentItem[] }>(`/api/public/blogs?limit=${limit}`, { blogs: [] });
}

export async function getCmsSections(pageKey: string) {
  return getJson<{ sections: any[] }>(`/api/public/sections/${pageKey}`, { sections: [] });
}

export async function getCmsPage(slug: string) {
  return getJson<{ page: PublicPage | null }>(`/api/public/pages/${slug}`, { page: null });
}

export async function getFaqs() {
  return getJson<{ faqs: any[] }>('/api/public/faqs', { faqs: [] });
}

export async function getBlogBySlug(slug: string) {
  return getJson<{ blog: any | null }>(`/api/public/blogs/${slug}`, { blog: null });
}

export async function submitContactInquiry(body: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { message?: string };

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Message sent.' : 'Unable to send message.'),
  };
}

// ── Phase B helpers ────────────────────────────────────────────────────────

export interface LandingPageData {
  slug: string;
  title: string;
  metaDescription?: string;
  city?: string;
  religion?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  customBody?: string;
  active: boolean;
}

export async function getLandingPage(slug: string) {
  return getJson<{ page: LandingPageData | null; profiles: FeaturedProfile[] }>(
    `/api/public/matrimony/${slug}`,
    { page: null, profiles: [] },
  );
}

export async function validateCoupon(code: string, planCode?: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/public/promotions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, planCode }),
    });
    const data = (await response.json()) as {
      valid?: boolean;
      code?: string;
      label?: string;
      discountPercent?: number;
      message?: string;
    };
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: { message: 'Unable to validate coupon.' } };
  }
}

export interface CampaignBannerData {
  _id: string;
  key: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  type: 'INFO' | 'WARNING' | 'PROMO';
  segment: 'ALL' | 'PREMIUM' | 'FREE';
}

export async function getCampaignBanners() {
  return getJson<{ banners: CampaignBannerData[] }>('/api/public/banners', { banners: [] });
}
