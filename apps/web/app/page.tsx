import Link from 'next/link';
import {
  getBlogs,
  getFeaturedProfiles,
  getPlans,
  getSuccessStories,
  getTestimonials,
} from '@/lib/public-api';

const fallbackProfiles = [
  ['Amit', 'Melbourne', 'Software Engineer'],
  ['Priya', 'Sydney', 'Accountant'],
  ['Neha', 'Brisbane', 'Doctor'],
];

const staticPages = [
  ['About', '/pages/about-us'],
  ['Safety', '/pages/safety-guidelines'],
  ['Help', '/pages/help-centre'],
  ['FAQ', '/pages/faq'],
] as const;

export const metadata = {
  title: 'Vivah Australia | Premium Matrimonial Matchmaking',
  description:
    'A responsive matrimonial and matchmaking platform for Australian singles and families, with verification, privacy controls, and membership plans.',
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function HomePage() {
  const [{ profiles }, { plans }, { stories }, { testimonials }, { blogs }] = await Promise.all([
    getFeaturedProfiles(),
    getPlans(),
    getSuccessStories(),
    getTestimonials(),
    getBlogs(3),
  ]);
  const profileItems = profiles.length ? profiles : [];

  return (
    <main className="bg-white text-neutral-950">
      <section className="relative min-h-[88vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80"
          alt="Wedding ceremony details"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-20 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-100">
            Australian matrimonial matchmaking
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
            Vivah Australia
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            A premium platform for serious introductions, verified profiles, and private family-led
            matchmaking across Australia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-md bg-red-700 px-5 py-3 text-sm font-semibold"
            >
              Create profile
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/70 px-5 py-3 text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold">Featured profiles</h2>
            <p className="mt-2 text-neutral-600">Approved visible profiles available to browse.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(profileItems.length ? profileItems : fallbackProfiles).map((profile) => {
            const isArray = Array.isArray(profile);
            const name = isArray ? profile[0] : profile.personal?.firstName;
            const city = isArray ? profile[1] : profile.location?.city;
            const role = isArray ? profile[2] : profile.employment?.occupation;

            return (
              <article key={`${name}-${city}`} className="rounded-lg border border-neutral-200 p-5">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-lg font-semibold text-red-800">
                  {name?.slice(0, 1) ?? 'V'}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {[city, role].filter(Boolean).join(' | ')}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {['Create your profile', 'Verify and refine', 'Connect privately'].map((item, index) => (
            <div key={item}>
              <span className="text-sm font-semibold text-red-700">0{index + 1}</span>
              <h2 className="mt-3 text-2xl font-semibold">{item}</h2>
              <p className="mt-3 leading-7 text-neutral-600">
                Build a detailed profile, control sensitive fields, and move forward only with
                matches that feel aligned.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold">Membership plans</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(plans.length
            ? plans
            : [
                {
                  code: 'FREE',
                  name: 'Free',
                  priceCents: 0,
                  currency: 'AUD',
                  interval: 'MONTH',
                  features: ['Create profile', 'Browse profiles'],
                },
                {
                  code: 'PREMIUM',
                  name: 'Premium',
                  priceCents: 4900,
                  currency: 'AUD',
                  interval: 'MONTH',
                  features: ['Send interests', 'Message matches'],
                },
                {
                  code: 'PLATINUM',
                  name: 'Platinum',
                  priceCents: 9900,
                  currency: 'AUD',
                  interval: 'MONTH',
                  features: ['Priority visibility', 'Matchmaking review'],
                },
              ]
          ).map((plan) => (
            <article key={plan.code} className="rounded-lg border border-neutral-200 p-5">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-semibold">{money(plan.priceCents, plan.currency)}</p>
              <p className="text-sm text-neutral-500">per {plan.interval.toLowerCase()}</p>
              <ul className="mt-5 grid gap-2 text-sm text-neutral-700">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Safety and verification</h2>
            <p className="mt-4 leading-7 text-white/75">
              Manual review, verification badges, reporting, blocking, and private media controls
              are designed into the platform from the start.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/85">
            {[
              'Profile moderation',
              'Verification workflow',
              'Signed private media',
              'Admin audit logs',
            ].map((item) => (
              <div key={item} className="border-b border-white/15 pb-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold">Success stories</h2>
          <div className="mt-6 grid gap-4">
            {(stories.length
              ? stories
              : [
                  {
                    title: 'New stories coming soon',
                    body: 'Real member stories will appear here after publication.',
                  },
                ]
            ).map((story) => (
              <article key={story.slug ?? story.title} className="border-b border-neutral-200 pb-4">
                <h3 className="font-semibold">{story.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{story.body}</p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-semibold">Testimonials</h2>
          <div className="mt-6 grid gap-4">
            {(testimonials.length
              ? testimonials
              : [
                  {
                    name: 'Vivah Australia',
                    quote: 'Testimonials will appear here after CMS publishing.',
                  },
                ]
            ).map((item) => (
              <blockquote key={item.name} className="rounded-lg border border-neutral-200 p-5">
                <p className="leading-7 text-neutral-700">{item.quote}</p>
                <footer className="mt-3 text-sm font-semibold">{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Blog highlights</h2>
            <div className="mt-6 grid gap-4">
              {(blogs.length
                ? blogs
                : [
                    {
                      title: 'Relationship guidance for Australian families',
                      body: 'CMS blog posts will appear here after publication.',
                    },
                  ]
              ).map((blog) => (
                <article key={blog.slug ?? blog.title} className="border-b border-neutral-200 pb-4">
                  <h3 className="font-semibold">{blog.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{blog.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold">FAQ preview</h2>
            <div className="mt-6 grid gap-3 text-sm text-neutral-700">
              <p>How do profile approvals work?</p>
              <p>Can members hide sensitive fields?</p>
              <p>Which verification levels are available?</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {staticPages.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold">Contact information</h2>
        <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
          For support, partnerships, or membership questions, contact the Vivah Australia team.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Contact us
        </Link>
      </section>
    </main>
  );
}
