import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'verification-policy';
const fallback = {
  title: 'Verification Policy',
  description:
    'Understand the Vivah Australia trust ladder and how verification badges are reviewed and granted.',
  body: 'We are committed to building the most trusted South Asian matrimonial community in Australia.\n\nOur verification policy defines our trust ladder:\n\n1. Basic Verification: Achieved immediately upon verifying email and mobile OTP.\n\n2. Silver Badge: Granted when our admin team manually reviews and approves a valid photo ID (e.g., driver license or passport).\n\n3. Gold Badge: Earned when members verify their address (utility bill or tenancy agreement) or current professional employment.\n\n4. Platinum / Fully Verified: Awarded after a comprehensive verification check by our dedicated support agents, confirming all profile details are consistent and accurate.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function VerificationPolicyPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={<StaticPageHero eyebrow="Profile Verification" title={page?.title ?? fallback.title} />}
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#2F2F2F]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
