import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Tag, ArrowLeft, PlayCircle } from 'lucide-react';
import {
  PremiumCard,
  StaticPageContainer,
  StaticPageLayout,
} from '@/app/components';
import { getBlogBySlug, getBlogs } from '@/lib/public-api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { blog } = await getBlogBySlug(slug);
  if (!blog) return { title: 'Blog Not Found' };
  
  return {
    title: `${blog.title} | Vivah Australia Blog`,
    description: blog.body?.substring(0, 160) || 'Read insights and matrimonial advice on Vivah Australia.',
  };
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [{ blog }, { blogs: latestBlogs }] = await Promise.all([
    getBlogBySlug(slug),
    getBlogs(4),
  ]);

  if (!blog) {
    notFound();
  }

  const related = (latestBlogs || [])
    .filter((item) => item.slug !== slug)
    .slice(0, 3);

  const formattedDate = new Date(blog.updatedAt || blog.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <StaticPageLayout>
      <div className="bg-[#FFF9F5] pt-24 pb-16">
        <StaticPageContainer className="max-w-4xl">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A10E4D] hover:text-[#890B40] transition"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Guidance Blog</span>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Tags and Metadata */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-neutral-500">
              <span className="flex items-center gap-1 text-[#D4A04C]">
                <Calendar className="size-4" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{blog.readTimeMinutes || 3} min read</span>
              </span>
              {blog.authorId && (
                <span className="border-l border-neutral-300 pl-3">
                  By {blog.authorId.firstName || 'Admin'} {blog.authorId.lastName || ''}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-playfair font-bold text-[#2F2F2F] leading-tight">
              {blog.title}
            </h1>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {blog.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-white border border-[#A10E4D]/15 px-3 py-1 text-[10px] font-bold text-[#A10E4D] uppercase"
                  >
                    <Tag className="size-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Cover Image */}
            <div className="relative w-full h-[320px] md:h-[450px] rounded-3xl overflow-hidden bg-[#FFF5EF] border border-neutral-200 mt-6">
              {blog.coverImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A10E4D]/20 gap-3">
                  <PlayCircle className="size-16" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Vivah Australia Guidance</span>
                </div>
              )}
            </div>

            {/* Article Content */}
            <div className="prose prose-neutral max-w-none pt-8 border-t border-neutral-200/60 leading-relaxed text-neutral-700 text-sm font-semibold whitespace-pre-wrap">
              {blog.body}
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="mt-20 border-t border-neutral-200 pt-12">
              <h3 className="text-xl lg:text-2xl font-playfair font-bold text-[#2F2F2F] mb-8">
                Related Guidance Articles
              </h3>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((article, idx) => (
                  <PremiumCard
                    key={article.slug || idx}
                    className="flex flex-col justify-between h-full hover:-translate-y-1 transition duration-300"
                  >
                    <div>
                      <div className="w-full h-32 bg-[#FFF0F3] rounded-2xl mb-4 flex items-center justify-center border border-[#A10E4D]/5 text-[#A10E4D]/35">
                        <PlayCircle className="size-8" />
                      </div>
                      <h4 className="text-sm font-bold text-[#2F2F2F] mb-2 line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-xs text-neutral-450 line-clamp-3 mb-4 font-medium">
                        {article.body}
                      </p>
                    </div>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="text-xs font-bold text-[#A10E4D] hover:underline"
                    >
                      Read Article
                    </Link>
                  </PremiumCard>
                ))}
              </div>
            </div>
          )}
        </StaticPageContainer>
      </div>
    </StaticPageLayout>
  );
}
