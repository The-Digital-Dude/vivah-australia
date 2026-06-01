import { PageHero, PremiumCard, StaticPageLayout } from '@/app/components';
import ContactForm from './contact-form';

export const metadata = {
  title: 'Contact Vivah Australia',
  description: 'Contact Vivah Australia for membership, support, and partnership inquiries.',
};

export default function ContactPage() {
  return (
    <StaticPageLayout
      hero={
        <PageHero eyebrow="Contact Vivah Australia" title="Support for members and families">
          Send membership questions, media requests, partnership inquiries, or support messages.
          The team will review your inquiry and respond through the contact details provided.
        </PageHero>
      }
    >
      <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <PremiumCard>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Member care</h2>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              Use this channel for account help, safety questions, billing support, partnerships,
              and media inquiries.
            </p>
          </PremiumCard>
          <div className="mt-5 grid gap-3 rounded-3xl border border-[#7A1F2B]/10 bg-white p-5 text-sm text-[#6B7280] shadow-sm">
            <p>Email: support@vivahaustralia.com.au</p>
            <p>Location: Australia</p>
            <p>Hours: Monday to Friday, 9:00 AM to 5:00 PM AEST</p>
          </div>
        </div>
        <PremiumCard>
          <ContactForm />
        </PremiumCard>
      </section>
    </StaticPageLayout>
  );
}
