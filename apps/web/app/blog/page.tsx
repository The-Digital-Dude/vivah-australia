import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, PlayCircle } from 'lucide-react';
import {
  PremiumCard,
  StaticPageContainer,
  StaticPageHero,
  StaticPageLayout,
} from '@/app/components';
import { getBlogs } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Insights & Matchmaking Advice | Vivah Australia Blog',
  description:
    'Matrimonial advice, relationship guides, safety tips, and South Asian community updates on Vivah Australia.',
};

export default async function BlogPage() {
  const { blogs } = await getBlogs(12);

  const fallbackBlogs = [
    {
      title: 'How to create a strong matrimonial profile',
      body: 'Lead with clarity, values, and expectations so compatible people can understand your intent. Share your education and career journey cleanly.',
      slug: 'how-to-create-a-strong-matrimonial-profile',
    },
    {
      title: 'Safety tips for online matchmaking',
      body: 'Use verification, private profile controls, and report tools before moving conversations elsewhere. Protect your address and personal accounts.',
      slug: 'safety-tips-for-online-matchmaking',
    },
    {
      title: 'How verification works',
      body: 'Understand the trust ladder from basic account checks to stronger identity confidence. Learn what documents are reviewed and approved.',
      slug: 'how-verification-works',
    },
  ];

  const blogItems = blogs.length ? blogs : fallbackBlogs;

  return (
    <StaticPageLayout
      hero={
        <StaticPageHero
          eyebrow="Vivah Australia Guidance"
          title="Insights for your matrimonial search"
          subtitle="Explore our blog for advice on creating premium profiles, understanding verification steps, communicating safely, and finding compatible South Asian matches in Australia."
        />
      }
    >
      <StaticPageContainer>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogItems.map((blog, idx) => (
            <PremiumCard
              key={blog.slug ?? `blog-${idx}`}
              className="flex flex-col justify-between h-full hover:-translate-y-1 transition duration-300"
            >
              <div>
                <div className="w-full h-44 bg-[#FFF0F3] rounded-2xl mb-5 flex items-center justify-center border border-[#A10E4D]/5 text-[#A10E4D]/45">
                  <PlayCircle className="size-10" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4A04C] mb-2">
                  Advice
                </p>
                <h3 className="text-lg font-bold text-[#2F2F2F] mb-3 leading-snug">{blog.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3 mb-6">
                  {blog.body}
                </p>
              </div>
              <Link
                href={`/blog/${blog.slug}`}
                className="text-sm font-bold text-[#A10E4D] inline-flex items-center gap-1 hover:text-[#890B40]"
              >
                Read Article <ChevronRight className="size-4" />
              </Link>
            </PremiumCard>
          ))}
        </div>
      </StaticPageContainer>
    </StaticPageLayout>
  );
}
