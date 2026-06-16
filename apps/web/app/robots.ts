import type { MetadataRoute } from 'next';

const siteUrl = 'https://vivahaustralia.com.au';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/member', '/auth', '/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
