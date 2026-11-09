import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { FileText, ArrowRight } from 'lucide-react';

const content = {
  title: 'Terms of Use',
  description: 'Read the terms of use and purchase conditions for using the Vivah Australia platform.',
  eyebrow: 'Legal Agreement',
  intro: 'Last Updated: November 2026\n\nWelcome to Vivah Australia ("Vivah Australia", "we", "our", or "us", ABN: 85 700 086 808).\nThese Terms of Use govern your access to and use of the Vivah Australia website, mobile applications, services, content, communications, and related features (collectively referred to as the "Platform").\nBy accessing, registering for, purchasing a membership on, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.\nIf you do not agree to these Terms, you must not use the Platform.',
  sections: [
    {
      heading: '1. ABOUT VIVAH AUSTRALIA',
      body: 'Vivah Australia is an online matrimonial and relationship platform designed to help individuals and families connect with potential marriage and relationship prospects.\nVivah Australia is a technology platform that facilitates introductions between users.\nVivah Australia is not:',
      list: [
        'A marriage broker',
        'A matchmaking agency',
        'A migration agency',
        'A legal advisor',
        'A financial advisor',
        'A relationship counselling service',
      ],
      footer: 'We do not guarantee matches, compatibility, engagements, marriages, or relationship outcomes.',
    },
    {
      heading: '2. ELIGIBILITY',
      body: 'To create an account and use the Platform, you must:',
      list: [
        'Be at least 18 years of age',
        'Have legal capacity to enter into a binding agreement',
        'Provide accurate information',
        'Comply with applicable laws',
      ],
      footer: 'By registering an account, you confirm that you meet these requirements.\nVivah Australia reserves the right to request age or identity verification at any time.',
    },
    {
      heading: '3. ACCOUNT REGISTRATION',
      body: 'Users may be required to create an account to access certain features.\nYou agree to:',
      list: [
        'Provide accurate information',
        'Keep your information up to date',
        'Protect your login credentials',
        'Maintain the confidentiality of your account',
        'Notify us of any unauthorised use',
      ],
      footer: 'You are responsible for all activities conducted through your account.',
    },
    {
      heading: '4. PROFILE INFORMATION',
      body: 'You are solely responsible for information submitted to the Platform.\nThis includes:',
      list: [
        'Profile details',
        'Photographs',
        'Messages',
        'Verification documents',
        'Personal descriptions',
      ],
      footer: 'You agree that all information provided is accurate and truthful to the best of your knowledge.\nProviding false, misleading, fraudulent, or deceptive information may result in suspension or termination of your account.',
    },
    {
      heading: '5. IDENTITY VERIFICATION',
      body: 'Vivah Australia may offer identity verification features to improve trust and safety.\nVerification may include:',
      list: [
        'Mobile verification via OTP',
        'Email verification',
        'Government-issued identification',
        'Employment verification',
        'Other supporting documentation',
      ],
      footer: 'Verification is intended to improve confidence between users.\nVerification does not guarantee:\n• Identity\n• Character\n• Intentions\n• Future behaviour\n• Relationship suitability\nUsers should continue to exercise independent judgment and caution.',
    },
    {
      heading: '6. COMMUNITY STANDARDS',
      body: 'Users must interact respectfully and responsibly.\nYou must not:',
      list: [
        'Harass other users',
        'Threaten other users',
        'Use abusive language',
        'Discriminate against others',
        'Share offensive content',
        'Upload inappropriate images',
        'Impersonate another person',
        'Create fake accounts',
        'Engage in unlawful conduct',
      ],
      footer: 'Vivah Australia reserves the right to remove content or accounts that breach these standards.',
    },
    {
      heading: '7. PROHIBITED ACTIVITIES',
      body: 'You must not use the Platform to:',
      list: [
        'Conduct fraud',
        'Scam other users',
        'Request money dishonestly',
        'Promote illegal activities',
        'Distribute malware',
        'Collect user data without permission',
        'Send spam communications',
        'Advertise unrelated products or services',
      ],
      footer: 'Any suspected fraudulent activity may result in immediate account suspension.',
    },
    {
      heading: '8. COMMUNICATIONS BETWEEN USERS',
      body: 'The Platform may allow users to communicate with one another.\nUsers remain solely responsible for:',
      list: [
        'Messages sent',
        'Information shared',
        'Decisions made',
      ],
      footer: 'Vivah Australia does not endorse, verify, or guarantee statements made by users.\nWe reserve the right to investigate communications where necessary to enforce Platform policies or protect users.',
    },
    {
      heading: '9. USER CONTENT',
      body: 'Users retain ownership of content they upload.\nBy uploading content, you grant Vivah Australia a non-exclusive, worldwide, royalty-free licence to:',
      list: [
        'Store',
        'Display',
        'Process',
        'Reproduce',
        'Use',
      ],
      footer: 'such content for the operation and improvement of the Platform.\nYou represent that you have the right to upload and share such content.',
    },
    {
      heading: '10. SUBSCRIPTIONS, PURCHASES AND PAYMENTS',
      body: 'Vivah Australia provides optional paid membership plans (Silver at $29/mo, Gold at $59/mo, and Platinum at $99/mo AUD) and credit packages that unlock advanced messaging and discovery features.\nBy purchasing a membership or service, you agree to the following terms:\n\n• Currency & Taxes: All prices are displayed and charged in Australian Dollars (AUD) and include Australian Goods and Services Tax (GST) where applicable.\n• Immediate Digital Delivery: Paid memberships are delivered electronically and activated immediately upon successful payment authorization, in accordance with our Digital Delivery & Fulfillment Policy. No physical products are shipped.\n• Recurring Billing & Auto-Renewal: Subscriptions are billed on an automated recurring cycle (monthly, quarterly, or annually) to your nominated credit or debit card. You authorize Vivah Australia to process recurring subscription payments until cancelled.\n• Cancellation: You may cancel your subscription renewal at any time via your Member Dashboard or by emailing support@vivahaustralia.com.au. Cancellation stops future renewals and takes effect at the end of the current billing cycle.\n• Cardholder Statement Descriptor: Charges will appear on your credit card or bank statement as "VIVAH AUSTRALIA".\n• Consumer Guarantees & Refunds: All refunds and disputes are handled under our Refund Policy and statutory non-excludable consumer guarantees under Australian Consumer Law (Competition and Consumer Act 2010).',
    },
    {
      heading: '11. SAFETY AND USER RESPONSIBILITY',
      body: 'Vivah Australia strives to provide a safe environment for users.\nHowever, users acknowledge that:',
      list: [
        'Online interactions involve risks',
        'Not all information can be independently verified',
        'User behaviour cannot be controlled',
        'Verification has limitations',
      ],
      footer: 'Users are responsible for:\n• Exercising caution\n• Conducting their own enquiries\n• Making their own decisions\nUsers should not rely solely upon profile information, verification badges, or statements made by other users.',
    },
    {
      heading: '12. OFFLINE MEETINGS',
      body: 'Any meetings, introductions, family interactions, engagements, or other interactions occurring outside the Platform are entirely the responsibility of the individuals involved.\nVivah Australia is not responsible for:',
      list: [
        'Offline interactions',
        'Personal disputes',
        'Family disputes',
        'Relationship decisions',
        'Marriage decisions',
      ],
      footer: 'Users meet and interact at their own risk.',
    },
    {
      heading: '13. INTELLECTUAL PROPERTY',
      body: 'All Platform content, including but not limited to:',
      list: [
        'Logos',
        'Branding',
        'Software',
        'Design elements',
        'Features',
        'Text',
        'Graphics',
      ],
      footer: 'is owned by Vivah Australia or its licensors.\nUsers may not copy, reproduce, modify, distribute, or exploit Platform content without prior written permission.',
    },
    {
      heading: '14. ACCOUNT SUSPENSION OR TERMINATION',
      body: 'Vivah Australia reserves the right to suspend, restrict, or terminate accounts where:',
      list: [
        'These Terms are breached',
        'Fraud is suspected',
        'False information is provided',
        'User safety is threatened',
        'Illegal activity is suspected',
      ],
      footer: 'We may remove content or accounts without prior notice where necessary to protect users or the Platform.',
    },
    {
      heading: '15. DISCLAIMER OF WARRANTIES',
      body: 'The Platform is provided on an "as is" and "as available" basis.\nTo the maximum extent permitted by law, Vivah Australia makes no guarantees regarding:',
      list: [
        'Platform availability',
        'Accuracy of information',
        'User conduct',
        'Match quality',
        'Relationship outcomes',
        'Marriage outcomes',
      ],
      footer: 'We do not guarantee uninterrupted access to the Platform.',
    },
    {
      heading: '16. LIMITATION OF LIABILITY',
      body: 'To the maximum extent permitted by law, Vivah Australia and its directors, employees, contractors, affiliates, and partners shall not be liable for:',
      list: [
        'User misconduct',
        'Fraudulent behaviour',
        'Relationship disputes',
        'Family disputes',
        'Emotional distress',
        'Financial loss',
        'Reputation damage',
        'Marriage outcomes',
        'Engagement outcomes',
        'Personal decisions made by users',
      ],
      footer: 'Nothing in these Terms excludes rights that cannot be excluded under Australian Consumer Law.',
    },
    {
      heading: '17. INDEMNITY',
      body: 'You agree to indemnify and hold harmless Vivah Australia, its directors, employees, contractors, affiliates, and partners from any claims, damages, liabilities, losses, costs, or expenses arising from:',
      list: [
        'Your use of the Platform',
        'Your conduct',
        'Your content',
        'Your breach of these Terms',
      ],
    },
    {
      heading: '18. PRIVACY',
      body: 'Your use of the Platform is also governed by the Vivah Australia Privacy Policy.\nBy using the Platform, you consent to the collection, use, storage, and processing of information as described in that Policy.',
    },
    {
      heading: '19. CHANGES TO THESE TERMS',
      body: 'Vivah Australia may update these Terms from time to time.\nUpdated versions become effective upon publication on the Platform.\nContinued use of the Platform after updates are published constitutes acceptance of the revised Terms.',
    },
    {
      heading: '20. GOVERNING LAW & JURISDICTION',
      body: 'These Terms are governed by the laws of the Commonwealth of Australia and the State of Victoria.\nAny disputes arising in connection with these Terms shall be subject to the jurisdiction of the courts of Victoria, Australia.',
    },
    {
      heading: '21. REGISTERED MERCHANT ENTITY & CONTACT US',
      body: 'Vivah Australia is an Australian registered business entity.\n\n• Legal & Trading Entity: Vivah Australia\n• Australian Business Number (ABN): 85 700 086 808\n• Registered Trading Address: 3 Leafton Street, Truganina, VIC 3029, Australia\n• Support Phone: +61 479 134 385 (Monday to Friday, 9:00 AM – 5:00 PM AEST)\n• Support Email: support@vivahaustralia.com.au\n• General Enquiries: info@vivahaustralia.com.au\n• Website: www.vivahaustralia.com.au\n\nFor questions regarding purchases, subscriptions, or these Terms of Use, please contact our team.',
    },
  ],
};

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
};

export default function TermsPage() {
  const title = content.title;

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 lg:px-12 text-center">
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <FileText className="size-5 text-brand-gold" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            {content.eyebrow}
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/70 text-sm">Last updated: November 2026</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-12">
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-8">
              <p className="whitespace-pre-wrap">{content.intro}</p>
              {content.sections.map((section) => (
                <div key={section.heading} className="mt-8">
                  <h3 className="font-bold text-xl text-brand-charcoal mb-2">{section.heading}</h3>
                  {section.body && (
                    <p className="mt-1 whitespace-pre-wrap">{section.body}</p>
                  )}
                  {section.list && section.list.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 space-y-2">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="mt-3 whitespace-pre-wrap">{section.footer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Questions about these terms?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our Melbourne-based team is available Monday to Friday.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0"
            >
              Contact Us <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/terms" />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PolicyLinks({ current }: { current: string }) {
  const links = [
    ['Privacy Policy',        '/privacy'],
    ['Refund Policy',         '/refund-policy'],
    ['Delivery & Fulfillment','/delivery-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Be Safe Online',        '/be-safe-online'],
    ['Terms of Service',      '/terms'],
  ].filter(([, href]) => href !== current);

  return (
    <div className="mt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Related Policies</p>
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href!}
            className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
