import type { Metadata } from 'next';
import Link from 'next/link';
import { getCmsPage } from '@/lib/public-api';

const fallbackPages: Record<string, { title: string; body: string; description: string }> = {
  'about-us': {
    title: 'About Us',
    description: 'Learn about Vivah Australia.',
    body: 'Vivah Australia is being built as a premium matrimonial and matchmaking platform for Australian singles and families.',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    description: 'Privacy information for Vivah Australia.',
    body: 'Privacy policy content will be managed from the CMS before production launch.',
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    description: 'Terms and conditions for Vivah Australia.',
    body: 'Terms and conditions content will be managed from the CMS before production launch.',
  },
  'refund-policy': {
    title: 'Refund Policy',
    description: 'Refund policy for Vivah Australia memberships.',
    body: 'Refund policy content will be managed from the CMS before production launch.',
  },
  'safety-guidelines': {
    title: 'Safety Guidelines',
    description: 'Safety guidance for members.',
    body: 'Members should use platform privacy controls, report suspicious behaviour, and avoid sharing sensitive information before trust is established.',
  },
  'community-guidelines': {
    title: 'Community Guidelines',
    description: 'Community expectations for Vivah Australia.',
    body: 'Community guidelines content will be managed from the CMS before production launch.',
  },
  'verification-policy': {
    title: 'Verification Policy',
    description: 'Verification policy for Vivah Australia.',
    body: 'Verification policy content will be managed from the CMS before production launch.',
  },
  'help-centre': {
    title: 'Help Centre',
    description: 'Help and support for Vivah Australia members.',
    body: 'Help centre content will be managed from the CMS before production launch.',
  },
  faq: {
    title: 'FAQ',
    description: 'Frequently asked questions about Vivah Australia.',
    body: 'FAQ content will be managed from the CMS before production launch.',
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await getCmsPage(slug);
  const fallback = fallbackPages[slug];

  return {
    title: page?.seoTitle ?? page?.title ?? fallback?.title ?? 'Vivah Australia',
    description: page?.seoDescription ?? fallback?.description,
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const { page } = await getCmsPage(slug);
  const fallback = fallbackPages[slug] ?? {
    title: 'Page not found',
    body: 'This page is not published yet.',
  };

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-950">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-red-700">
          Vivah Australia
        </Link>
        <h1 className="mt-8 text-4xl font-semibold">{page?.title ?? fallback.title}</h1>
        <div className="mt-6 whitespace-pre-line text-base leading-8 text-neutral-700">
          {page?.body ?? fallback.body}
        </div>
      </article>
    </main>
  );
}
