import { getBlogs, getCmsSections, getFeaturedProfiles, getHomeContent, getPlans, getSuccessStories, getTestimonials } from '@/lib/public-api';
import HomeClient from './home-client';

export const metadata = {
  title: 'Vivah Australia | Trusted Indian Matrimonial Community',
  description:
    'Create a verified matrimonial profile, discover compatible Australian matches, and connect safely with serious relationship seekers.',
};

export default async function HomePage() {
  const [home, featuredProfiles, plans, stories, testimonials, blogs, dynamicSections] =
    await Promise.all([
      getHomeContent(),
      getFeaturedProfiles(),
      getPlans(),
      getSuccessStories(),
      getTestimonials(),
      getBlogs(3),
      getCmsSections('home'),
    ]);

  return (
    <HomeClient
      home={home}
      profiles={featuredProfiles.profiles}
      plans={plans.plans}
      stories={stories.stories}
      testimonials={testimonials.testimonials}
      blogs={blogs.blogs}
      dynamicSections={dynamicSections.sections}
    />
  );
}
