import type { ReactNode } from 'react';
import { Briefcase, GraduationCap, Home, MapPin, Sun, Users } from 'lucide-react';

export interface CompatibilityProfileDetail {
  location?: {
    city?: string;
    state?: string;
  };
  religion?: {
    religion?: string;
    community?: string;
  };
  education?: { highestQualification?: string };
  employment?: {
    occupation?: string;
    industry?: string;
  };
  family?: {
    familyValues?: string;
    familyType?: string;
  };
  lifestyle?: {
    dietaryPreferences?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
  };
}

export interface CompatibilityViewerProfile {
  location?: {
    city?: string;
    state?: string;
  };
  religion?: {
    religion?: string;
    community?: string;
  };
  education?: {
    highestQualification?: string;
  };
  employment?: {
    occupation?: string;
    industry?: string;
  };
  family?: {
    familyValues?: string;
    familyType?: string;
  };
  lifestyle?: {
    dietaryPreferences?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
  };
  partnerPreference?: {
    cities?: string[];
    communities?: string[];
    educationLevels?: string[];
  };
}

export type CompatibilityAccent = 'burgundy' | 'gold' | 'emerald';

export interface CompatibilityRow {
  label: string;
  score: number;
  summary: string;
  accent: CompatibilityAccent;
  icon: ReactNode;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchValue(
  left?: string | number | null,
  right?: string | number | null,
  options?: { exact?: number; mismatch?: number; fallback?: number },
) {
  const exact = options?.exact ?? 92;
  const mismatch = options?.mismatch ?? 58;
  const fallback = options?.fallback ?? 68;

  if (left === undefined || left === null || right === undefined || right === null) {
    return fallback;
  }

  return normalize(String(left)) === normalize(String(right)) ? exact : mismatch;
}

function matchArray(
  viewerValues?: string[],
  targetValue?: string,
  options?: { match?: number; fallback?: number; miss?: number },
) {
  const match = options?.match ?? 90;
  const fallback = options?.fallback ?? 60;
  const miss = options?.miss ?? 50;

  if (!viewerValues?.length || !targetValue) {
    return fallback;
  }

  return viewerValues.some((item) => normalize(item) === normalize(targetValue)) ? match : miss;
}

function averageScore(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildCompatibilityRows(
  viewerProfile: CompatibilityViewerProfile | null,
  profile: CompatibilityProfileDetail,
  matchScore?: number,
): CompatibilityRow[] {
  const fallbackBase = typeof matchScore === 'number' ? Math.max(55, Math.min(94, matchScore)) : 72;

  if (!viewerProfile) {
    return [
      {
        label: 'Lifestyle',
        score: Math.max(58, fallbackBase - 4),
        summary: 'Compatibility estimate improves once we can compare daily preferences.',
        accent: 'emerald',
        icon: <Sun className="size-4" />,
      },
      {
        label: 'Family values',
        score: fallbackBase,
        summary: 'Shared seriousness and family orientation are inferred from visible profile details.',
        accent: 'burgundy',
        icon: <Home className="size-4" />,
      },
      {
        label: 'Education',
        score: Math.min(96, fallbackBase + 2),
        summary: 'Education fit is estimated from visible academic and professional signals.',
        accent: 'gold',
        icon: <GraduationCap className="size-4" />,
      },
      {
        label: 'Career',
        score: Math.max(56, fallbackBase - 1),
        summary: 'Career alignment is based on the information this member has chosen to share.',
        accent: 'burgundy',
        icon: <Briefcase className="size-4" />,
      },
      {
        label: 'Location',
        score: Math.max(54, fallbackBase - 3),
        summary: 'Location fit becomes clearer after you compare city and relocation preferences.',
        accent: 'emerald',
        icon: <MapPin className="size-4" />,
      },
      {
        label: 'Community',
        score: Math.max(57, fallbackBase - 2),
        summary: 'Religion, community, and language preferences can strengthen this introduction.',
        accent: 'gold',
        icon: <Users className="size-4" />,
      },
    ];
  }

  const locationScore = averageScore([
    matchValue(viewerProfile.location?.city, profile.location?.city, { fallback: 66 }),
    matchValue(viewerProfile.location?.state, profile.location?.state, { exact: 86, mismatch: 58, fallback: 68 }),
    matchArray(viewerProfile.partnerPreference?.cities, profile.location?.city, { match: 92, fallback: 66, miss: 55 }),
  ]);

  const educationScore = averageScore([
    matchValue(viewerProfile.education?.highestQualification, profile.education?.highestQualification, {
      exact: 92,
      mismatch: 64,
      fallback: 72,
    }),
    matchArray(viewerProfile.partnerPreference?.educationLevels, profile.education?.highestQualification, {
      match: 94,
      fallback: 70,
      miss: 58,
    }),
  ]);

  const careerScore = averageScore([
    matchValue(viewerProfile.employment?.industry, profile.employment?.industry, {
      exact: 90,
      mismatch: 60,
      fallback: 70,
    }),
    matchValue(viewerProfile.employment?.occupation, profile.employment?.occupation, {
      exact: 86,
      mismatch: 62,
      fallback: 68,
    }),
  ]);

  const communityScore = averageScore([
    matchValue(viewerProfile.religion?.religion, profile.religion?.religion, {
      exact: 94,
      mismatch: 54,
      fallback: 72,
    }),
    matchValue(viewerProfile.religion?.community, profile.religion?.community, {
      exact: 90,
      mismatch: 58,
      fallback: 68,
    }),
    matchArray(viewerProfile.partnerPreference?.communities, profile.religion?.community, {
      match: 94,
      fallback: 68,
      miss: 56,
    }),
  ]);

  const familyScore = averageScore([
    matchValue(viewerProfile.family?.familyValues, profile.family?.familyValues, {
      exact: 90,
      mismatch: 60,
      fallback: 72,
    }),
    matchValue(viewerProfile.family?.familyType, profile.family?.familyType, {
      exact: 84,
      mismatch: 62,
      fallback: 70,
    }),
  ]);

  const lifestyleScore = averageScore([
    matchValue(viewerProfile.lifestyle?.dietaryPreferences, profile.lifestyle?.dietaryPreferences, {
      exact: 92,
      mismatch: 54,
      fallback: 72,
    }),
    matchValue(viewerProfile.lifestyle?.smokingHabits, profile.lifestyle?.smokingHabits, {
      exact: 96,
      mismatch: 48,
      fallback: 74,
    }),
    matchValue(viewerProfile.lifestyle?.drinkingHabits, profile.lifestyle?.drinkingHabits, {
      exact: 94,
      mismatch: 52,
      fallback: 72,
    }),
  ]);

  return [
    {
      label: 'Lifestyle',
      score: lifestyleScore,
      summary: 'Built from diet, smoking, drinking, and everyday living preferences.',
      accent: 'emerald',
      icon: <Sun className="size-4" />,
    },
    {
      label: 'Family values',
      score: familyScore,
      summary: 'Looks at how each of you describes family values and household style.',
      accent: 'burgundy',
      icon: <Home className="size-4" />,
    },
    {
      label: 'Education',
      score: educationScore,
      summary: 'Compares qualifications and whether this profile fits your education preferences.',
      accent: 'gold',
      icon: <GraduationCap className="size-4" />,
    },
    {
      label: 'Career',
      score: careerScore,
      summary: 'Based on occupation and industry overlap where information is available.',
      accent: 'burgundy',
      icon: <Briefcase className="size-4" />,
    },
    {
      label: 'Location',
      score: locationScore,
      summary: 'Reflects city and state alignment plus your stated location preferences.',
      accent: 'emerald',
      icon: <MapPin className="size-4" />,
    },
    {
      label: 'Community',
      score: communityScore,
      summary: 'Uses religion, community, and preference matches without forcing exact sameness.',
      accent: 'gold',
      icon: <Users className="size-4" />,
    },
  ];
}

export function getCompatibilityHeadline(score: number) {
  if (score >= 85) {
    return 'Very strong fit across the signals you both share.';
  }
  if (score >= 72) {
    return 'A promising match with several strong points of alignment.';
  }
  if (score >= 60) {
    return 'Worth exploring, with a few areas to talk through early.';
  }
  return 'Some overlap is visible, but this match may need more conversation.';
}

export function splitCompatibilityRows(rows: CompatibilityRow[]) {
  const ranked = [...rows].sort((left, right) => right.score - left.score);
  return {
    strongest: ranked.slice(0, 3),
    discuss: ranked.slice(-2).reverse(),
  };
}
