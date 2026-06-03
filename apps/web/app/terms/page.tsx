import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'terms-and-conditions';
const fallback = {
  title: 'Terms & Conditions',
  description: 'Read the matrimonial terms and conditions for using the Vivah Australia platform.',
  body: 'Welcome to Vivah Australia. By registering an account and using our matchmaking platform, you agree to comply with our Terms and Conditions.\n\nOur service is exclusively for single individuals and families looking for serious, long-term matrimonial introductions.\n\nAll members are expected to provide true, accurate, and verified identity details during onboarding. Abuse, commercial solicitation, harassment, or creation of fraudulent accounts will result in immediate suspension.\n\nFull terms of service parameters are updated regularly through our CMS console.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function TermsPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={
        <StaticPageHero eyebrow="Matrimonial Agreement" title={page?.title ?? fallback.title} />
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
