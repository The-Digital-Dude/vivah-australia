import { getPublicMatches } from '@/lib/public-api';
import PublicMatchesClient from './public-matches-client';

function rangeToBounds(ageRange?: string) {
  if (!ageRange) {
    return {};
  }

  const [min, max] = ageRange.split('-').map((value) => Number(value));

  return {
    ...(Number.isFinite(min) ? { ageMin: min } : {}),
    ...(Number.isFinite(max) ? { ageMax: max } : {}),
  };
}

export const metadata = {
  title: 'Explore Matches | Vivah Australia',
  description:
    'Preview serious, verified matrimonial matches across Australia before creating your profile.',
};

export default async function PublicMatchesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = (await searchParams) ?? {};
  const ageRange = typeof params.ageRange === 'string' ? params.ageRange : undefined;
  const query = {
    ...(typeof params.gender === 'string' ? { gender: params.gender } : {}),
    ...(typeof params.city === 'string' ? { city: params.city } : {}),
    ...(typeof params.religion === 'string' ? { religion: params.religion } : {}),
    ...rangeToBounds(ageRange),
    limit: 9,
  };

  const preview = await getPublicMatches(query);

  return (
    <PublicMatchesClient
      preview={preview}
      initialQuery={{
        ...query,
        ...(ageRange ? { ageRange } : {}),
      }}
    />
  );
}
