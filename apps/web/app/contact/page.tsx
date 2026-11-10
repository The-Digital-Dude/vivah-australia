import type { Metadata } from 'next';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import ContactForm from './contact-form';
import { Mail, MapPin, Globe, Phone, Building2, User, ShieldCheck, Heart, AlertTriangle, LockKeyhole } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Vivah Australia',
  description: 'Get in touch with Vivah Australia. We are here to help.',
};

const HELP_TOPICS = [
  {
    title: 'Membership & Billing',
    desc: 'Questions about membership plans, billing, digital delivery or receipt enquiries.',
    icon: User
  },
  {
    title: 'Verification Support',
    desc: 'Questions about profile verification, badges, and account authenticity.',
    icon: ShieldCheck
  },
  {
    title: 'Safety & Reporting',
    desc: 'Report suspicious activity, inappropriate behaviour or safety concerns.',
    icon: AlertTriangle
  },
  {
    title: 'Technical Assistance',
    desc: 'Experiencing issues with your account or platform features? Our team is here to help.',
    icon: LockKeyhole
  },
  {
    title: 'General Enquiries',
    desc: 'Questions about Vivah Australia, features or future updates.',
    icon: Heart
  }
];

const FAQS = [
  {
    q: 'Do you offer phone support?',
    a: 'Yes. You can contact our Australian member support team directly on +61 479 134 385, Monday to Friday from 9:00 AM to 5:00 PM AEST, or email us at support@vivahaustralia.com.au.'
  },
  {
    q: 'How quickly will I receive an email response?',
    a: 'We aim to respond to all member and general enquiries within 1 business day (and within a few hours for urgent verification or billing requests).'
  },
  {
    q: 'How will charges appear on my credit card statement?',
    a: 'All subscription and membership purchases processed on this website will appear on your cardholder statement as "VIVAH AUSTRALIA". All prices are in Australian Dollars (AUD).'
  },
  {
    q: 'Can I contact Vivah Australia regarding a profile concern?',
    a: 'Yes. If you believe a profile may be misleading, inappropriate or suspicious, please contact us immediately or use our reporting tools.'
  },
  {
    q: 'Can I request account deletion?',
    a: 'Yes. Members may request account closure or deletion in accordance with our Privacy Policy and applicable laws.'
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-ivory font-poppins selection:bg-brand-gold/20 selection:text-brand-maroon">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-4">
            Contact Us
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-brand-charcoal mb-4">
            We&apos;re Here to Help
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Whether you have questions about Vivah Australia, need assistance with your profile, or would like to enquire about membership and billing, our Melbourne-based team is here to support you.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/register"
              className="rounded-xl bg-brand-maroon px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-maroon/90"
            >
              Create Free Profile
            </Link>
            <a 
              href="#form"
              className="rounded-xl border border-brand-maroon/20 px-6 py-3 text-sm font-bold text-brand-maroon transition hover:bg-brand-maroon/5 bg-white"
            >
              Send Enquiry
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact Section ───────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr_1.4fr] gap-12 items-start">

          {/* Left: Get In Touch */}
          <div>
            <h2 className="font-playfair text-2xl font-bold text-brand-charcoal mb-3">
              Get In Touch
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Australian registered business details &amp; dedicated support channels.
            </p>
            
            <div className="space-y-6">
              
              {/* Business Details */}
              <div className="flex items-start gap-4">
                <div className="size-12 shrink-0 rounded-full bg-brand-maroon/5 flex items-center justify-center">
                  <Building2 className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal mb-0.5">Trading Entity &amp; ABN</p>
                  <p className="text-sm text-gray-700 font-semibold">Vivah Australia</p>
                  <p className="text-xs text-gray-500 font-medium">ABN: 85 700 086 808</p>
                </div>
              </div>

              {/* Phone Support */}
              <div className="flex items-start gap-4">
                <div className="size-12 shrink-0 rounded-full bg-brand-maroon/5 flex items-center justify-center">
                  <Phone className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal mb-0.5">Phone Support</p>
                  <a href="tel:+61479134385" className="text-sm text-brand-maroon font-bold hover:underline">
                    +61 479 134 385
                  </a>
                  <p className="text-xs text-gray-500 mt-0.5">Monday – Friday, 9:00 AM – 5:00 PM AEST</p>
                </div>
              </div>

              {/* Email Support */}
              <div className="flex items-start gap-4">
                <div className="size-12 shrink-0 rounded-full bg-brand-maroon/5 flex items-center justify-center">
                  <Mail className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal mb-0.5">Customer &amp; Billing Support</p>
                  <a href="mailto:support@vivahaustralia.com.au" className="text-sm text-gray-700 hover:text-brand-maroon transition font-medium">
                    support@vivahaustralia.com.au
                  </a>
                  <p className="text-xs text-gray-500 mt-0.5">General: <a href="mailto:info@vivahaustralia.com.au" className="hover:underline">info@vivahaustralia.com.au</a></p>
                </div>
              </div>

              {/* Trading Address */}
              <div className="flex items-start gap-4">
                <div className="size-12 shrink-0 rounded-full bg-brand-maroon/5 flex items-center justify-center">
                  <MapPin className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal mb-0.5">Registered Trading Address</p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    3 Leafton Street, Truganina, VIC 3029, Australia
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Operating across all Australian States &amp; Territories</p>
                </div>
              </div>

              {/* Website & Cardholder Descriptor */}
              <div className="flex items-start gap-4">
                <div className="size-12 shrink-0 rounded-full bg-brand-maroon/5 flex items-center justify-center">
                  <Globe className="size-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal mb-0.5">Website &amp; Card Descriptor</p>
                  <a href="https://www.vivahaustralia.com.au" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-brand-maroon transition font-medium">
                    www.vivahaustralia.com.au
                  </a>
                  <p className="text-xs text-gray-500 mt-0.5">Statement descriptor: &quot;VIVAH AUSTRALIA&quot; (AUD)</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Contact Form */}
          <div id="form" className="bg-white rounded-[32px] p-8 sm:p-10 shadow-sm border border-brand-maroon/5">
            <div className="mb-8">
              <h2 className="font-playfair text-2xl font-bold text-brand-charcoal mb-2">
                Send Us a Message
              </h2>
              <p className="text-sm text-gray-500">We&apos;d Love to Hear From You</p>
            </div>
            
            <ContactForm />
          </div>
          
        </div>
      </section>

      {/* ── How Can We Help? ────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-8 lg:px-12 border-y border-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-brand-charcoal mb-4">
              How Can We Help?
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {HELP_TOPICS.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <div key={index} className="bg-brand-ivory/50 rounded-2xl p-6 border border-brand-maroon/5">
                  <div className="size-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-4">
                    <Icon className="size-6 text-brand-gold" />
                  </div>
                  <h3 className="font-bold text-brand-charcoal mb-2">{topic.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{topic.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQs & Info ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl space-y-16">
          
          <div>
            <h2 className="font-playfair text-3xl font-bold text-brand-charcoal mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-brand-charcoal text-lg mb-3">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Safety Concerns Block */}
          <div className="bg-red-50 rounded-3xl p-8 sm:p-10 border border-red-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <AlertTriangle className="size-32 text-red-600" />
            </div>
            <div className="relative z-10">
              <h3 className="font-playfair text-2xl font-bold text-red-900 mb-2">Safety Concerns</h3>
              <p className="text-sm font-bold text-red-800 uppercase tracking-widest mb-6">Need Immediate Assistance?</p>
              
              <div className="space-y-4 max-w-2xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  If you believe a member has violated our policies or you encounter suspicious behaviour, please use our reporting tools or contact our support team.
                </p>
                <p className="text-sm text-red-800 leading-relaxed font-bold">
                  For emergencies or situations involving immediate danger, please contact local emergency services (000 in Australia) or relevant authorities directly.
                </p>
              </div>
            </div>
          </div>
          
          {/* Important Information Block */}
          <div className="bg-brand-maroon/5 rounded-3xl p-8 sm:p-10 border border-brand-maroon/10">
            <h3 className="font-bold text-brand-maroon mb-4 text-sm uppercase tracking-widest">Important Information</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Vivah Australia is owned and operated by Aussi Biz Pty Ltd (ABN: 85 700 086 808). Registered address: 3 Leafton Street, Truganina, VIC 3029, Australia.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                All prices are in Australian Dollars (AUD) and inclusive of GST where applicable. Charges on your bank or credit card statement will appear as &quot;VIVAH AUSTRALIA&quot;.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                For information regarding privacy, verification, digital delivery and platform usage, please refer to our Privacy Policy, Delivery Policy, and Terms of Use.
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,76,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white mb-5">
            Start Your Journey Today
          </h2>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Create your free profile and begin exploring meaningful connections across Australia.
          </p>
          <div className="flex justify-center mb-10">
            <PremiumButton href="/register" variant="gold">
              Create Free Profile
            </PremiumButton>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-brand-gold text-xs sm:text-sm font-medium">
            <span>🛡️ Verification Available</span>
            <span className="opacity-50">•</span>
            <span>🔒 Privacy Protected</span>
            <span className="opacity-50">•</span>
            <span>❤️ Serious Relationships</span>
            <span className="opacity-50">•</span>
            <span>🇦🇺 Built for Australia</span>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
