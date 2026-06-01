import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { PageHero, ProfileDetailSection, StaticPageLayout, VerificationBadge } from '@/app/components';
import ProfileActions from '../../member/profile-actions';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

interface PublicProfileResponse {
  profile?: {
    _id?: string;
    displayId: string;
    completionPercentage: number;
    personal?: { firstName?: string; lastName?: string; age?: number; gender?: string };
    location?: { city?: string; state?: string; country?: string };
    religion?: { religion?: string; community?: string; motherTongue?: string };
    education?: { highestQualification?: string };
    employment?: { occupation?: string; annualIncome?: number; employerName?: string };
    about?: {
      aboutMe?: string;
      hobbies?: string[];
      interests?: string[];
      partnerExpectations?: string;
    };
    verification?: { level?: string };
  };
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { id } = await params;
  return {
    title: `Profile ${id} | Vivah Australia`,
  };
}

export default async function ProfileViewPage({ params }: ProfilePageProps) {
  const { id } = await params;
  const response = await fetch(`${apiBaseUrl}/api/profiles/${id}`, { cache: 'no-store' });

  if (!response.ok) {
    notFound();
  }

  const { profile } = (await response.json()) as PublicProfileResponse;

  if (!profile) {
    notFound();
  }

  return (
    <StaticPageLayout
      hero={
        <PageHero
          eyebrow={profile.displayId}
          title={
            [profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
            'Member profile'
          }
        >
          {[
            profile.personal?.age ? `${profile.personal.age} years` : undefined,
            profile.location?.city,
            profile.employment?.occupation,
          ]
            .filter(Boolean)
            .join(' | ')}
          <div className="mt-4">
            <VerificationBadge level={profile.verification?.level} />
          </div>
        </PageHero>
      }
    >
      <article className="mx-auto max-w-4xl">
        <div className="mt-6 max-w-xl">
          <ProfileActions profileId={profile._id ?? id} compact />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Panel title="Background">
            <p>Religion: {profile.religion?.religion ?? 'Not shared'}</p>
            <p>Community: {profile.religion?.community ?? 'Not shared'}</p>
            <p>Education: {profile.education?.highestQualification ?? 'Not shared'}</p>
          </Panel>
          <Panel title="Verification">
            <p>Level: {profile.verification?.level ?? 'NONE'}</p>
            <p>Completion: {profile.completionPercentage}%</p>
          </Panel>
          <Panel title="About">
            <p>{profile.about?.aboutMe ?? 'No profile summary yet.'}</p>
          </Panel>
          <Panel title="Partner expectations">
            <p>{profile.about?.partnerExpectations ?? 'Not shared'}</p>
          </Panel>
        </div>
      </article>
    </StaticPageLayout>
  );
}

function Panel({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <ProfileDetailSection title={title}>{children}</ProfileDetailSection>
  );
}
