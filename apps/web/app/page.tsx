import {
  getBlogs,
  getFeaturedProfiles,
  getHomeContent,
  getPlans,
  getSuccessStories,
  getTestimonials,
  getCmsSections,
  type FeaturedProfile,
  type PublicContentItem,
  type PublicPlan,
} from '@/lib/public-api';
import HomeClient from './home-client';

const fallbackProfiles: FeaturedProfile[] = [
  {
    displayId: 'VA100001',
    personal: { firstName: 'Amit', age: 34, gender: 'MALE' },
    location: { city: 'Melbourne', state: 'VIC' },
    religion: { religion: 'Hindu' },
    employment: { occupation: 'Software Engineer' },
    verification: { level: 'GOLD' },
  },
  {
    displayId: 'VA100002',
    personal: { firstName: 'Priya', age: 31, gender: 'FEMALE' },
    location: { city: 'Sydney', state: 'NSW' },
    religion: { religion: 'Hindu' },
    employment: { occupation: 'Accountant' },
    verification: { level: 'SILVER' },
  },
  {
    displayId: 'VA100003',
    personal: { firstName: 'Neha', age: 29, gender: 'FEMALE' },
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

export default async function HomePage() {
  const [home, { profiles }, { plans }, { stories }, { testimonials }, { blogs }, { sections }] =
    await Promise.all([
      getHomeContent(),
      getFeaturedProfiles(),
      getPlans(),
      getSuccessStories(),
      getTestimonials(),
      getBlogs(3),
      getCmsSections('home'),
    ]);

  const profileItems = profiles.length ? profiles : fallbackProfiles;
  const planItems = plans.length ? plans : fallbackPlans;
  const storyItems = stories.length ? stories : fallbackStories;
  const testimonialItems = testimonials.length ? testimonials : fallbackTestimonials;
  const blogItems = blogs.length ? blogs : fallbackBlogs;

  return (
    <HomeClient
      home={home}
      profiles={profileItems}
      plans={planItems}
      stories={storyItems}
      testimonials={testimonialItems}
      blogs={blogItems}
      dynamicSections={sections || []}
    />
  );
}
