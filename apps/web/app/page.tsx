import FinalHomepageClient from './final-homepage/client';
import { getFeaturedProfiles } from '@/lib/public-api';

export const metadata = {
  title: 'Vivah Australia | Premium Indian Matrimonial Platform',
  description:
    'Create a verified matrimonial profile, discover compatible Australian matches, and connect safely with serious relationship seekers.',
};

export default async function HomePage() {
  const { profiles } = await getFeaturedProfiles();
  return <FinalHomepageClient featuredProfiles={profiles} />;
}
