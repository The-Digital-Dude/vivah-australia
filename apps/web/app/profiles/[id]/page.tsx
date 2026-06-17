import ProfileDetailClient from './profile-detail-client';
import type { Metadata } from 'next';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface PublicProfileData {
  displayId?: string;
  photoUrl?: string;
  personal?: {
    firstName?: string;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  about?: {
    aboutMe?: string;
  };
  employment?: {
    occupation?: string;
  };
}

async function getProfileData(id: string): Promise<PublicProfileData | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/profiles/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { profile?: PublicProfileData };
    return data.profile ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileData(id);

  if (!profile) {
    return {
      title: `Profile ${id} | Vivah Australia`,
    };
  }

  const name = profile.personal?.firstName ?? profile.displayId;
  const location = [profile.location?.city, profile.location?.state].filter(Boolean).join(', ');
  const title = `${name}'s Matrimony Profile | Vivah Australia`;
  const description = `View ${name}'s matrimonial profile on Vivah Australia. Based in ${location}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://vivahaustralia.com.au/profiles/${id}`,
      siteName: 'Vivah Australia',
      images: profile.photoUrl ? [{ url: profile.photoUrl }] : [],
    },
  };
}

export default async function ProfileViewPage({ params }: ProfilePageProps) {
  const { id } = await params;
  const profile = await getProfileData(id);

  const jsonLd = profile ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.personal?.firstName ?? profile.displayId,
    description: profile.about?.aboutMe,
    image: profile.photoUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location?.city,
      addressRegion: profile.location?.state,
      addressCountry: profile.location?.country,
    },
    jobTitle: profile.employment?.occupation,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileDetailClient profileId={id} />
    </>
  );
}
