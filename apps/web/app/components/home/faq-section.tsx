import { FAQAccordion } from '@/app/components';

const faqItems = [
  {
    question: 'Is Vivah Australia free to join?',
    answer:
      'Yes. You can create your profile, browse introductions, and begin your journey before upgrading for direct communication and visibility benefits.',
  },
  {
    question: 'How does verification work?',
    answer:
      'Members can complete multiple trust checks including mobile, identity, address, employment, visa, and selfie verification for stronger credibility.',
  },
  {
    question: 'Can I control who sees my photos?',
    answer:
      'Yes. Photo privacy and visibility settings let you choose how widely your profile and images are shared.',
  },
  {
    question: 'When can members message each other?',
    answer:
      'Messaging is unlocked when a mutual connection is established and the conversation meets the current membership rules.',
  },
  {
    question: 'Can I report or block someone?',
    answer:
      'Yes. Trust and safety tools are built into the experience so you can report, block, or hide profiles whenever needed.',
  },
];

export function FaqSection() {
  return (
    <section className="bg-[#e74c7d04] py-20 sm:py-24">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4a04c]">
            Trust, privacy, and membership
          </p>
          <h2 className="mt-4 font-playfair text-4xl font-bold text-[#2f2f2f] sm:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-5 text-base leading-7 text-[#5f5f5f] sm:text-lg">
            Clear answers for members who want to understand verification, privacy, messaging, and
            safety before joining.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <FAQAccordion items={faqItems} />
        </div>
      </div>
    </section>
  );
}
