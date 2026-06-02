import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'privacy-policy';
const fallback = {
  title: 'Privacy Policy',
  description: 'Review the privacy policy and data protection practices of Vivah Australia.',
  body: 'Your privacy is a core pillar of the Vivah Australia matchmaking community.\n\nWe are committed to securing your personal information, photos, and ID documents through encrypted transmission, secure cloud database servers, and tight manual review queues.\n\nYou have absolute granular control over your profile visibility, public search presence, and gallery photo authorization.\n\nFull details regarding how we collect, store, share, and delete account data are managed dynamically from the CMS.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function PrivacyPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={<StaticPageHero eyebrow="Data Protection" title={page?.title ?? fallback.title} />}
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#1A1A1A]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
