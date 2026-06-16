import type { MetadataRoute } from 'next';
import { getLandingPages } from '@/lib/public-api';

const siteUrl = 'https://vivahaustralia.com.au';

const staticRoutes = [
  '/',
  '/about',
  '/safety',
  '/blog',
  '/contact',
  '/faq',
  '/pricing',
  '/membership',
  '/help',
  '/how-it-works',
  '/success-stories',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/community-guidelines',
  '/verification-policy',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages } = await getLandingPages();
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: route === '/' ? 'daily' as const : 'weekly' as const,
      priority: route === '/' ? 1 : 0.7,
    })),
    ...pages.map((page) => ({
      url: `${siteUrl}/matrimony/${page.slug}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
