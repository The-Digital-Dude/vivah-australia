import {
  getBlogs,
  getCmsSections,
  getFeaturedProfiles,
  getHomeContent,
  getPlans,
  getSuccessStories,
  getTestimonials,
} from './public-api';

export async function loadHomepageData() {
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

  return {
    home,
    featuredProfiles: featuredProfiles.profiles,
    plans: plans.plans,
    stories: stories.stories,
    testimonials: testimonials.testimonials,
    blogs: blogs.blogs,
    dynamicSections: dynamicSections.sections,
  };
}
