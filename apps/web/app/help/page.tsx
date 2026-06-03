import type { Metadata } from 'next';
import {
  HelpCategoryCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage } from '@/lib/public-api';

const slug = 'help-centre';
const fallback = {
  title: 'Help Centre',
  description: 'Search support categories, matrimonial guidelines, and connect with help agents.',
  body: 'Welcome to the Vivah Australia Help Centre. Find instructions to configure your profile, complete verification steps, search for compatible matches, or manage your paid subscription plans.',
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function HelpPage() {
  const { page } = await getCmsPage(slug);

  const categories = [
    {
      title: 'Profile Setup & Onboarding',
      description:
        'Learn how to create a premium matrimonial profile, save draft details, and configure granular privacy controls.',
      href: '/pages/about-us',
      icon: 'phone',
    },
    {
      title: 'Trust & Verification Badges',
      description:
        'Understand the document upload process, verification standards, and how silver, gold, and platinum badges are approved.',
      href: '/verification-policy',
      icon: 'shield',
    },
    {
      title: 'Matches & Communications',
      description:
        'Discover how compatibility scores are calculated, search filters, sending interests, and unlocking chat rooms.',
      href: '/safety',
      icon: 'search',
    },
    {
      title: 'Billing & Premium Invoices',
      description:
        'Get support for checkout issues, payment history downloads, refunds, coupons, and plan subscription cancellations.',
      href: '/refund-policy',
      icon: 'mail',
    },
  ] as const;

  return (
    <StaticPageLayout
      hero={
        <StaticPageHero
          eyebrow="Help & Support"
          title={page?.title ?? fallback.title}
          subtitle={page?.body ?? fallback.body}
        />
      }
    >
      <StaticPageContainer>
        <section className="grid gap-6 sm:grid-cols-2">
          {categories.map((cat) => (
            <HelpCategoryCard
              key={cat.title}
              title={cat.title}
              description={cat.description}
              href={cat.href}
              icon={cat.icon}
            />
          ))}
        </section>

        <div className="mt-12 text-center p-8 bg-[#FFF8F1] border border-[#A10E4D]/10 rounded-3xl">
          <h3 className="font-serif font-bold text-lg text-[#A10E4D] mb-2">Still need help?</h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Our member care team is available to assist you with any questions or account support.
          </p>
          <a
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#A10E4D] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#890B40]"
          >
            Contact Member Care
          </a>
        </div>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
