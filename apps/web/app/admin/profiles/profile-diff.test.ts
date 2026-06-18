import { describe, expect, it } from 'vitest';
import { buildProfileDiffRows } from './profile-diff';

describe('buildProfileDiffRows', () => {
  it('returns human-readable rows only for changed fields', () => {
    const previous = {
      personal: { firstName: 'Asha', lastName: 'Kapoor' },
      location: { city: 'Sydney', state: 'NSW' },
      partnerPreference: { cities: ['Sydney'], communities: ['Tamil'] },
      completionPercentage: 82,
    };

    const current = {
      personal: { firstName: 'Asha', lastName: 'Kapoor' },
      location: { city: 'Melbourne', state: 'VIC' },
      partnerPreference: { cities: ['Melbourne'], communities: ['Tamil'] },
      completionPercentage: 88,
    };

    const rows = buildProfileDiffRows(previous, current);

    expect(rows.map((row) => row.path)).toEqual([
      'completionPercentage',
      'location.city',
      'location.state',
      'partnerPreference.cities',
    ]);

    expect(rows.find((row) => row.path === 'location.city')).toMatchObject({
      label: 'Location / City',
      before: 'Sydney',
      after: 'Melbourne',
      changed: true,
    });
  });

  it('treats missing values as not provided', () => {
    const rows = buildProfileDiffRows(
      { about: { aboutMe: 'Old intro' } },
      { about: { aboutMe: '' } },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: 'about.aboutMe',
      before: 'Old intro',
      after: 'Not provided',
    });
  });
});
