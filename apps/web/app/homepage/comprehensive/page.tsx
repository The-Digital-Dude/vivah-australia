import { Metadata } from 'next';
import { loadHomepageData } from '@/lib/homepage-data';
import { ComprehensiveClient } from './comprehensive-client';

export const metadata: Metadata = {
  title: 'Premium Indian Matrimony in Australia | Vivah Australia',
  description: 'Find your perfect match with Vivah Australia. We offer premium matchmaking, 100% verified profiles, and personalized success stories for Indian singles in Australia.',
  keywords: ['Matrimony Australia', 'Indian Matchmaking', 'Premium Matrimony', 'Verified Profiles', 'Vivah Australia'],
  openGraph: {
    title: 'Premium Indian Matrimony in Australia | Vivah Australia',
    description: 'Find your perfect match with Vivah Australia.',
    url: 'https://vivahaustralia.com',
    siteName: 'Vivah Australia',
    type: 'website',
  },
};

export default async function ComprehensiveHomepagePage() {
  const data = await loadHomepageData();

  return <ComprehensiveClient data={data} />;
}
