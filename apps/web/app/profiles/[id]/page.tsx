import ProfileDetailClient from './profile-detail-client';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { id } = await params;
  return {
    title: `Profile ${id} | Vivah Australia`,
  };
}

export default async function ProfileViewPage({ params }: ProfilePageProps) {
  const { id } = await params;
  return <ProfileDetailClient profileId={id} />;
}
