import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { getBlogs } from '@/lib/public-api';
import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog & Advice | Vivah Australia',
  description:
    'Matrimonial advice, relationship guides, safety tips, and South Asian community updates on Vivah Australia.',
};

const FALLBACK_BLOGS = [
  {
    title: 'How to Create a Strong Matrimonial Profile',
    body: 'Lead with clarity, values, and expectations so compatible people can understand your intent. Share your education, career journey, and family background with authenticity.',
    slug: 'how-to-create-a-strong-matrimonial-profile',
    tag: 'Profile Tips',
    readTime: '5 min read',
    featured: true,
  },
  {
    title: 'Safety Tips for Online Matchmaking',
    body: 'Use verification, private profile controls, and report tools before moving conversations elsewhere. Protect your personal details and trust your instincts.',
    slug: 'safety-tips-for-online-matchmaking',
    tag: 'Safety',
    readTime: '4 min read',
    featured: false,
  },
  {
    title: 'How Verification Works on Vivah Australia',
    body: 'Understand the trust ladder from basic account checks to stronger identity confidence. Learn what documents are reviewed and how badges are awarded.',
    slug: 'how-verification-works',
    tag: 'Verification',
    readTime: '3 min read',
    featured: false,
  },
  {
    title: 'Navigating the Indian Matrimonial Process in Australia',
    body: 'Balancing family expectations with modern dating norms is a unique challenge for the diaspora. Here is how Vivah helps bridge that gap while keeping both sides happy.',
    slug: 'indian-matrimonial-process-australia',
    tag: 'Community',
    readTime: '6 min read',
    featured: false,
  },
  {
    title: 'How to Write a Memorable First Message',
    body: "First impressions matter. We've analysed thousands of conversations on Vivah to understand what makes someone reply — and what makes them scroll past.",
    slug: 'how-to-write-a-first-message',
    tag: 'Communication',
    readTime: '4 min read',
    featured: false,
  },
  {
    title: "Understanding Your Partner's Love Language",
    body: "Compatibility isn't just about background and religion. Understanding how your potential partner gives and receives love can transform an introduction into a lasting partnership.",
    slug: 'understanding-love-languages',
    tag: 'Relationships',
    readTime: '5 min read',
    featured: false,
  },
];

const TAG_COLORS: Record<string, string> = {
  'Profile Tips': 'bg-amber-100 text-amber-800',
  Safety: 'bg-red-100 text-red-800',
  Verification: 'bg-blue-100 text-blue-800',
  Community: 'bg-emerald-100 text-emerald-800',
  Communication: 'bg-purple-100 text-purple-800',
  Relationships: 'bg-rose-100 text-rose-800',
  Advice: 'bg-orange-100 text-orange-800',
};

export default async function BlogPage() {
  const { blogs } = await getBlogs(12);
  const rawItems = blogs.length ? blogs : FALLBACK_BLOGS;

  const blogItems = rawItems.map((b, i) => ({
    title: b.title,
    body: b.body ?? '',
    slug: b.slug ?? `blog-${i}`,
    tag: (b as { tag?: string }).tag ?? 'Advice',
    readTime: (b as { readTime?: string }).readTime ?? '4 min read',
    featured: i === 0,
  }));

  const [featured, ...rest] = blogItems;

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-brand-gold mb-5">
            Vivah Australia Insights
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Advice for Your{' '}
            <span className="text-brand-gold">Matrimonial Journey</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Profile tips, relationship guides, safety advice, and community stories — written for
            the Indian diaspora navigating matchmaking in Australia.
          </p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z" fill="#FFF9F5" />
          </svg>
        </div>
      </section>

      {/* ── Featured Article ──────────────────────────────────────────── */}
      {featured && (
        <section className="py-16 px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-6">
              Latest Article
            </p>
            <Link href={`/blog/${featured.slug}`} className="group block">
              <div className="rounded-[32px] bg-white border border-gray-100 overflow-hidden shadow-sm grid lg:grid-cols-2 gap-0 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-brand-maroon to-[#6B0830] p-10 sm:p-14 flex flex-col justify-between min-h-[320px]">
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 ${TAG_COLORS[featured.tag] ?? 'bg-amber-100 text-amber-800'}`}>
                      {featured.tag}
                    </span>
                    <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-white leading-snug mb-4 group-hover:text-brand-gold transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                      {featured.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-gold">
                      Read Article <ArrowRight className="size-4" />
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <Clock className="size-3" /> {featured.readTime}
                    </span>
                  </div>
                </div>
                <div className="bg-brand-ivory p-10 sm:p-14 flex flex-col justify-center">
                  <BookOpen className="size-10 text-brand-maroon/20 mb-6" />
                  <p className="text-gray-600 text-base leading-relaxed">
                    {featured.body}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <div className="size-8 rounded-full bg-brand-maroon/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-maroon">VA</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal">Vivah Australia Team</p>
                      <p className="text-xs text-gray-400">{featured.readTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Article Grid ──────────────────────────────────────────────── */}
      <section className="pb-24 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-6">
            All Articles
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((blog) => (
              <Link key={blog.slug} href={`/blog/${blog.slug}`} className="group block">
                <div className="rounded-[24px] bg-white border border-gray-100 p-7 h-full flex flex-col hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${TAG_COLORS[blog.tag] ?? 'bg-amber-100 text-amber-800'}`}>
                      {blog.tag}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="size-3" /> {blog.readTime}
                    </span>
                  </div>
                  <h3 className="font-playfair text-lg font-bold text-brand-charcoal leading-snug mb-3 group-hover:text-brand-maroon transition-colors flex-1">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-5">
                    {blog.body}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon mt-auto">
                    Read <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics Strip ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 sm:px-8 lg:px-12 border-y border-gray-100">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-maroon mb-5">
            Browse by Topic
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.keys(TAG_COLORS).map((tag) => (
              <span
                key={tag}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${TAG_COLORS[tag]}`}
              >
                <Tag className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-5">
            Ready to Start Your{' '}
            <span className="text-brand-gold">Journey?</span>
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            Join 10,000+ verified Indian singles across Australia who are finding meaningful relationships on Vivah.
          </p>
          <PremiumButton href="/register" variant="gold">
            Create Free Profile
            <ArrowRight className="size-4" />
          </PremiumButton>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
