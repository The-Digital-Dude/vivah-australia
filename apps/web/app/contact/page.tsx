import ContactForm from './contact-form';

export const metadata = {
  title: 'Contact Vivah Australia',
  description: 'Contact Vivah Australia for membership, support, and partnership inquiries.',
};

export default function ContactPage() {
  return (
    <main className="bg-white text-neutral-950">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Contact Vivah Australia
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Support for members and families</h1>
          <p className="mt-5 leading-7 text-neutral-600">
            Send membership questions, media requests, partnership inquiries, or support messages.
            The team will review your inquiry and respond through the contact details provided.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-neutral-700">
            <p>Email: support@vivahaustralia.com.au</p>
            <p>Location: Australia</p>
            <p>Hours: Monday to Friday, 9:00 AM to 5:00 PM AEST</p>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-6">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
