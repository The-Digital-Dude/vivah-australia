import { notFound } from 'next/navigation';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

interface PublicProfileResponse {
  profile?: {
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
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
      <article className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-red-700">{profile.displayId}</p>
        <h1 className="mt-3 text-4xl font-semibold">
          {[profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
            'Member profile'}
        </h1>
        <p className="mt-3 text-neutral-600">
          {[
            profile.personal?.age ? `${profile.personal.age} years` : undefined,
            profile.location?.city,
            profile.employment?.occupation,
          ]
            .filter(Boolean)
            .join(' | ')}
        </p>
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
    </main>
  );
}

function Panel({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-lg border border-neutral-200 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700">{children}</div>
    </section>
  );
}
