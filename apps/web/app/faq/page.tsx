import type { Metadata } from 'next';
import {
  FAQAccordion,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getCmsPage, getFaqs } from '@/lib/public-api';

const slug = 'faq';
const fallback = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers regarding matrimonial registration, profile setup, safety rules, and billing details.',
  body: 'Review the most common questions regarding matrimonial matching, verified badges, private photo visibility, messaging, and membership tiers on Vivah Australia.',
};

const fallbackFaqs = [
  {
    question: 'Is Vivah Australia free to join?',
    answer:
      'Yes, creating a profile and receiving interests is entirely free. Premium features unlock direct messaging and advanced visibility.',
  },
  {
    question: 'How does profile verification work?',
    answer:
      'We use a multi-tier verification ladder, reviewing email, mobile, ID, address, and employment documents to grant badges.',
  },
  {
    question: 'Can I control who sees my photos?',
    answer:
      'Absolutely. You can choose to show your photos publicly, only to logged-in members, or strictly to matches you accept.',
  },
  {
    question: 'When can members message each other?',
    answer:
      'Messaging is unlocked when a mutual interest is accepted and at least one member holds an active premium plan.',
  },
  {
    question: 'What is the difference between Free, Premium, Gold, and Platinum?',
    answer:
      'Free members can explore. Premium unlocks communication. Gold and Platinum provide advanced filters, priority placement, and higher visibility.',
  },
  {
    question: 'Can I block or report someone?',
    answer:
      'Yes, safety is a priority. We offer robust reporting tools and strict admin moderation to ensure community safety.',
  },
  {
    question: 'Is this only for Indian Australians?',
    answer:
      'Vivah Australia focuses on the South Asian diaspora within Australia, but our platform respects and welcomes members from all backgrounds seeking serious relationships.',
  },
  {
    question: 'Can divorced or separated members join?',
    answer:
      'Yes, we respect all life journeys. You can specify your marital status clearly so you connect with compatible individuals.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function FaqPage() {
  const { page } = await getCmsPage(slug);
  const { faqs } = await getFaqs();

  const faqItems = faqs && faqs.length > 0
    ? (faqs as { question: string; answer: string }[]).map(f => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;

  return (
    <StaticPageLayout
      hero={
        <StaticPageHero
          eyebrow="Help Centre"
          title={page?.title ?? fallback.title}
          subtitle={page?.body || fallback.body}
        />
      }
    >
      <StaticPageContainer className="max-w-3xl">
        <FAQAccordion items={faqItems} />
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
