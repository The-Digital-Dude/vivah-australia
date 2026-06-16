import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/app/components';
import { getCmsPage } from '@/lib/public-api';
import { Users, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const slug = 'community-guidelines';
const fallback = {
  title: 'Community Guidelines',
  description: 'Understand the expectations of respect, trust, and cultural integrity in Vivah Australia.',
  eyebrow: 'Community Values',
  body: `Vivah Australia is built on respect, cultural heritage, and trust. Our community exists to help serious individuals and families find meaningful, lasting matrimonial matches.

To preserve this community for everyone, all members are expected to follow these guidelines.

1. Be Honest and Accurate
Provide true, complete, and up-to-date details regarding your education, occupation, income, family background, and marital status. Misrepresentation of any kind — including using old or edited photos — is a serious violation and may result in permanent account removal.

2. Maintain Mutual Respect
South Asian communities thrive on family relationships and mutual politeness. Treat every member, family representative, and member of our support team with dignity and respect. Disrespectful, demeaning, or discriminatory behaviour toward members based on caste, religion, region, skin tone, or any other characteristic will not be tolerated.

3. Serious Matrimonial Intent Only
This platform is dedicated purely to matrimonial matching. Do not use Vivah Australia for casual dating, hookups, advertising services, or any purpose other than finding a life partner. Members who misuse the platform will be removed.

4. Protect Privacy
Do not request, share, or attempt to gather other members' private information — including home address, workplace location, or financial details — without their explicit consent. Respect photo privacy settings and do not screenshot or redistribute profile images.

5. No Commercial Activity
Solicitation, spam, advertising, promoting external services, or any commercial activity within the platform is strictly prohibited.

6. Safe Communication
All early communication should remain within Vivah's in-app messaging system. If you move conversations to external channels, exercise caution. Never send money or gifts to someone you have not met in person.

7. Report Concerns Promptly
If you encounter a profile or conversation that violates these guidelines, report it immediately using the in-app report tool. Our moderation team reviews all reports within 24 hours.

Consequences of Violations
Depending on the severity, violations may result in a warning, temporary suspension, or permanent account removal. In cases involving fraud or threats, we may refer matters to relevant Australian authorities.

Contact
To report a concern or ask about these guidelines, contact support@vivahaustralia.com.au.`,
};

const GUIDELINES_SUMMARY = [
  { rule: 'Be honest and accurate',    ok: true  },
  { rule: 'Respect every member',       ok: true  },
  { rule: 'Serious intent only',        ok: true  },
  { rule: 'Protect member privacy',     ok: true  },
  { rule: 'Use in-app messaging early', ok: true  },
  { rule: 'Report concerns promptly',   ok: true  },
  { rule: 'Commercial solicitation',    ok: false },
  { rule: 'Misrepresentation or fraud', ok: false },
  { rule: 'Disrespectful behaviour',    ok: false },
  { rule: 'Sharing private photos',     ok: false },
];

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? fallback.title,
    description: page?.seoDescription ?? fallback.description,
  };
}

export default async function CommunityGuidelinesPage() {
  const { page } = await getCmsPage(slug);
  const title = page?.title ?? fallback.title;
  const body = page?.body ?? fallback.body;

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 lg:px-12 text-center">
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Users className="size-5 text-brand-gold" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            {fallback.eyebrow}
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/50 text-sm">Last reviewed: June 2025</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* Quick summary grid */}
      <section className="py-12 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {GUIDELINES_SUMMARY.map(({ rule, ok }) => (
              <div
                key={rule}
                className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-sm font-semibold ${
                  ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {ok
                  ? <CheckCircle className="size-4 shrink-0 text-emerald-600" />
                  : <XCircle className="size-4 shrink-0 text-red-500" />
                }
                {ok ? '' : 'No '}{rule}
              </div>
            ))}
          </div>

          {/* Full policy text */}
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-12">
            {renderPolicyBody(body)}
          </div>

          <div className="mt-8 rounded-[20px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-charcoal text-sm">Witnessed a guideline violation?</p>
              <p className="text-xs text-gray-500 mt-0.5">Use the in-app report tool or contact our moderation team.</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline shrink-0">
              Report a Concern <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <PolicyLinks current="/community-guidelines" />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function renderPolicyBody(body: string) {
  const lines = body.split('\n');
  return (
    <div className="whitespace-pre-line text-gray-700 leading-8">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const prevTrimmed = i > 0 ? lines[i - 1]?.trim() ?? null : null;
        const isHeading =
          trimmed !== '' &&
          (prevTrimmed === null || prevTrimmed === '') &&
          !trimmed.endsWith('.') &&
          !trimmed.startsWith('-') &&
          trimmed.length < 70;
        const displayLine = isHeading ? line.replace(/^\d+\.\s+/, '') : line;
        return isHeading ? (
          <span key={i} className="font-bold text-brand-charcoal">{displayLine}{'\n'}</span>
        ) : (
          <span key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</span>
        );
      })}
    </div>
  );
}

function PolicyLinks({ current }: { current: string }) {
  const links = [
    ['Privacy Policy',        '/privacy'],
    ['Terms of Service',      '/terms'],
    ['Refund Policy',         '/refund-policy'],
    ['Verification Policy',   '/verification-policy'],
    ['Community Guidelines',  '/community-guidelines'],
  ].filter(([, href]) => href !== current);

  return (
    <div className="mt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Related Policies</p>
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <Link key={href} href={href!} className="rounded-full border border-brand-maroon/20 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon hover:text-white transition">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
