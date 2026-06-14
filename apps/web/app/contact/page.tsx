import { PublicHeader, PublicFooter } from '@/app/components';
import ContactForm from './contact-form';
import { Mail, MapPin, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact Vivah Australia',
  description:
    'Contact Vivah Australia for membership support, safety concerns, media requests, and partnership inquiries.',
};

const CONTACT_DETAILS = [
  {
    icon: Mail,
    title: 'Email Support',
    value: 'support@vivahaustralia.com.au',
    note: 'We respond within 24 hours on business days.',
    href: 'mailto:support@vivahaustralia.com.au',
  },
  {
    icon: MapPin,
    title: 'Based in Australia',
    value: 'Australia-wide',
    note: 'Serving all 8 states and territories.',
    href: null,
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Mon – Fri, 9am – 5pm AEST',
    note: 'Safety concerns reviewed 7 days a week.',
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Get in Touch
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
            We&apos;re Here to Help
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Send membership questions, safety concerns, media requests, or partnership inquiries.
            Our team reviews every message and responds promptly.
          </p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">

          {/* Left: contact details */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-3">
                Contact Details
              </p>
              <h2 className="font-playfair text-2xl font-bold text-brand-charcoal mb-2">
                Member Care
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Use this channel for account help, safety questions, billing support, partnerships,
                and media inquiries.
              </p>
            </div>

            <div className="space-y-4">
              {CONTACT_DETAILS.map(({ icon: Icon, title, value, note, href }) => (
                <div
                  key={title}
                  className="rounded-[20px] bg-white border border-gray-100 p-5 flex items-start gap-4"
                >
                  <div className="size-10 shrink-0 rounded-xl bg-brand-maroon/10 flex items-center justify-center">
                    <Icon className="size-4 text-brand-maroon" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                      {title}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm font-bold text-brand-maroon hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-brand-charcoal">{value}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{note}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Safety note */}
            <div className="rounded-[20px] border border-red-100 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="size-4 text-red-600" />
                <p className="text-sm font-bold text-red-800">Safety Concerns</p>
              </div>
              <p className="text-xs text-red-700 leading-relaxed mb-3">
                If you believe you are dealing with a scammer, catfish, or unsafe member, please
                report them directly from their profile. Our safety team reviews all reports around
                the clock.
              </p>
              <Link
                href="/safety"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline"
              >
                Read safety guidelines <ArrowRight className="size-3" />
              </Link>
            </div>

            {/* Useful links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Useful Links
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Help Center', '/help'],
                  ['FAQs', '/faq'],
                  ['Safety', '/safety'],
                  ['Refund Policy', '/refund-policy'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href!}
                    className="rounded-full border border-brand-maroon/20 bg-white px-3 py-1.5 text-xs font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: contact form */}
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-10">
            <h2 className="font-playfair text-xl font-bold text-brand-charcoal mb-1">
              Send a Message
            </h2>
            <p className="text-sm text-gray-400 mb-7">
              All fields are required. We will reply to the email address you provide.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
