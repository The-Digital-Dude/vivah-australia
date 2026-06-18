import { describe, expect, it } from 'vitest';
import {
  buildCompatibilityRows,
  getCompatibilityHeadline,
  splitCompatibilityRows,
  type CompatibilityRow,
} from './profile-compatibility';

describe('profile compatibility helpers', () => {
  it('builds a six-dimension compatibility breakdown from viewer and target profiles', () => {
    const viewer = {
      location: { city: 'Sydney', state: 'NSW' },
      religion: { religion: 'Hindu', community: 'Tamil' },
      education: { highestQualification: 'Masters' },
      employment: { occupation: 'Engineer', industry: 'Technology' },
      family: { familyValues: 'Traditional', familyType: 'Nuclear' },
      lifestyle: {
        dietaryPreferences: 'Vegetarian',
        smokingHabits: 'Non-smoker',
        drinkingHabits: 'No',
      },
      partnerPreference: {
        cities: ['Sydney'],
        communities: ['Tamil'],
        educationLevels: ['Masters'],
      },
    };

    const profile = {
      location: { city: 'Sydney', state: 'NSW' },
      religion: { religion: 'Hindu', community: 'Tamil' },
      education: { highestQualification: 'Masters' },
      employment: { occupation: 'Engineer', industry: 'Technology' },
      family: { familyValues: 'Traditional', familyType: 'Nuclear' },
      lifestyle: {
        dietaryPreferences: 'Vegetarian',
        smokingHabits: 'Non-smoker',
        drinkingHabits: 'No',
      },
    };

    const rows = buildCompatibilityRows(viewer, profile, 91);

    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.score >= 84)).toBe(true);
    expect(rows.map((row) => row.label)).toEqual([
      'Lifestyle',
      'Family values',
      'Education',
      'Career',
      'Location',
      'Community',
    ]);
  });

  it('surfaces strongest and discuss-early rows in score order', () => {
    const rows: CompatibilityRow[] = [
      { label: 'Lifestyle', score: 92, summary: '', accent: 'emerald', icon: null },
      { label: 'Family values', score: 88, summary: '', accent: 'burgundy', icon: null },
      { label: 'Education', score: 85, summary: '', accent: 'gold', icon: null },
      { label: 'Career', score: 66, summary: '', accent: 'burgundy', icon: null },
      { label: 'Location', score: 61, summary: '', accent: 'emerald', icon: null },
      { label: 'Community', score: 58, summary: '', accent: 'gold', icon: null },
    ];

    const split = splitCompatibilityRows(rows);

    expect(split.strongest.map((row) => row.label)).toEqual([
      'Lifestyle',
      'Family values',
      'Education',
    ]);
    expect(split.discuss.map((row) => row.label)).toEqual(['Community', 'Location']);
  });

  it('returns a stronger headline for higher overall compatibility scores', () => {
    expect(getCompatibilityHeadline(89)).toContain('Very strong fit');
    expect(getCompatibilityHeadline(75)).toContain('promising match');
    expect(getCompatibilityHeadline(63)).toContain('Worth exploring');
    expect(getCompatibilityHeadline(49)).toContain('may need more conversation');
  });
});
