import {
  ContactCard,
  PremiumCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import ContactForm from './contact-form';

export const metadata = {
  title: 'Contact Vivah Australia',
  description: 'Contact Vivah Australia for membership, support, and partnership inquiries.',
};

export default function ContactPage() {
  return (
    <StaticPageLayout
      hero={
        <StaticPageHero
          eyebrow="Contact Vivah Australia"
          title="Support for members and families"
          subtitle="Send membership questions, media requests, partnership inquiries, or support messages. The team will review your inquiry and respond promptly."
        />
      }
    >
      <StaticPageContainer>
        <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <PremiumCard>
              <h2 className="text-xl font-semibold text-[#A10E4D] mb-3">Member Care</h2>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                Use this channel for account help, safety questions, billing support, partnerships,
                and media inquiries. Our support team is here to assist you.
              </p>
            </PremiumCard>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <ContactCard
                title="Email Support"
                icon="email"
                value="support@vivahaustralia.com.au"
                description="We respond to most emails within 24 hours."
                href="mailto:support@vivahaustralia.com.au"
              />
              <ContactCard
                title="Office Location"
                icon="location"
                value="Australia"
                description="Hours: Mon-Fri, 9:00 AM - 5:00 PM AEST"
              />
            </div>
          </div>
          <PremiumCard>
            <h2 className="text-xl font-semibold text-[#A10E4D] mb-5">Send a Message</h2>
            <ContactForm />
          </PremiumCard>
        </section>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
