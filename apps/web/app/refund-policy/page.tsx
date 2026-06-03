import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'refund-policy';
const fallback = {
  title: 'Refund Policy',
  description:
    'Understand the billing refund conditions for paid matrimonial premium plans on Vivah Australia.',
  body: 'Vivah Australia offers transparent billing. We provide premium plans, gold status, and platinum access to connect members.\n\nSince our services unlock immediate digital match interactions, profile boost features, and advanced search filters, payments are generally non-refundable.\n\nIf you experience technical issues or accidental duplicate purchases, please contact our support team within 14 days of purchase. We review refund claims case-by-case to maintain fair community transactions.\n\nAll billing, invoices, and payment histories are managed securely in your dashboard billing tab.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function RefundPolicyPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={<StaticPageHero eyebrow="Billing Policy" title={page?.title ?? fallback.title} />}
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#2F2F2F]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
