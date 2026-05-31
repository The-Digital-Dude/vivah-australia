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
  displayId: string;
  slug?: string;
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

export async function getFeaturedProfiles() {
  return getJson<{ profiles: FeaturedProfile[] }>('/api/public/featured-profiles', {
    profiles: [],
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

export async function getCmsPage(slug: string) {
  return getJson<{ page: PublicPage | null }>(`/api/public/pages/${slug}`, { page: null });
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
