import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'community-guidelines';
const fallback = {
  title: 'Community Guidelines',
  description:
    'Understand the expectations of respect, trust, and cultural integrity in Vivah Australia.',
  body: 'Vivah Australia is built on respect, cultural heritage, and trust. We want our matrimonial space to be helpful, polite, and constructive for all families.\n\nTo preserve this community:\n\n1. Be Honest and Accurate: Provide true details regarding your education, occupation, and family background.\n\n2. Maintain Mutual Respect: South Asian communities thrive on family relationships and politeness. Treat every member, family representative, and counselor with respect.\n\n3. Serious Intent Only: The community is dedicated purely to matrimonial matching. Do not use the platform for casual hookups, dating, or advertising.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function CommunityGuidelinesPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={<StaticPageHero eyebrow="Community Values" title={page?.title ?? fallback.title} />}
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#1A1A1A]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
