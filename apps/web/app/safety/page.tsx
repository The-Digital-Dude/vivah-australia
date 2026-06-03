import type { Metadata } from 'next';
import {
  PolicyContentCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'safety-guidelines';
const fallback = {
  title: 'Safety Guidelines',
  description:
    'Learn safety rules, secure introduction guidelines, and reporting practices for Vivah Australia.',
  body: 'Your safety is our top priority. Matrimonial introductions are exciting, but you should always follow baseline precautions:\n\n1. Protect Personal Information: Do not share financial details, home addresses, or private phone numbers early. Keep your conversations within the secure in-app chat.\n\n2. Look for Badges: Connect preferentially with Gold or Silver verified profiles who have had their IDs and location checked.\n\n3. Report Suspicious Behaviour: If a member asks for money, behaves disrespectfully, or provides false details, block and report them immediately using the in-app action buttons.\n\n4. Public Meetings: Always meet in well-lit, public spaces for your first few introductions and inform a close family member or friend of your plans.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function SafetyPage() {
  const { page } = await getCmsPage(slug);

  return (
    <StaticPageLayout
      hero={<StaticPageHero eyebrow="Community Safety" title={page?.title ?? fallback.title} />}
    >
      <StaticPageContainer>
        <PolicyContentCard className="mx-auto max-w-3xl">
          <div className="whitespace-pre-line text-[#2F2F2F]">{page?.body ?? fallback.body}</div>
        </PolicyContentCard>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
