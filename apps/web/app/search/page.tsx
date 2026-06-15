import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchClient from './search-client';

export const metadata: Metadata = {
  title: 'Browse Profiles | Vivah Australia',
  description:
    'Browse verified Indian matrimonial profiles across Australia. Filter by age, religion, city and more. Join Vivah Australia to connect with serious match seekers.',
  openGraph: {
    title: 'Browse Profiles | Vivah Australia',
    description: 'Find your perfect match among thousands of verified Indian Australian profiles.',
    url: 'https://vivahaustralia.com.au/search',
    siteName: 'Vivah Australia',
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F5]" />}>
      <SearchClient />
    </Suspense>
  );
}
