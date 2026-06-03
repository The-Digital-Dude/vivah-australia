import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'about-us';
const fallback = {
  title: 'About Us',
  description:
    'Learn about Vivah Australia matrimonial community and premium matchmaking services.',
  body: 'Vivah Australia is a premier matrimonial and matchmaking platform designed specifically for South Asian and Indian singles and families residing in Australia.\n\nOur mission is to combine cultural awareness, manual profile verification, and robust privacy controls to help members connect confidently and securely.\n\nWhether you are searching for yourself, your child, or a sibling, Vivah Australia provides a trust-first community to foster serious relationship introductions and life-long partnerships.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function AboutPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={
        <StaticPageHero
          eyebrow="Vivah Australia Matrimonial"
          title={page?.title ?? fallback.title}
        />
      }
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#2F2F2F]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
