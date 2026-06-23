import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicHeader, PublicFooter, PremiumButton } from '@/app/components';
import { getBlogBySlug, getBlogs } from '@/lib/public-api';
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, BookOpen, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TAG_COLORS: Record<string, string> = {
  'Profile Tips': 'bg-amber-100 text-amber-800',
  Safety: 'bg-red-100 text-red-800',
  Verification: 'bg-blue-100 text-blue-800',
  Community: 'bg-emerald-100 text-emerald-800',
  Communication: 'bg-purple-100 text-purple-800',
  Relationships: 'bg-rose-100 text-rose-800',
  Advice: 'bg-orange-100 text-orange-800',
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-brand-gold/20 text-brand-charcoal';
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { blog } = await getBlogBySlug(slug);
  if (!blog) return { title: 'Article Not Found | Vivah Australia' };
  const description =
    blog.seoDescription?.trim() ||
    stripHtml(blog.body ?? '').substring(0, 160) ||
    'Read insights and matrimonial advice on Vivah Australia.';
  return {
    title: blog.seoTitle?.trim()
      ? `${blog.seoTitle} | Vivah Australia`
      : `${blog.title} | Vivah Australia Blog`,
    description,
  };
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [{ blog }, { blogs: latestBlogs }] = await Promise.all([getBlogBySlug(slug), getBlogs(4)]);

  if (!blog) notFound();

  const related = (latestBlogs ?? []).filter((item) => item.slug !== slug).slice(0, 3);

  const formattedDate = new Date(blog.updatedAt ?? blog.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const authorName =
    blog.author?.trim() ||
    (blog.authorId
      ? `${blog.authorId.firstName ?? ''} ${blog.authorId.lastName ?? ''}`.trim()
      : '') ||
    'Vivah Australia Team';

  const readTime = blog.readTimeMinutes ? `${blog.readTimeMinutes} min read` : '4 min read';

  return (
    <div className="min-h-screen bg-brand-ivory font-poppins">
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon pt-24 pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 lg:px-12">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition mb-8"
          >
            <ArrowLeft className="size-3.5" />
            Back to Blog
          </Link>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {blog.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90 border border-white/20"
                >
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {blog.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-brand-gold" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand-gold" />
              {readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-brand-gold" />
              {authorName}
            </span>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60L1440 60L1440 30C1200 0 960 60 720 30C480 0 240 60 0 30L0 60Z"
              fill="#FFF9F5"
            />
          </svg>
        </div>
      </section>

      {/* ── Article Body ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-[1fr_280px] gap-10 items-start">
            {/* Main content */}
            <article>
              {/* Cover image */}
              {blog.coverImage ? (
                <div className="relative w-full aspect-[16/9] rounded-[24px] overflow-hidden mb-10 border border-gray-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] rounded-[24px] bg-gradient-to-br from-brand-maroon/10 to-brand-gold/10 flex items-center justify-center mb-10 border border-brand-maroon/10">
                  <Sparkles className="size-10 text-brand-gold/40" />
                </div>
              )}

              {/* Article text */}
              <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-8 sm:p-10">
                <div
                  className="blog-content max-w-none text-gray-700 leading-8"
                  dangerouslySetInnerHTML={{ __html: blog.body ?? '' }}
                />
              </div>

              {/* Tags (bottom) */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-gray-400 mr-1 self-center">Topics:</span>
                  {blog.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${tagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-5 lg:sticky lg:top-20">
              {/* Author card */}
              <div className="rounded-[22px] bg-white border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Written by
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-full bg-brand-maroon/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand-maroon">VA</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal">{authorName}</p>
                    <p className="text-xs text-gray-400">Vivah Australia</p>
                  </div>
                </div>
              </div>

              {/* Join CTA */}
              <div className="rounded-[22px] border border-brand-gold/25 bg-[linear-gradient(135deg,#FFF8EC,#FFF9F5)] p-6 text-center">
                <Sparkles className="size-6 text-brand-gold mx-auto mb-3" />
                <p className="font-bold text-brand-charcoal text-sm mb-2">
                  Ready to find your match?
                </p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Join 10,000+ verified Indian singles across Australia.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline"
                >
                  Create free profile <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Back to blog */}
              <div className="rounded-[22px] bg-white border border-gray-100 p-5 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-maroon hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  All Articles
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Related Articles ──────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-20 px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-brand-charcoal">
                More from the Blog
              </h2>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-brand-maroon hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((article, idx) => (
                <Link
                  key={article.slug ?? idx}
                  href={`/blog/${article.slug}`}
                  className="group block"
                >
                  <div className="rounded-[24px] border border-gray-100 bg-brand-ivory p-6 h-full flex flex-col hover:-translate-y-1 hover:shadow-md transition-all">
                    <div className="size-10 rounded-xl bg-brand-maroon/10 flex items-center justify-center mb-4">
                      <BookOpen className="size-4 text-brand-maroon" />
                    </div>
                    <h3 className="font-playfair text-base font-bold text-brand-charcoal leading-snug mb-3 group-hover:text-brand-maroon transition-colors flex-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                      {stripHtml(article.body ?? '')}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-maroon mt-auto">
                      Read <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative bg-brand-maroon py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,76,0.15),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-playfair text-3xl font-bold text-white mb-4">
            Ready to Start Your <span className="text-brand-gold">Journey?</span>
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            Join 10,000+ verified Indian singles across Australia finding meaningful relationships
            on Vivah.
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
