import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { Lock, ArrowRight } from 'lucide-react';

const content = {
  title: 'Privacy Policy',
  description: 'Review the privacy policy and data protection practices of Vivah Australia.',
  eyebrow: 'Data Protection',
  intro: 'Last Updated: 1 July 2026\n\nAt Vivah Australia ("Vivah Australia", "we", "our", or "us"), we respect your privacy and are committed to protecting your personal information.\nThis Privacy Policy explains how we collect, use, store, disclose, and protect your personal information when you access or use our website, mobile applications, services, and related features (collectively referred to as the "Platform").\nBy creating an account or using Vivah Australia, you agree to the practices described in this Privacy Policy.',
  sections: [
    {
      heading: '1. WHO WE ARE',
      body: 'Vivah Australia is an online matrimonial platform designed to help individuals and families connect with potential marriage and relationship prospects.\nAs part of providing our services, we collect and process personal information to facilitate profile creation, matching, communication, identity verification, customer support, and platform security.',
    },
    {
      heading: '2. INFORMATION WE COLLECT',
      body: 'We collect information that you provide directly to us, information generated through your use of the Platform, and information collected from third-party service providers where permitted by law.\n\nAccount Information\nWhen you register an account, we may collect:',
      list: [
        'Full name',
        'Gender',
        'Date of birth',
        'Mobile number',
        'Email address',
        'Residential location',
        'State and country',
        'Username',
        'Login credentials',
      ],
    },
    {
      heading: 'Profile Information',
      body: 'To help users find compatible matches, you may choose to provide:',
      list: [
        'Profile photographs',
        'Religion',
        'Cultural background',
        'Community information',
        'Languages spoken',
        'Education details',
        'Occupation',
        'Employment information',
        'Lifestyle preferences',
        'Relationship preferences',
        'Family information',
        'Interests and hobbies',
        'Personal biography',
      ],
      footer: 'You control what profile information you choose to provide.',
    },
    {
      heading: 'Verification Information',
      body: 'Where identity verification services are offered, we may collect:',
      list: [
        'Driver Licence',
        'Passport',
        'Government-issued identification',
        'Proof of residency',
        'Employment verification documents',
        'Other supporting verification documents',
      ],
      footer: 'Verification information is collected solely for trust, safety, fraud prevention, and account verification purposes.',
    },
    {
      heading: 'Communications',
      body: 'We may collect information relating to:',
      list: [
        'Messages sent through the Platform',
        'Customer support enquiries',
        'Feedback submissions',
        'Complaint reports',
        'Safety reports',
        'Communication preferences',
      ],
    },
    {
      heading: 'Technical Information',
      body: 'When you use the Platform, we may automatically collect:',
      list: [
        'IP address',
        'Device type',
        'Browser type',
        'Operating system',
        'Login activity',
        'Usage information',
        'Session information',
        'Device identifiers',
        'Error logs',
        'Security logs',
      ],
      footer: 'This information helps us improve performance and maintain security.',
    },
    {
      heading: 'Payment Information',
      body: 'If you purchase subscriptions or premium services, payment information may be collected through secure third-party payment providers.\nWe may collect:',
      list: [
        'Transaction references',
        'Payment status',
        'Subscription details',
        'Billing information',
      ],
      footer: 'Vivah Australia does not generally store complete credit card information on its own systems.',
    },
    {
      heading: '3. HOW WE USE YOUR INFORMATION',
      body: 'We may use your information for the following purposes:\n\nTo Provide Our Services\nIncluding:',
      list: [
        'Creating user accounts',
        'Displaying profiles',
        'Facilitating introductions',
        'Enabling communications',
        'Providing support services',
        'Managing subscriptions',
      ],
    },
    {
      heading: 'To Improve The Platform',
      body: 'Including:',
      list: [
        'Improving functionality',
        'Analysing usage patterns',
        'Developing new features',
        'Enhancing user experience',
      ],
    },
    {
      heading: 'To Maintain Safety',
      body: 'Including:',
      list: [
        'Identity verification',
        'Fraud prevention',
        'Security monitoring',
        'Investigating complaints',
        'Enforcing our policies',
      ],
    },
    {
      heading: 'To Communicate With You',
      body: 'Including:',
      list: [
        'Account notifications',
        'Verification updates',
        'Security alerts',
        'Customer support responses',
        'Platform announcements',
      ],
    },
    {
      heading: 'Marketing Communications',
      body: 'Where permitted by law, we may send:',
      list: [
        'Product updates',
        'Service announcements',
        'Promotional offers',
        'Marketing communications',
      ],
      footer: 'You may opt out of marketing communications at any time.',
    },
    {
      heading: '4. PROFILE VISIBILITY',
      body: 'Vivah Australia is designed to help users discover potential relationship matches.\nAccordingly, certain profile information may be visible to other users, including:',
      list: [
        'First name',
        'Age',
        'General location',
        'Profile photographs',
        'Education information',
        'Occupation',
        'Interests',
        'Relationship preferences',
      ],
      footer: 'Users are encouraged to carefully consider what information they choose to share publicly.\nCertain information remains private and accessible only to authorised Vivah Australia personnel.',
    },
    {
      heading: '5. WHO WE SHARE INFORMATION WITH',
      body: 'We do not sell personal information to third parties.\nWe may share information with:\n\nService Providers\nIncluding providers of:',
      list: [
        'Website hosting',
        'Cloud storage',
        'Payment processing',
        'Identity verification',
        'Customer support',
        'Analytics services',
      ],
      footer: 'These providers are required to handle information appropriately and only for authorised purposes.',
    },
    {
      heading: 'Legal and Regulatory Authorities',
      body: 'Where required by law, court order, legal process, or regulatory obligation, we may disclose information to:',
      list: [
        'Courts',
        'Law enforcement agencies',
        'Government authorities',
        'Regulators',
      ],
    },
    {
      heading: 'Business Transactions',
      body: 'If Vivah Australia undergoes:',
      list: [
        'A merger',
        'Acquisition',
        'Corporate restructuring',
        'Sale of assets',
      ],
      footer: 'personal information may form part of the transferred business assets.',
    },
    {
      heading: '6. COOKIES AND TRACKING TECHNOLOGIES',
      body: 'Vivah Australia may use cookies and similar technologies to:',
      list: [
        'Maintain login sessions',
        'Remember preferences',
        'Improve performance',
        'Measure website usage',
        'Enhance security',
      ],
      footer: 'Cookies help us provide a better user experience.\nUsers may manage cookie settings through their browser preferences.\nDisabling cookies may affect certain Platform functionality.',
    },
    {
      heading: '7. DATA SECURITY',
      body: 'Vivah Australia takes reasonable measures to protect personal information from:',
      list: [
        'Unauthorised access',
        'Misuse',
        'Loss',
        'Alteration',
        'Disclosure',
      ],
      footer: 'Security measures may include:\n• Encryption technologies\n• Secure hosting environments\n• Access controls\n• Authentication systems\n• Security monitoring\n\nWhile we take reasonable precautions, no internet-based system can guarantee absolute security.',
    },
    {
      heading: '8. IDENTITY DOCUMENTS',
      body: 'Where verification documents are collected:',
      list: [
        'Documents are stored securely',
        'Access is restricted to authorised personnel',
        'Documents are used only for verification purposes',
        'Documents are not publicly displayed',
      ],
      footer: 'Verification information may be retained for fraud prevention, legal compliance, security, and trust and safety purposes.',
    },
    {
      heading: '9. DATA RETENTION',
      body: 'We retain personal information only for as long as reasonably necessary to:',
      list: [
        'Provide our services',
        'Maintain platform integrity',
        'Resolve disputes',
        'Prevent fraud',
        'Comply with legal obligations',
        'Enforce our agreements',
      ],
      footer: 'Retention periods may vary depending on the nature of the information and legal requirements.',
    },
    {
      heading: '10. ACCOUNT DELETION',
      body: 'Users may request account deletion at any time.\nUpon receiving a valid request, we may:',
      list: [
        'Deactivate the account',
        'Remove public profile visibility',
        'Delete information where appropriate',
      ],
      footer: 'Certain information may be retained where necessary for:\n• Legal compliance\n• Fraud prevention\n• Security investigations\n• Business record keeping',
    },
    {
      heading: '11. ACCESS AND CORRECTION',
      body: 'Users may request access to personal information held by Vivah Australia.\nUsers may also request correction of inaccurate, incomplete, or outdated information.\nWe may require identity verification before processing such requests.',
    },
    {
      heading: '12. INTERNATIONAL DATA STORAGE',
      body: 'Some information may be processed or stored using service providers located outside Australia.\nWhere overseas processing occurs, Vivah Australia will take reasonable steps to ensure information receives appropriate protection.\nHowever, privacy laws in other jurisdictions may differ from Australian privacy laws.',
    },
    {
      heading: '13. CHILDREN\'S PRIVACY',
      body: 'Vivah Australia is intended only for individuals aged 18 years and over.\nWe do not knowingly collect personal information from children.\nAccounts identified as belonging to individuals under 18 may be removed.',
    },
    {
      heading: '14. THIRD-PARTY WEBSITES',
      body: 'The Platform may contain links to third-party websites or services.\nVivah Australia is not responsible for:',
      list: [
        'Third-party content',
        'Third-party privacy practices',
        'Third-party security measures',
      ],
      footer: 'Users should review the privacy policies of any third-party services they access.',
    },
    {
      heading: '15. YOUR PRIVACY RIGHTS',
      body: 'Subject to applicable law, users may have rights to:',
      list: [
        'Access personal information',
        'Correct personal information',
        'Request deletion of information',
        'Withdraw certain consents',
        'Opt out of marketing communications',
      ],
      footer: 'Requests may be submitted using the contact details below.',
    },
    {
      heading: '16. CHANGES TO THIS PRIVACY POLICY',
      body: 'Vivah Australia may update this Privacy Policy from time to time.\nUpdated versions become effective upon publication on the Platform.\nContinued use of the Platform after publication of updates constitutes acceptance of the revised Privacy Policy.',
    },
    {
      heading: '17. CONTACT US & REGISTERED ENTITY',
      body: 'Vivah Australia is an Australian registered business entity (ABN: 85 700 086 808).\n\nRegistered Trading Address: 3 Leafton Street, Truganina, VIC 3029, Australia\nPrivacy & Data Protection Officer: privacy@vivahaustralia.com.au\nGeneral Support: support@vivahaustralia.com.au\nPhone Support: +61 479 134 385 (Monday to Friday, 9:00 AM – 5:00 PM AEST)\nWebsite: www.vivahaustralia.com.au\n\nIf you have any questions, concerns, complaints, or requests relating to privacy or personal information, please contact our privacy officer using the details above.',
    },
    {
      heading: '18. ESCALATING A COMPLAINT',
      body: 'If you are not satisfied with the handling of your complaint by Vivah Australia, you have the right to escalate the matter.\nYou may refer your complaint to the Office of the Australian Information Commissioner (OAIC).\nFor further information or to lodge a complaint, you can visit their website at https://www.oaic.gov.au or contact them directly on 1300 363 992.',
      footer: 'We encourage you to engage with us directly in the first instance, as we are committed to resolving your concerns swiftly and fairly.',
    },
  ],
};

/** Matches web addresses and Australian 13/1300/1800 service numbers. */
const LINKABLE = /(https?:\/\/[^\s]+[^\s.,)])|(1[38]00(?:\s\d{3}){2})/g;

/** Turns URLs and phone numbers inside policy copy into anchors. */
function linkify(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINKABLE)) {
    const value = match[0];
    const start = match.index;
    const isUrl = Boolean(match[1]);

    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <a
        key={start}
        href={isUrl ? value : `tel:${value.replace(/\s/g, '')}`}
        {...(isUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-semibold text-brand-maroon underline underline-offset-2 hover:text-brand-gold transition"
      >
        {value}
      </a>
    );
    cursor = start + value.length;
  }

  if (nodes.length === 0) return text;
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
};

export default function PrivacyPage() {
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
            <Lock className="size-5 text-brand-gold" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            {content.eyebrow}
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
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
                    <p className="mt-1 whitespace-pre-wrap">{linkify(section.body)}</p>
                  )}
                  {section.list && section.list.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 space-y-2">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="mt-3 whitespace-pre-wrap">{linkify(section.footer)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Questions about this policy?</p>
              <p className="text-xs text-gray-500 mt-0.5">Our team responds within 5 business days.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0"
            >
              Contact Us <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/privacy" />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PolicyLinks({ current }: { current: string }) {
  const links = [
    ['Terms of Service',      '/terms'],
    ['Refund Policy',         '/refund-policy'],
    ['Delivery & Fulfillment','/delivery-policy'],
    ['Community Guidelines',  '/community-guidelines'],
    ['Privacy Policy',        '/privacy'],
    ['Be Safe Online',        '/be-safe-online'],
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
