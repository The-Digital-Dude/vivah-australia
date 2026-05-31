import Link from 'next/link';
import {
  getBlogs,
  getFeaturedProfiles,
  getPlans,
  getSuccessStories,
  getTestimonials,
  type FeaturedProfile,
  type PublicContentItem,
  type PublicPlan,
} from '@/lib/public-api';

const navItems = [
  ['Browse Matches', '#featured-profiles'],
  ['How It Works', '#how-it-works'],
  ['Verification', '#safety'],
  ['Plans', '#plans'],
  ['Stories', '#stories'],
  ['Help', '/pages/help-centre'],
] as const;

const trustBadges = [
  'Verified Profiles',
  'Private & Secure',
  'Australian Community',
  'Free to Start',
] as const;

const trustBarItems = [
  'Email & mobile verification',
  'Safe messaging controls',
  'Admin reviewed reports',
  'Private photo controls',
  'Premium search filters',
] as const;

const howItWorks = [
  ['Create Profile', 'Add the essentials first, then complete richer profile sections over time.'],
  ['Verify Yourself', 'Build confidence with email, mobile, identity, and document checks.'],
  ['Discover Matches', 'Browse serious profiles by city, community, values, and compatibility.'],
  ['Connect Safely', 'Use interests, privacy controls, reporting, and blocking before messaging.'],
] as const;

const discoveryFeatures = [
  'Advanced filters',
  'Compatible suggestions',
  'Recently active profiles',
  'Newly joined profiles',
  'Highly compatible profiles',
  'Verified-only search',
] as const;

const verificationSteps = [
  ['Basic', 'Email verified'],
  ['Silver', 'Mobile verified'],
  ['Gold', 'ID and address checked'],
  ['Platinum', 'Employment or visa reviewed'],
  ['Fully Verified', 'Facial and document confidence'],
] as const;

const communityLinks = [
  'Indian Matrimony in Melbourne',
  'Indian Matrimony in Sydney',
  'Indian Matrimony in Brisbane',
  'Punjabi Matrimony Australia',
  'Gujarati Matrimony Australia',
  'Tamil Matrimony Australia',
  'Hindu Matrimony Australia',
  'Muslim Matrimony Australia',
  'Sikh Matrimony Australia',
  'Second Marriage Matrimony Australia',
] as const;

const faqItems = [
  'Is Vivah Australia free?',
  'How does verification work?',
  'Who can see my photos?',
  'Can I block or report someone?',
  'How do premium memberships work?',
  'Can I cancel my subscription?',
] as const;

const footerLinks = [
  ['About Us', '/pages/about-us'],
  ['Privacy Policy', '/pages/privacy-policy'],
  ['Terms', '/pages/terms-and-conditions'],
  ['Safety', '/pages/safety-guidelines'],
  ['Contact', '/contact'],
] as const;

const fallbackProfiles: FeaturedProfile[] = [
  {
    displayId: 'VA100001',
    personal: { firstName: 'Amit', age: 34 },
    location: { city: 'Melbourne', state: 'VIC' },
    religion: { religion: 'Hindu' },
    employment: { occupation: 'Software Engineer' },
    verification: { level: 'GOLD' },
  },
  {
    displayId: 'VA100002',
    personal: { firstName: 'Priya', age: 31 },
    location: { city: 'Sydney', state: 'NSW' },
    religion: { religion: 'Hindu' },
    employment: { occupation: 'Accountant' },
    verification: { level: 'SILVER' },
  },
  {
    displayId: 'VA100003',
    personal: { firstName: 'Neha', age: 29 },
    location: { city: 'Brisbane', state: 'QLD' },
    religion: { religion: 'Sikh' },
    employment: { occupation: 'Doctor' },
    verification: { level: 'PLATINUM' },
  },
];

const fallbackPlans: PublicPlan[] = [
  {
    code: 'FREE',
    name: 'Free',
    priceCents: 0,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Create profile', 'Browse previews', 'Receive interests'],
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Send interests', 'Message accepted matches', 'Advanced filters'],
  },
  {
    code: 'GOLD',
    name: 'Gold',
    priceCents: 7900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Priority search visibility', 'Verification priority', 'Profile insights'],
  },
  {
    code: 'PLATINUM',
    name: 'Platinum',
    priceCents: 9900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Featured placement', 'Concierge review', 'Boost credits'],
  },
];

const fallbackStories: PublicContentItem[] = [
  {
    title: 'A Melbourne introduction that felt considered',
    body: 'Their families connected after both members completed verification and shared thoughtful expectations.',
  },
  {
    title: 'From Sydney search filters to a meaningful first call',
    body: 'Shared values, clear privacy controls, and profile prompts helped the conversation start naturally.',
  },
];

const fallbackTestimonials: PublicContentItem[] = [
  {
    name: 'Member family, VIC',
    quote: 'The platform felt respectful and modern, with enough privacy to move at our pace.',
  },
  {
    name: 'Verified member, NSW',
    quote:
      'Verification badges and profile detail made it easier to focus on serious introductions.',
  },
];

const fallbackBlogs: PublicContentItem[] = [
  {
    title: 'How to create a strong matrimonial profile',
    body: 'Lead with clarity, values, and expectations so compatible people can understand your intent.',
  },
  {
    title: 'Safety tips for online matchmaking',
    body: 'Use verification, private profile controls, and report tools before moving conversations elsewhere.',
  },
  {
    title: 'How verification works',
    body: 'Understand the trust ladder from basic account checks to stronger identity confidence.',
  },
];

export const metadata = {
  title: 'Vivah Australia | Trusted Indian Matrimonial Community',
  description:
    'Create a verified matrimonial profile, discover compatible Australian matches, and connect safely with serious relationship seekers.',
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function contentPreview(item: PublicContentItem, fallback: string) {
  const body = item.body ?? item.quote ?? fallback;
  return body.length > 150 ? `${body.slice(0, 147)}...` : body;
}

export default async function HomePage() {
  const [{ profiles }, { plans }, { stories }, { testimonials }, { blogs }] = await Promise.all([
    getFeaturedProfiles(),
    getPlans(),
    getSuccessStories(),
    getTestimonials(),
    getBlogs(3),
  ]);

  const profileItems = profiles.length ? profiles : fallbackProfiles;
  const planItems = plans.length ? plans : fallbackPlans;
  const storyItems = stories.length ? stories : fallbackStories;
  const testimonialItems = testimonials.length ? testimonials : fallbackTestimonials;
  const blogItems = blogs.length ? blogs : fallbackBlogs;

  return (
    <main className="bg-[#FFF8F1] text-[#232323]">
      <header className="sticky top-0 z-40 border-b border-[#7A1E3A]/10 bg-[#FFF8F1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-normal text-[#7A1E3A]">
            Vivah Australia
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#5E6470] lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-[#7A1E3A]">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-md px-4 py-2 text-sm font-semibold text-[#7A1E3A] transition hover:bg-[#FDECEF] sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-[#7A1E3A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#64172f]"
            >
              Join Free
            </Link>
            <details className="relative lg:hidden">
              <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-[#7A1E3A]/20 text-[#7A1E3A]">
                <span className="sr-only">Open menu</span>
                <span aria-hidden="true">Menu</span>
              </summary>
              <div className="absolute right-0 mt-3 w-64 rounded-md border border-[#7A1E3A]/10 bg-white p-3 shadow-xl">
                {navItems.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-[#5E6470] hover:bg-[#FDECEF] hover:text-[#7A1E3A]"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="mt-2 block rounded-md border border-[#7A1E3A]/15 px-3 py-2 text-sm font-semibold text-[#7A1E3A]"
                >
                  Login
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="relative min-h-[82vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=85"
          alt="Elegant wedding ceremony details"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1020]/85 via-[#3A1425]/70 to-[#7A1E3A]/20" />
        <div className="relative mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="pb-4 pt-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F6D88E]">
              Australian Indian matrimonial community
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
              Find a meaningful match within Australia&apos;s trusted Indian matrimonial community.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/88">
              Create your profile, verify your identity, discover compatible matches, and connect
              safely with people who are serious about marriage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-md bg-[#D6A84F] px-5 py-3 text-sm font-bold text-[#2C1707] shadow-lg shadow-black/20 transition hover:bg-[#edc164]"
              >
                Create Free Profile
              </Link>
              <Link
                href="#featured-profiles"
                className="rounded-md border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Matches
              </Link>
            </div>
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="shrink-0 rounded-md border border-white/25 bg-white/12 px-3 py-2 text-sm font-medium text-white backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <form
            action="/register"
            className="rounded-md border border-white/25 bg-white/94 p-5 shadow-2xl shadow-black/25 backdrop-blur md:p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C94F7C]">
              Start in under a minute
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#232323]">
              Create your first match view
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#232323]">
                I am
                <select
                  name="gender"
                  className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-[#5E6470]"
                >
                  <option>Woman</option>
                  <option>Man</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#232323]">
                Looking for
                <select
                  name="lookingFor"
                  className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-[#5E6470]"
                >
                  <option>Man</option>
                  <option>Woman</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#232323]">
                Age range
                <select
                  name="ageRange"
                  className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-[#5E6470]"
                >
                  <option>25 - 34</option>
                  <option>35 - 44</option>
                  <option>45 - 54</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#232323]">
                City
                <select
                  name="city"
                  className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-[#5E6470]"
                >
                  <option>Melbourne</option>
                  <option>Sydney</option>
                  <option>Brisbane</option>
                  <option>Perth</option>
                  <option>Adelaide</option>
                </select>
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-[#232323]">
              Religion, optional
              <select
                name="religion"
                className="h-11 rounded-md border border-[#7A1E3A]/20 px-3 text-[#5E6470]"
              >
                <option>Open to all</option>
                <option>Hindu</option>
                <option>Muslim</option>
                <option>Sikh</option>
                <option>Christian</option>
              </select>
            </label>
            <button className="mt-5 h-11 w-full rounded-md bg-[#7A1E3A] text-sm font-bold text-white transition hover:bg-[#64172f]">
              Create Free Profile
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-[#5E6470]">
              Free to start. Verification and privacy controls stay in your hands.
            </p>
          </form>
        </div>
      </section>

      <section className="border-y border-[#7A1E3A]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
          {trustBarItems.map((item) => (
            <div
              key={item}
              className="rounded-md bg-[#FFF8F1] px-4 py-3 text-sm font-semibold text-[#5E6470]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <SectionIntro
          eyebrow="How it works"
          title="A guided path from profile to trusted connection."
          body="The experience is designed to feel clear and manageable, with verification and privacy built into every step."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {howItWorks.map(([title, body], index) => (
            <article
              key={title}
              className="rounded-md border border-[#7A1E3A]/10 bg-white p-5 shadow-sm"
            >
              <span className="text-sm font-bold text-[#C94F7C]">0{index + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-[#232323]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5E6470]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="featured-profiles" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionIntro
            eyebrow="Featured profiles"
            title="Preview approved profiles while private details stay protected."
            body="Public visitors see limited profile details. Members can control photo, income, employer, and last-name visibility."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {profileItems.slice(0, 6).map((profile) => (
              <ProfileCard key={profile.displayId} profile={profile} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionIntro
            eyebrow="Smart discovery"
            title="Serious matches, not endless swiping."
            body="Search-led discovery helps members compare values, location, community, verification, and compatibility signals."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {discoveryFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-md border border-[#7A1E3A]/10 bg-white px-4 py-3 text-sm font-semibold text-[#5E6470]"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md bg-[#232323] p-5 text-white shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-[#F6D88E]">Match preview</p>
              <h3 className="mt-1 text-2xl font-semibold">Near you, verified, compatible</h3>
            </div>
            <span className="rounded-md bg-[#1F9D68] px-3 py-1 text-xs font-bold">Live</span>
          </div>
          <div className="mt-5 grid gap-3">
            {['Verified only', 'Melbourne + Sydney', 'Age 28 - 38', 'Same mother tongue'].map(
              (filter) => (
                <div
                  key={filter}
                  className="flex items-center justify-between rounded-md bg-white/10 px-4 py-3 text-sm"
                >
                  <span>{filter}</span>
                  <span className="text-[#F6D88E]">Applied</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="safety" className="bg-[#2A1722] py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionIntro
            eyebrow="Verification & safety"
            title="Trust signals appear early, clearly, and without exposing private data."
            body="Members can build confidence through a verification ladder while reporting, blocking, moderation, and privacy controls protect the experience."
            dark
          />
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {verificationSteps.map(([level, detail]) => (
              <article key={level} className="rounded-md border border-white/15 bg-white/8 p-4">
                <p className="text-sm font-bold text-[#F6D88E]">{level}</p>
                <p className="mt-3 text-sm leading-6 text-white/78">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <SectionIntro
          eyebrow="Membership plans"
          title="Start free, upgrade when connection tools become valuable."
          body="The plan experience should be transparent: clear limits, no hidden renewal language, and no forced plan choice before profile completion."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-4">
          {planItems.slice(0, 4).map((plan) => (
            <article
              key={plan.code}
              className="rounded-md border border-[#7A1E3A]/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-[#7A1E3A]">{plan.name}</h3>
              <p className="mt-3 text-3xl font-semibold">{money(plan.priceCents, plan.currency)}</p>
              <p className="text-sm text-[#5E6470]">per {plan.interval.toLowerCase()}</p>
              <ul className="mt-5 grid gap-2 text-sm leading-6 text-[#5E6470]">
                {plan.features.slice(0, 5).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-5 inline-flex w-full justify-center rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-bold text-[#7A1E3A] transition hover:bg-[#FDECEF]"
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="stories" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <SectionIntro
              eyebrow="Success stories"
              title="Real outcomes reduce hesitation."
              body="Published stories and testimonials help families and members see that serious, respectful introductions are the core product."
            />
            <div className="mt-8 grid gap-4">
              {storyItems.slice(0, 3).map((story) => (
                <article
                  key={story.slug ?? story.title}
                  className="rounded-md border border-[#7A1E3A]/10 bg-[#FFF8F1] p-5"
                >
                  <h3 className="text-lg font-semibold">{story.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5E6470]">
                    {contentPreview(story, 'Read more about this Vivah Australia success story.')}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <h2 className="text-2xl font-semibold">Member confidence</h2>
            {testimonialItems.slice(0, 3).map((item) => (
              <blockquote
                key={item.name ?? item.quote}
                className="rounded-md border border-[#7A1E3A]/10 p-5"
              >
                <p className="leading-7 text-[#5E6470]">
                  {contentPreview(item, 'A thoughtful matrimonial experience.')}
                </p>
                <footer className="mt-3 text-sm font-bold text-[#7A1E3A]">
                  {item.name ?? 'Vivah Australia member'}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <SectionIntro
          eyebrow="Community landing paths"
          title="SEO-friendly browsing for Australian families and communities."
          body="City, religion, community, and language entry points support discovery without overcrowding the homepage."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {communityLinks.map((item) => (
            <Link
              key={item}
              href="/register"
              className="rounded-md border border-[#7A1E3A]/10 bg-white px-4 py-3 text-sm font-semibold text-[#5E6470] transition hover:border-[#C94F7C] hover:text-[#7A1E3A]"
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#FDECEF] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <SectionIntro
              eyebrow="Guidance"
              title="Helpful content for safer, stronger profiles."
              body="Blog highlights should educate members about profile quality, respectful conversations, verification, and safety."
            />
            <div className="mt-8 grid gap-4">
              {blogItems.slice(0, 3).map((blog) => (
                <article
                  key={blog.slug ?? blog.title}
                  className="border-b border-[#7A1E3A]/15 pb-4"
                >
                  <h3 className="font-semibold">{blog.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5E6470]">
                    {contentPreview(blog, 'Relationship guidance for Australian members.')}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">FAQ preview</h2>
            <div className="mt-6 grid gap-3">
              {faqItems.map((question) => (
                <div
                  key={question}
                  className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#5E6470]"
                >
                  {question}
                </div>
              ))}
            </div>
            <Link
              href="/pages/faq"
              className="mt-6 inline-flex rounded-md bg-[#7A1E3A] px-5 py-3 text-sm font-bold text-white"
            >
              Visit FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#232323] px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F6D88E]">
              Start safely
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
              Start your journey with a safe, verified matrimonial profile.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Join free, complete your profile at your pace, and use verification and privacy
              controls before connecting.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-md bg-[#D6A84F] px-5 py-3 text-sm font-bold text-[#2C1707]"
            >
              Create Free Profile
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/40 px-5 py-3 text-sm font-bold"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#FFF8F1] px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 text-sm text-[#5E6470] md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-lg font-semibold text-[#7A1E3A]">Vivah Australia</p>
            <p className="mt-2 max-w-xl leading-6">
              Premium matrimonial matchmaking for serious Australian singles and families.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {footerLinks.map(([label, href]) => (
              <Link key={href} href={href} className="font-semibold hover:text-[#7A1E3A]">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  dark = false,
}: Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  dark?: boolean;
}>) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-sm font-bold uppercase tracking-[0.18em] ${dark ? 'text-[#F6D88E]' : 'text-[#C94F7C]'}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-semibold tracking-normal md:text-4xl ${dark ? 'text-white' : 'text-[#232323]'}`}
      >
        {title}
      </h2>
      <p className={`mt-4 leading-7 ${dark ? 'text-white/72' : 'text-[#5E6470]'}`}>{body}</p>
    </div>
  );
}

function ProfileCard({ profile }: Readonly<{ profile: FeaturedProfile }>) {
  const name = profile.personal?.firstName ?? 'Member';
  const city = [profile.location?.city, profile.location?.state].filter(Boolean).join(', ');
  const summary = [
    profile.personal?.age ? `${profile.personal.age}` : undefined,
    profile.employment?.occupation,
    profile.religion?.religion,
  ].filter(Boolean);
  const href = profile._id ? `/profiles/${profile._id}` : '/register';

  return (
    <article className="overflow-hidden rounded-md border border-[#7A1E3A]/10 bg-[#FFF8F1] shadow-sm">
      <div className="relative h-44 bg-gradient-to-br from-[#7A1E3A] via-[#C94F7C] to-[#D6A84F]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.35),transparent_32%)]" />
        <div className="absolute bottom-4 left-4 flex size-16 items-center justify-center rounded-full border border-white/50 bg-white/90 text-2xl font-bold text-[#7A1E3A]">
          {name.slice(0, 1)}
        </div>
        <span className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-[#1F9D68]">
          {profile.verification?.level ?? 'VERIFIED'}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="mt-1 text-sm text-[#5E6470]">{city || 'Australia'}</p>
        <p className="mt-3 text-sm leading-6 text-[#5E6470]">{summary.join(' | ')}</p>
        <div className="mt-5 flex gap-2">
          <Link
            href={href}
            className="rounded-md bg-[#7A1E3A] px-4 py-2 text-sm font-bold text-white"
          >
            View Profile
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-[#7A1E3A]/20 px-4 py-2 text-sm font-bold text-[#7A1E3A]"
          >
            Join to Connect
          </Link>
        </div>
      </div>
    </article>
  );
}
