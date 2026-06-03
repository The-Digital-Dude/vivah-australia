'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Upload,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { profileDraftSchema, mediaSignUploadSchema } from '@vivah/shared';
import { useMemberRequest } from '@/lib/member-api';

// ─── Tokens & helpers ──────────────────────────────────────────────────────────

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Details', shortLabel: '1' },
  { id: 2, label: 'Location', shortLabel: '2' },
  { id: 3, label: 'Religion & Community', shortLabel: '3' },
  { id: 4, label: 'Education & Career', shortLabel: '4' },
  { id: 5, label: 'Family', shortLabel: '5' },
  { id: 6, label: 'Lifestyle', shortLabel: '6' },
  { id: 7, label: 'About Me', shortLabel: '7' },
  { id: 8, label: 'Photos', shortLabel: '8' },
  { id: 9, label: 'Partner Preferences', shortLabel: '9' },
  { id: 10, label: 'Verification', shortLabel: '10' },
] as const;

const STEP_META = [
  {
    eyebrow: 'Step 1',
    title: 'Start with the basics',
    description:
      'Your name, marital status, and date of birth create the foundation for every future introduction.',
    highlight: 'A complete first step helps your profile feel real and trustworthy immediately.',
  },
  {
    eyebrow: 'Step 2',
    title: 'Set your Australian location',
    description:
      'Location matters for practical family conversations, visa context, and discovery relevance.',
    highlight: 'Members often respond faster when city and residency details feel clear and current.',
  },
  {
    eyebrow: 'Step 3',
    title: 'Share religion and community background',
    description:
      'These details help families and serious members understand cultural alignment early.',
    highlight: 'Thoughtful background detail improves compatibility quality without making the profile feel rigid.',
  },
  {
    eyebrow: 'Step 4',
    title: 'Add education and career context',
    description:
      'Give your profile substance with clear academic and professional details.',
    highlight: 'Well-structured career information often increases trust and conversation quality.',
  },
  {
    eyebrow: 'Step 5',
    title: 'Introduce your family values',
    description:
      'Family context helps people understand your support system and the kind of life you come from.',
    highlight: 'This section is especially valuable for respectful, family-involved matchmaking journeys.',
  },
  {
    eyebrow: 'Step 6',
    title: 'Describe your lifestyle honestly',
    description:
      'Daily habits and preferences shape long-term compatibility more than polished headlines do.',
    highlight: 'Small details here prevent mismatched expectations later.',
  },
  {
    eyebrow: 'Step 7',
    title: 'Tell your story well',
    description:
      'Your words are often the difference between a profile that is skimmed and one that earns a reply.',
    highlight: 'Warm, specific writing usually performs better than generic self-descriptions.',
  },
  {
    eyebrow: 'Step 8',
    title: 'Build a strong photo gallery',
    description:
      'Clear, recent, confident photos increase profile trust and help members feel comfortable replying.',
    highlight: 'Profiles with a good primary photo are discovered and opened far more often.',
  },
  {
    eyebrow: 'Step 9',
    title: 'Define partner preferences',
    description:
      'Set expectations with enough clarity to guide discovery, without making the search feel too narrow.',
    highlight: 'Balanced preferences usually create better match quality and healthier response rates.',
  },
  {
    eyebrow: 'Step 10',
    title: 'Review and move into trust',
    description:
      'Finish strong, submit your profile for approval, and continue into the verification path that builds confidence.',
    highlight: 'Submission plus verification is what turns a draft into a serious matchmaking profile.',
  },
] as const;

const ONBOARDING_PROMISES = [
  'Every step saves back to your draft profile.',
  'You can return later and edit any completed section.',
  'Verification is optional now but strongly improves trust.',
] as const;

// ─── Draft state shape ────────────────────────────────────────────────────────

interface ProfileDraft {
  personal: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    maritalStatus: string;
    heightCm: string;
    weightKg: string;
    numberOfChildren: string;
    disabilityStatus: string;
  };
  location: {
    country: string;
    state: string;
    city: string;
    suburb: string;
    citizenshipStatus: string;
    visaStatus: string;
  };
  religion: {
    religion: string;
    community: string;
    caste: string;
    subCaste: string;
    motherTongue: string;
    languagesSpoken: string;
  };
  education: {
    highestQualification: string;
    institutionName: string;
    graduationYear: string;
    additionalCertifications: string;
  };
  employment: {
    occupation: string;
    industry: string;
    employmentStatus: string;
    employerName: string;
    annualIncome: string;
    annualIncomeVisibility: string;
  };
  family: {
    fatherDetails: string;
    motherDetails: string;
    siblingDetails: string;
    familyValues: string;
    familyType: string;
  };
  lifestyle: {
    smokingHabits: string;
    drinkingHabits: string;
    dietaryPreferences: string;
    fitnessInterests: string;
    religiousPractices: string;
  };
  about: {
    aboutMe: string;
    personalGoals: string;
    hobbies: string;
    interests: string;
    partnerExpectations: string;
  };
  partnerPreference: {
    ageMin: string;
    ageMax: string;
    heightMinCm: string;
    heightMaxCm: string;
    religions: string;
    communities: string;
    castes: string;
    motherTongues: string;
    countries: string;
    states: string;
    cities: string;
    educationLevels: string;
    occupations: string;
    incomeMin: string;
    incomeMax: string;
    maritalStatuses: string;
  };
}

function emptyDraft(): ProfileDraft {
  return {
    personal: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      maritalStatus: '',
      heightCm: '',
      weightKg: '',
      numberOfChildren: '',
      disabilityStatus: '',
    },
    location: {
      country: 'Australia',
      state: '',
      city: '',
      suburb: '',
      citizenshipStatus: '',
      visaStatus: '',
    },
    religion: {
      religion: '',
      community: '',
      caste: '',
      subCaste: '',
      motherTongue: '',
      languagesSpoken: '',
    },
    education: {
      highestQualification: '',
      institutionName: '',
      graduationYear: '',
      additionalCertifications: '',
    },
    employment: {
      occupation: '',
      industry: '',
      employmentStatus: '',
      employerName: '',
      annualIncome: '',
      annualIncomeVisibility: '',
    },
    family: {
      fatherDetails: '',
      motherDetails: '',
      siblingDetails: '',
      familyValues: '',
      familyType: '',
    },
    lifestyle: {
      smokingHabits: '',
      drinkingHabits: '',
      dietaryPreferences: '',
      fitnessInterests: '',
      religiousPractices: '',
    },
    about: {
      aboutMe: '',
      personalGoals: '',
      hobbies: '',
      interests: '',
      partnerExpectations: '',
    },
    partnerPreference: {
      ageMin: '',
      ageMax: '',
      heightMinCm: '',
      heightMaxCm: '',
      religions: '',
      communities: '',
      castes: '',
      motherTongues: '',
      countries: '',
      states: '',
      cities: '',
      educationLevels: '',
      occupations: '',
      incomeMin: '',
      incomeMax: '',
      maritalStatuses: '',
    },
  };
}

// Typed shape of the API profile response for safe extraction
interface ApiSection {
  [key: string]: string | number | boolean | string[] | undefined | null;
}
interface ApiProfile {
  personal?: ApiSection;
  location?: ApiSection;
  religion?: ApiSection;
  education?: ApiSection;
  employment?: ApiSection;
  family?: ApiSection;
  lifestyle?: ApiSection;
  about?: ApiSection;
  partnerPreference?: ApiSection & {
    religions?: string[];
    communities?: string[];
    castes?: string[];
    motherTongues?: string[];
    countries?: string[];
    states?: string[];
    cities?: string[];
    educationLevels?: string[];
    occupations?: string[];
    maritalStatuses?: string[];
  };
}
interface ApiProfileResponse {
  profile?: ApiProfile;
  data?: { profile?: ApiProfile };
  personal?: ApiSection;
  location?: ApiSection;
  religion?: ApiSection;
  education?: ApiSection;
  employment?: ApiSection;
  family?: ApiSection;
  lifestyle?: ApiSection;
  about?: ApiSection;
  partnerPreference?: ApiProfile['partnerPreference'];
}

function apiStr(section: ApiSection | undefined, key: string): string {
  const v = section?.[key];
  return v != null ? String(v) : '';
}

function apiArr(section: ApiSection | undefined, key: string): string {
  const v = section?.[key];
  return Array.isArray(v) ? v.join(', ') : '';
}

// Parse API response into draft
function apiToDraft(data: Record<string, unknown>): ProfileDraft {
  const d = emptyDraft();
  const raw = data as ApiProfileResponse;
  const p: ApiProfile = raw.profile ?? raw.data?.profile ?? (raw as ApiProfile);

  d.personal.firstName = apiStr(p.personal, 'firstName');
  d.personal.lastName = apiStr(p.personal, 'lastName');
  d.personal.gender = apiStr(p.personal, 'gender');
  const dob = apiStr(p.personal, 'dateOfBirth');
  d.personal.dateOfBirth = dob ? dob.slice(0, 10) : '';
  d.personal.maritalStatus = apiStr(p.personal, 'maritalStatus');
  const hcm = p.personal?.heightCm;
  d.personal.heightCm = hcm != null ? String(hcm) : '';
  const wkg = p.personal?.weightKg;
  d.personal.weightKg = wkg != null ? String(wkg) : '';
  const nc = p.personal?.numberOfChildren;
  d.personal.numberOfChildren = nc != null ? String(nc) : '';
  d.personal.disabilityStatus = apiStr(p.personal, 'disabilityStatus');

  d.location.country = apiStr(p.location, 'country') || 'Australia';
  d.location.state = apiStr(p.location, 'state');
  d.location.city = apiStr(p.location, 'city');
  d.location.suburb = apiStr(p.location, 'suburb');
  d.location.citizenshipStatus = apiStr(p.location, 'citizenshipStatus');
  d.location.visaStatus = apiStr(p.location, 'visaStatus');

  d.religion.religion = apiStr(p.religion, 'religion');
  d.religion.community = apiStr(p.religion, 'community');
  d.religion.caste = apiStr(p.religion, 'caste');
  d.religion.subCaste = apiStr(p.religion, 'subCaste');
  d.religion.motherTongue = apiStr(p.religion, 'motherTongue');
  d.religion.languagesSpoken = apiArr(p.religion, 'languagesSpoken');

  d.education.highestQualification = apiStr(p.education, 'highestQualification');
  d.education.institutionName = apiStr(p.education, 'institutionName');
  const gy = p.education?.graduationYear;
  d.education.graduationYear = gy != null ? String(gy) : '';
  d.education.additionalCertifications = apiArr(p.education, 'additionalCertifications');

  d.employment.occupation = apiStr(p.employment, 'occupation');
  d.employment.industry = apiStr(p.employment, 'industry');
  d.employment.employmentStatus = apiStr(p.employment, 'employmentStatus');
  d.employment.employerName = apiStr(p.employment, 'employerName');
  const ai = p.employment?.annualIncome;
  d.employment.annualIncome = ai != null ? String(ai) : '';
  d.employment.annualIncomeVisibility = apiStr(p.employment, 'annualIncomeVisibility');

  d.family.fatherDetails = apiStr(p.family, 'fatherDetails');
  d.family.motherDetails = apiStr(p.family, 'motherDetails');
  d.family.siblingDetails = apiStr(p.family, 'siblingDetails');
  d.family.familyValues = apiStr(p.family, 'familyValues');
  d.family.familyType = apiStr(p.family, 'familyType');

  d.lifestyle.smokingHabits = apiStr(p.lifestyle, 'smokingHabits');
  d.lifestyle.drinkingHabits = apiStr(p.lifestyle, 'drinkingHabits');
  d.lifestyle.dietaryPreferences = apiStr(p.lifestyle, 'dietaryPreferences');
  d.lifestyle.fitnessInterests = apiArr(p.lifestyle, 'fitnessInterests');
  d.lifestyle.religiousPractices = apiStr(p.lifestyle, 'religiousPractices');

  d.about.aboutMe = apiStr(p.about, 'aboutMe');
  d.about.personalGoals = apiStr(p.about, 'personalGoals');
  d.about.hobbies = apiArr(p.about, 'hobbies');
  d.about.interests = apiArr(p.about, 'interests');
  d.about.partnerExpectations = apiStr(p.about, 'partnerExpectations');

  const pref = p.partnerPreference;
  d.partnerPreference.ageMin = pref?.ageMin != null ? String(pref.ageMin) : '';
  d.partnerPreference.ageMax = pref?.ageMax != null ? String(pref.ageMax) : '';
  d.partnerPreference.heightMinCm = pref?.heightMinCm != null ? String(pref.heightMinCm) : '';
  d.partnerPreference.heightMaxCm = pref?.heightMaxCm != null ? String(pref.heightMaxCm) : '';
  d.partnerPreference.religions = Array.isArray(pref?.religions) ? pref.religions.join(', ') : '';
  d.partnerPreference.communities = Array.isArray(pref?.communities)
    ? pref.communities.join(', ')
    : '';
  d.partnerPreference.castes = Array.isArray(pref?.castes) ? pref.castes.join(', ') : '';
  d.partnerPreference.motherTongues = Array.isArray(pref?.motherTongues)
    ? pref.motherTongues.join(', ')
    : '';
  d.partnerPreference.countries = Array.isArray(pref?.countries) ? pref.countries.join(', ') : '';
  d.partnerPreference.states = Array.isArray(pref?.states) ? pref.states.join(', ') : '';
  d.partnerPreference.cities = Array.isArray(pref?.cities) ? pref.cities.join(', ') : '';
  d.partnerPreference.educationLevels = Array.isArray(pref?.educationLevels)
    ? pref.educationLevels.join(', ')
    : '';
  d.partnerPreference.occupations = Array.isArray(pref?.occupations)
    ? pref.occupations.join(', ')
    : '';
  d.partnerPreference.incomeMin = pref?.incomeMin != null ? String(pref.incomeMin) : '';
  d.partnerPreference.incomeMax = pref?.incomeMax != null ? String(pref.incomeMax) : '';
  d.partnerPreference.maritalStatuses = Array.isArray(pref?.maritalStatuses)
    ? pref.maritalStatuses.join(', ')
    : '';

  return d;
}

// Build API payload from draft
function draftToPayload(draft: ProfileDraft) {
  const csv = (s: string) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
  const str = (s: string) => (s.trim() === '' ? undefined : s.trim());

  return {
    personal: {
      firstName: str(draft.personal.firstName),
      lastName: str(draft.personal.lastName),
      gender: str(draft.personal.gender),
      dateOfBirth: str(draft.personal.dateOfBirth),
      maritalStatus: str(draft.personal.maritalStatus),
      heightCm: num(draft.personal.heightCm),
      weightKg: num(draft.personal.weightKg),
      numberOfChildren: num(draft.personal.numberOfChildren),
      disabilityStatus: str(draft.personal.disabilityStatus),
    },
    location: {
      country: str(draft.location.country),
      state: str(draft.location.state),
      city: str(draft.location.city),
      suburb: str(draft.location.suburb),
      citizenshipStatus: str(draft.location.citizenshipStatus),
      visaStatus: str(draft.location.visaStatus),
    },
    religion: {
      religion: str(draft.religion.religion),
      community: str(draft.religion.community),
      caste: str(draft.religion.caste),
      subCaste: str(draft.religion.subCaste),
      motherTongue: str(draft.religion.motherTongue),
      languagesSpoken: csv(draft.religion.languagesSpoken),
    },
    education: {
      highestQualification: str(draft.education.highestQualification),
      institutionName: str(draft.education.institutionName),
      graduationYear: num(draft.education.graduationYear),
      additionalCertifications: csv(draft.education.additionalCertifications),
    },
    employment: {
      occupation: str(draft.employment.occupation),
      industry: str(draft.employment.industry),
      employmentStatus: str(draft.employment.employmentStatus),
      employerName: str(draft.employment.employerName),
      annualIncome: num(draft.employment.annualIncome),
      annualIncomeVisibility: str(draft.employment.annualIncomeVisibility),
    },
    family: {
      fatherDetails: str(draft.family.fatherDetails),
      motherDetails: str(draft.family.motherDetails),
      siblingDetails: str(draft.family.siblingDetails),
      familyValues: str(draft.family.familyValues),
      familyType: str(draft.family.familyType),
    },
    lifestyle: {
      smokingHabits: str(draft.lifestyle.smokingHabits),
      drinkingHabits: str(draft.lifestyle.drinkingHabits),
      dietaryPreferences: str(draft.lifestyle.dietaryPreferences),
      fitnessInterests: csv(draft.lifestyle.fitnessInterests),
      religiousPractices: str(draft.lifestyle.religiousPractices),
    },
    about: {
      aboutMe: str(draft.about.aboutMe),
      personalGoals: str(draft.about.personalGoals),
      hobbies: csv(draft.about.hobbies),
      interests: csv(draft.about.interests),
      partnerExpectations: str(draft.about.partnerExpectations),
    },
    partnerPreference: {
      ageMin: num(draft.partnerPreference.ageMin),
      ageMax: num(draft.partnerPreference.ageMax),
      heightMinCm: num(draft.partnerPreference.heightMinCm),
      heightMaxCm: num(draft.partnerPreference.heightMaxCm),
      religions: csv(draft.partnerPreference.religions),
      communities: csv(draft.partnerPreference.communities),
      castes: csv(draft.partnerPreference.castes),
      motherTongues: csv(draft.partnerPreference.motherTongues),
      countries: csv(draft.partnerPreference.countries),
      states: csv(draft.partnerPreference.states),
      cities: csv(draft.partnerPreference.cities),
      educationLevels: csv(draft.partnerPreference.educationLevels),
      occupations: csv(draft.partnerPreference.occupations),
      incomeMin: num(draft.partnerPreference.incomeMin),
      incomeMax: num(draft.partnerPreference.incomeMax),
      maritalStatuses: csv(draft.partnerPreference.maritalStatuses),
    },
  };
}

// ─── Sub-field components ─────────────────────────────────────────────────────

function Field({
  label,
  optional,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  optional?: boolean | undefined;
  type?: string | undefined;
  placeholder?: string | undefined;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
      <span className="flex items-baseline gap-1.5">
        {label}
        {optional ? <span className="text-xs font-normal text-[#6B7280]">optional</span> : null}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-12 rounded-2xl border bg-[#FFF9F5]/50 px-4 text-sm outline-none transition duration-200 focus:bg-white',
          'focus:ring-4 focus:ring-[#FFF0F3]',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-[#A10E4D]/15 focus:border-[#A10E4D]',
        )}
      />
      {hint ? <span className="text-xs font-normal text-[#6B7280]">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  optional,
  value,
  onChange,
  options,
  error,
  hint,
}: {
  label: string;
  optional?: boolean | undefined;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
      <span className="flex items-baseline gap-1.5">
        {label}
        {optional ? <span className="text-xs font-normal text-[#6B7280]">optional</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-12 rounded-2xl border bg-[#FFF9F5]/50 px-4 text-sm outline-none transition duration-200 focus:bg-white',
          'focus:ring-4 focus:ring-[#FFF0F3]',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-[#A10E4D]/15 focus:border-[#A10E4D]',
        )}
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs font-normal text-[#6B7280]">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  optional,
  value,
  onChange,
  rows = 4,
  placeholder,
  error,
  hint,
}: {
  label: string;
  optional?: boolean | undefined;
  value: string;
  onChange: (v: string) => void;
  rows?: number | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#2F2F2F]">
      <span className="flex items-baseline gap-1.5">
        {label}
        {optional ? <span className="text-xs font-normal text-[#6B7280]">optional</span> : null}
      </span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'rounded-2xl border bg-[#FFF9F5]/50 px-4 py-3 text-sm outline-none transition duration-200 focus:bg-white',
          'focus:ring-4 focus:ring-[#FFF0F3]',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-[#A10E4D]/15 focus:border-[#A10E4D]',
        )}
      />
      {hint ? <span className="text-xs font-normal text-[#6B7280]">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────────

type StepErrors = Record<string, string>;

// Step 1: Basic Details
function StepBasicDetails({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['personal']>) => void;
  errors: StepErrors;
}) {
  const p = draft.personal;
  return (
    <div className="grid gap-5">
      <SectionTitle icon="👤" title="Basic Details" />
      <p className="text-sm leading-6 text-[#6B7280]">
        Start with the essentials. You can add more personal detail after your core profile is in
        place.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="First name"
          value={p.firstName}
          onChange={(v) => onChange({ firstName: v })}
          error={errors.firstName}
        />
        <Field
          label="Last name"
          value={p.lastName}
          onChange={(v) => onChange({ lastName: v })}
          error={errors.lastName}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Gender"
          value={p.gender}
          onChange={(v) => onChange({ gender: v })}
          error={errors.gender}
          options={[
            { value: 'FEMALE', label: 'Female' },
            { value: 'MALE', label: 'Male' },
            { value: 'NON_BINARY', label: 'Non-binary' },
            { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
          ]}
        />
        <Field
          label="Date of birth"
          type="date"
          value={p.dateOfBirth}
          onChange={(v) => onChange({ dateOfBirth: v })}
          error={errors.dateOfBirth}
        />
      </div>
      <SelectField
        label="Marital status"
        value={p.maritalStatus}
        onChange={(v) => onChange({ maritalStatus: v })}
        error={errors.maritalStatus}
        options={[
          { value: 'NEVER_MARRIED', label: 'Never married' },
          { value: 'DIVORCED', label: 'Divorced' },
          { value: 'WIDOWED', label: 'Widowed' },
          { value: 'SEPARATED', label: 'Separated' },
          { value: 'ANNULLED', label: 'Annulled' },
        ]}
      />
      <details className="rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
          Add optional personal details now
        </summary>
        <div className="mt-4 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Height (cm)"
              optional
              type="number"
              placeholder="e.g. 165"
              value={p.heightCm}
              onChange={(v) => onChange({ heightCm: v })}
              error={errors.heightCm}
            />
            <Field
              label="Weight (kg)"
              optional
              type="number"
              placeholder="e.g. 60"
              value={p.weightKg}
              onChange={(v) => onChange({ weightKg: v })}
              error={errors.weightKg}
            />
            <Field
              label="Number of children"
              optional
              type="number"
              placeholder="0"
              value={p.numberOfChildren}
              onChange={(v) => onChange({ numberOfChildren: v })}
              error={errors.numberOfChildren}
            />
          </div>
          <Field
            label="Disability / accessibility needs"
            optional
            placeholder="e.g. None"
            value={p.disabilityStatus}
            onChange={(v) => onChange({ disabilityStatus: v })}
            error={errors.disabilityStatus}
          />
        </div>
      </details>
    </div>
  );
}

// Step 2: Location
function StepLocation({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['location']>) => void;
  errors: StepErrors;
}) {
  const l = draft.location;
  return (
    <div className="grid gap-5">
      <SectionTitle icon="📍" title="Location & Residency" />
      <p className="text-sm leading-6 text-[#6B7280]">
        Your main location is enough to keep moving. Residency detail can be added now or later.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Country"
          value={l.country}
          onChange={(v) => onChange({ country: v })}
          error={errors.country}
        />
        <Field
          label="State / Territory"
          value={l.state}
          onChange={(v) => onChange({ state: v })}
          error={errors.state}
        />
      </div>
      <Field
        label="City"
        value={l.city}
        onChange={(v) => onChange({ city: v })}
        error={errors.city}
      />
      <details className="rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
          Add suburb and residency details
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field
            label="Suburb"
            optional
            value={l.suburb}
            onChange={(v) => onChange({ suburb: v })}
            error={errors.suburb}
          />
          <Field
            label="Citizenship status"
            optional
            placeholder="e.g. Australian Citizen"
            value={l.citizenshipStatus}
            onChange={(v) => onChange({ citizenshipStatus: v })}
            error={errors.citizenshipStatus}
          />
          <Field
            label="Visa status"
            optional
            placeholder="e.g. Permanent Resident"
            value={l.visaStatus}
            onChange={(v) => onChange({ visaStatus: v })}
            error={errors.visaStatus}
          />
        </div>
      </details>
    </div>
  );
}

// Step 3: Religion & Community
function StepReligion({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['religion']>) => void;
  errors: StepErrors;
}) {
  const r = draft.religion;
  return (
    <div className="grid gap-5">
      <SectionTitle icon="🕌" title="Religion & Community" />
      <p className="text-sm leading-6 text-[#6B7280]">
        Share only what helps introductions feel aligned. This can stay light and still be useful.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Religion"
          optional
          placeholder="e.g. Hindu, Muslim, Sikh"
          value={r.religion}
          onChange={(v) => onChange({ religion: v })}
          error={errors.religion}
        />
        <Field
          label="Community"
          optional
          placeholder="e.g. Punjabi, Tamil"
          value={r.community}
          onChange={(v) => onChange({ community: v })}
          error={errors.community}
        />
      </div>
      <details className="rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
          Add language, caste, or sub-community details
        </summary>
        <div className="mt-4 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Caste"
              optional
              placeholder="e.g. Brahmin"
              value={r.caste}
              onChange={(v) => onChange({ caste: v })}
              error={errors.caste}
            />
            <Field
              label="Sub-caste"
              optional
              value={r.subCaste}
              onChange={(v) => onChange({ subCaste: v })}
              error={errors.subCaste}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Mother tongue"
              optional
              placeholder="e.g. Hindi, Tamil"
              value={r.motherTongue}
              onChange={(v) => onChange({ motherTongue: v })}
              error={errors.motherTongue}
            />
            <Field
              label="Languages spoken"
              optional
              placeholder="English, Hindi, Tamil"
              value={r.languagesSpoken}
              onChange={(v) => onChange({ languagesSpoken: v })}
              hint="Comma-separated list"
              error={errors.languagesSpoken}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

// Step 4: Education & Career
function StepEducation({
  draft,
  onEdChange,
  onEmChange,
  errors,
}: {
  draft: ProfileDraft;
  onEdChange: (patch: Partial<ProfileDraft['education']>) => void;
  onEmChange: (patch: Partial<ProfileDraft['employment']>) => void;
  errors: StepErrors;
}) {
  const ed = draft.education;
  const em = draft.employment;
  return (
    <div className="grid gap-6">
      <SectionTitle icon="🎓" title="Education & Career" />
      <p className="text-sm leading-6 text-[#6B7280]">
        Keep this practical: the basics first, deeper academic and income context only if you want
        to add it now.
      </p>

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Education Details
        </p>
        <div className="grid gap-5">
          <Field
            label="Highest qualification"
            optional
            placeholder="e.g. Bachelor's Degree"
            value={ed.highestQualification}
            onChange={(v) => onEdChange({ highestQualification: v })}
            error={errors.highestQualification}
          />
          <details className="rounded-2xl border border-[#A10E4D]/10 bg-white/70 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
              Add institution and certification details
            </summary>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Institution name"
                optional
                placeholder="e.g. University of Sydney"
                value={ed.institutionName}
                onChange={(v) => onEdChange({ institutionName: v })}
                error={errors.highestQualification}
              />
              <Field
                label="Graduation year"
                optional
                type="number"
                placeholder="e.g. 2015"
                value={ed.graduationYear}
                onChange={(v) => onEdChange({ graduationYear: v })}
                error={errors.highestQualification}
              />
              <Field
                label="Additional certifications"
                optional
                placeholder="CPA, CFA, MBA"
                value={ed.additionalCertifications}
                onChange={(v) => onEdChange({ additionalCertifications: v })}
                hint="Comma-separated list"
                error={errors.highestQualification}
              />
            </div>
          </details>
        </div>
      </div>

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Employment details
        </p>
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Occupation"
              optional
              placeholder="e.g. Software Engineer"
              value={em.occupation}
              onChange={(v) => onEmChange({ occupation: v })}
              error={errors.highestQualification}
            />
            <Field
              label="Industry"
              optional
              placeholder="e.g. Technology"
              value={em.industry}
              onChange={(v) => onEmChange({ industry: v })}
              error={errors.highestQualification}
            />
          </div>
          <details className="rounded-2xl border border-[#A10E4D]/10 bg-white/70 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#A10E4D] outline-none">
              Add employer and income details
            </summary>
            <div className="mt-4 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Employment status"
                  optional
                  value={em.employmentStatus}
                  onChange={(v) => onEmChange({ employmentStatus: v })}
                  error={errors.highestQualification}
                  options={[
                    { value: 'EMPLOYED', label: 'Employed' },
                    { value: 'SELF_EMPLOYED', label: 'Self-employed' },
                    { value: 'BUSINESS_OWNER', label: 'Business owner' },
                    { value: 'STUDENT', label: 'Student' },
                    { value: 'NOT_EMPLOYED', label: 'Not employed' },
                    { value: 'RETIRED', label: 'Retired' },
                  ]}
                />
                <Field
                  label="Employer name"
                  optional
                  value={em.employerName}
                  onChange={(v) => onEmChange({ employerName: v })}
                  error={errors.highestQualification}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Annual income (AUD)"
                  optional
                  type="number"
                  placeholder="e.g. 80000"
                  value={em.annualIncome}
                  onChange={(v) => onEmChange({ annualIncome: v })}
                  error={errors.highestQualification}
                />
                <SelectField
                  label="Income visibility"
                  optional
                  value={em.annualIncomeVisibility}
                  onChange={(v) => onEmChange({ annualIncomeVisibility: v })}
                  error={errors.highestQualification}
                  options={[
                    { value: 'PRIVATE', label: 'Private (hidden from all)' },
                    { value: 'MATCHES_ONLY', label: 'Matches only' },
                    { value: 'PUBLIC', label: 'Public' },
                  ]}
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

// Step 5: Family
function StepFamily({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['family']>) => void;
  errors: StepErrors;
}) {
  const f = draft.family;
  return (
    <div className="grid gap-5">
      <SectionTitle icon="👨‍👩‍👧‍👦" title="Family Background" />
      <TextAreaField
        label="Father's details"
        optional
        rows={3}
        placeholder="Occupation, family location, background..."
        value={f.fatherDetails}
        onChange={(v) => onChange({ fatherDetails: v })}
        error={errors.fatherDetails}
      />
      <TextAreaField
        label="Mother's details"
        optional
        rows={3}
        placeholder="Occupation, background, status..."
        value={f.motherDetails}
        onChange={(v) => onChange({ motherDetails: v })}
        error={errors.motherDetails}
      />
      <TextAreaField
        label="Sibling details"
        optional
        rows={3}
        placeholder="Number of brothers/sisters, occupations..."
        value={f.siblingDetails}
        onChange={(v) => onChange({ siblingDetails: v })}
        error={errors.siblingDetails}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Family values"
          optional
          placeholder="e.g. Traditional, Moderate, Modern"
          value={f.familyValues}
          onChange={(v) => onChange({ familyValues: v })}
          error={errors.familyValues}
        />
        <Field
          label="Family type"
          optional
          placeholder="e.g. Nuclear, Joint, Extended"
          value={f.familyType}
          onChange={(v) => onChange({ familyType: v })}
          error={errors.familyType}
        />
      </div>
    </div>
  );
}

// Step 6: Lifestyle
function StepLifestyle({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['lifestyle']>) => void;
  errors: StepErrors;
}) {
  const l = draft.lifestyle;
  const habitOpts = [
    { value: 'NEVER', label: 'Never' },
    { value: 'OCCASIONALLY', label: 'Occasionally' },
    { value: 'SOCIALLY', label: 'Socially' },
    { value: 'REGULARLY', label: 'Regularly' },
  ];
  return (
    <div className="grid gap-5">
      <SectionTitle icon="🌿" title="Lifestyle & Habits" />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Smoking habits"
          optional
          value={l.smokingHabits}
          onChange={(v) => onChange({ smokingHabits: v })}
          error={errors.smokingHabits}
          options={habitOpts}
        />
        <SelectField
          label="Drinking habits"
          optional
          value={l.drinkingHabits}
          onChange={(v) => onChange({ drinkingHabits: v })}
          error={errors.drinkingHabits}
          options={habitOpts}
        />
      </div>
      <SelectField
        label="Dietary preferences"
        optional
        value={l.dietaryPreferences}
        onChange={(v) => onChange({ dietaryPreferences: v })}
        error={errors.dietaryPreferences}
        options={[
          { value: 'VEGETARIAN', label: 'Vegetarian' },
          { value: 'NON_VEGETARIAN', label: 'Non-vegetarian' },
          { value: 'VEGAN', label: 'Vegan' },
          { value: 'JAIN', label: 'Jain' },
          { value: 'EGGETARIAN', label: 'Eggetarian' },
          { value: 'HALAL', label: 'Halal' },
          { value: 'NO_PREFERENCE', label: 'No preference' },
        ]}
      />
      <Field
        label="Fitness interests"
        optional
        placeholder="Yoga, gym, running, swimming..."
        value={l.fitnessInterests}
        onChange={(v) => onChange({ fitnessInterests: v })}
        hint="Comma-separated list"
        error={errors.fitnessInterests}
      />
      <TextAreaField
        label="Religious practices"
        optional
        rows={3}
        placeholder="Describe your religious routines or values..."
        value={l.religiousPractices}
        onChange={(v) => onChange({ religiousPractices: v })}
        error={errors.religiousPractices}
      />
    </div>
  );
}

// Step 7: About Me
function StepAbout({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['about']>) => void;
  errors: StepErrors;
}) {
  const a = draft.about;
  return (
    <div className="grid gap-5">
      <SectionTitle icon="✍️" title="About Me & Expectations" />
      <TextAreaField
        label="About me"
        rows={5}
        placeholder="Introduce yourself, your personality, values, hobbies, and outlook on marriage... (min 20 characters)"
        value={a.aboutMe}
        onChange={(v) => onChange({ aboutMe: v })}
        error={errors.aboutMe}
      />
      <TextAreaField
        label="Personal goals"
        optional
        rows={3}
        placeholder="Aspirations, life philosophy, or career vision..."
        value={a.personalGoals}
        onChange={(v) => onChange({ personalGoals: v })}
        error={errors.personalGoals}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Hobbies"
          optional
          placeholder="Travel, cooking, reading, dancing"
          value={a.hobbies}
          onChange={(v) => onChange({ hobbies: v })}
          hint="Comma-separated list"
          error={errors.hobbies}
        />
        <Field
          label="Interests"
          optional
          placeholder="Music, hiking, photography, yoga"
          value={a.interests}
          onChange={(v) => onChange({ interests: v })}
          hint="Comma-separated list"
          error={errors.interests}
        />
      </div>
      <TextAreaField
        label="Partner expectations"
        optional
        rows={4}
        placeholder="Describe the values, attributes, or mindset you expect in your future partner..."
        value={a.partnerExpectations}
        onChange={(v) => onChange({ partnerExpectations: v })}
        error={errors.partnerExpectations}
      />
    </div>
  );
}

// Step 8: Photos
interface MediaItem {
  id: string;
  assetUrl: string;
  category: string;
  isPrimary: boolean;
  approvalStatus: string;
}

interface MediaResponseData {
  media?: MediaItem[];
}

interface UploadFields {
  public_id: string;
  [key: string]: string;
}

interface UploadData {
  provider: string;
  url: string;
  fields: UploadFields;
}

interface SignUploadResponse {
  media: { id: string };
  upload: UploadData;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  message?: string;
}

function StepPhotos({ memberRequest }: { memberRequest: ReturnType<typeof useMemberRequest> }) {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('PROFILE_PHOTO');
  const [visibility, setVisibility] = useState('PUBLIC');

  async function loadMedia() {
    const result = await memberRequest('/api/me/media');
    if (result.ok && result.data) {
      setMediaList((result.data as MediaResponseData).media ?? []);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMsg({ text: 'Please choose an image file first.', ok: false });
      return;
    }
    setUploading(true);
    setMsg(null);

    const payload = {
      category,
      visibility,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    };
    const parsed = mediaSignUploadSchema.safeParse(payload);
    if (!parsed.success) {
      setMsg({ text: parsed.error.issues[0]?.message ?? 'Invalid file specifications', ok: false });
      setUploading(false);
      return;
    }

    const signed = await memberRequest('/api/me/media/sign-upload', {
      method: 'POST',
      body: parsed.data,
    });
    if (!signed.ok || !signed.data) {
      setMsg({ text: signed.message, ok: false });
      setUploading(false);
      return;
    }

    const signedBody = signed.data as unknown as SignUploadResponse;
    let assetUrl = `http://localhost:4000/api/mock-storage/${signedBody.upload.fields.public_id}`;
    let storageKey = signedBody.upload.fields.public_id;

    if (signedBody.upload.provider === 'cloudinary') {
      const cf = new FormData();
      Object.entries(signedBody.upload.fields).forEach(([k, v]) => cf.append(k, v));
      cf.append('file', file);
      const up = await fetch(signedBody.upload.url, { method: 'POST', body: cf });
      const upJson = (await up.json()) as CloudinaryUploadResponse;
      if (!up.ok || !upJson.secure_url) {
        setMsg({ text: upJson.message ?? 'Upload failed', ok: false });
        setUploading(false);
        return;
      }
      assetUrl = upJson.secure_url;
      storageKey = upJson.public_id ?? storageKey;
    }

    const completed = await memberRequest('/api/me/media/complete', {
      method: 'POST',
      body: { mediaId: signedBody.media.id, assetUrl, storageKey, bytes: file.size },
    });
    setMsg({ text: completed.message, ok: completed.ok });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    await loadMedia();
  }

  return (
    <div className="grid gap-6">
      <SectionTitle icon="📸" title="Profile Gallery" />

      {/* Upload zone */}
      <div className="border-2 border-dashed border-[#A10E4D]/20 hover:border-[#A10E4D]/40 rounded-3xl bg-[#FFF9F5] p-6 text-center transition flex flex-col items-center justify-center gap-4">
        <div className="size-12 rounded-2xl bg-[#FFF0F3] flex items-center justify-center text-[#A10E4D] shadow-sm">
          <ImagePlus className="size-6" />
        </div>
        <div className="max-w-md">
          <p className="font-semibold text-sm text-[#2F2F2F]">
            Upload your profile and gallery photos
          </p>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            Please choose a recent, clear face photo. Uploaded files require automatic admin
            moderation before publication.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-lg sm:grid-cols-3 mt-2 text-left">
          <label className="grid gap-1.5 text-xs font-bold text-[#2F2F2F]">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-white px-3 text-xs outline-none focus:border-[#A10E4D]"
            >
              <option value="PROFILE_PHOTO">Profile photo</option>
              <option value="PUBLIC_GALLERY">Public gallery</option>
              <option value="PRIVATE_GALLERY">Private gallery</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#2F2F2F]">
            Visibility
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-white px-3 text-xs outline-none focus:border-[#A10E4D]"
            >
              <option value="PUBLIC">Public</option>
              <option value="MATCHES_ONLY">Matches only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#2F2F2F]">
            Select File
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="h-10 rounded-xl border border-[#A10E4D]/15 bg-white px-2 py-1.5 text-[10px] outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={uploading}
          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-[#A10E4D] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#A10E4D]/15 hover:bg-[#890B40] disabled:opacity-50 transition"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? 'Uploading...' : 'Upload Media File'}
        </button>
      </div>

      {msg ? (
        <div
          className={cx(
            'flex items-start gap-2 rounded-2xl p-4 text-xs font-semibold animate-fade-in',
            msg.ok
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-[#FDECEF] text-[#A10E4D] border border-red-200',
          )}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {msg.text}
        </div>
      ) : null}

      {/* Grid of uploaded images */}
      {mediaList.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mt-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="relative group overflow-hidden rounded-2xl border border-[#A10E4D]/10 bg-white shadow-sm hover:shadow-md transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.assetUrl}
                alt="Matrimonial Photo"
                className="aspect-square w-full object-cover"
              />
              <div className="p-2 border-t border-[#A10E4D]/5 bg-[#FFF9F5]/50">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded bg-white border border-[#A10E4D]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#A10E4D]">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={cx(
                      'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                      item.approvalStatus === 'APPROVED'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200',
                    )}
                  >
                    {item.approvalStatus}
                  </span>
                  {item.isPrimary && (
                    <span className="rounded bg-[#D4A04C]/20 border border-[#D4A04C] px-1.5 py-0.5 text-[9px] font-bold text-[#A10E4D]">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#A10E4D]/20 py-12 text-center bg-[#FFF9F5]/30">
          <ImagePlus className="mb-3 size-8 text-[#A10E4D]/20" />
          <p className="text-sm font-semibold text-[#6B7280]">No photo media uploaded yet</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            A complete profile with a primary photo attracts 3x more interests.
          </p>
        </div>
      )}
    </div>
  );
}

// Step 9: Partner Preferences
function StepPartnerPrefs({
  draft,
  onChange,
  errors,
}: {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft['partnerPreference']>) => void;
  errors: StepErrors;
}) {
  const pp = draft.partnerPreference;
  return (
    <div className="grid gap-6">
      <SectionTitle icon="💑" title="Partner Preferences" />

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Age & Height expectations
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Min age preference"
            optional
            type="number"
            placeholder="e.g. 24"
            value={pp.ageMin}
            onChange={(v) => onChange({ ageMin: v })}
            error={errors.ageMin}
          />
          <Field
            label="Max age preference"
            optional
            type="number"
            placeholder="e.g. 36"
            value={pp.ageMax}
            onChange={(v) => onChange({ ageMax: v })}
            error={errors.ageMax}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Min height (cm)"
            optional
            type="number"
            placeholder="e.g. 150"
            value={pp.heightMinCm}
            onChange={(v) => onChange({ heightMinCm: v })}
            error={errors.heightMinCm}
          />
          <Field
            label="Max height (cm)"
            optional
            type="number"
            placeholder="e.g. 190"
            value={pp.heightMaxCm}
            onChange={(v) => onChange({ heightMaxCm: v })}
            error={errors.heightMaxCm}
          />
        </div>
      </div>

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Background & Language expectations
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred religions"
            optional
            placeholder="e.g. Hindu, Sikh"
            value={pp.religions}
            onChange={(v) => onChange({ religions: v })}
            hint="Comma-separated list"
            error={errors.religions}
          />
          <Field
            label="Preferred communities"
            optional
            placeholder="e.g. Punjabi, Tamil"
            value={pp.communities}
            onChange={(v) => onChange({ communities: v })}
            hint="Comma-separated list"
            error={errors.communities}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred castes"
            optional
            placeholder="e.g. Brahmin, Jat"
            value={pp.castes}
            onChange={(v) => onChange({ castes: v })}
            hint="Comma-separated list"
            error={errors.castes}
          />
          <Field
            label="Preferred mother tongues"
            optional
            placeholder="e.g. Hindi, Tamil"
            value={pp.motherTongues}
            onChange={(v) => onChange({ motherTongues: v })}
            hint="Comma-separated list"
            error={errors.motherTongues}
          />
        </div>
      </div>

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Location expectations
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Preferred countries"
            optional
            placeholder="e.g. Australia"
            value={pp.countries}
            onChange={(v) => onChange({ countries: v })}
            hint="Comma-separated"
            error={errors.countries}
          />
          <Field
            label="Preferred states"
            optional
            placeholder="e.g. NSW, VIC"
            value={pp.states}
            onChange={(v) => onChange({ states: v })}
            hint="Comma-separated"
            error={errors.states}
          />
          <Field
            label="Preferred cities"
            optional
            placeholder="e.g. Sydney, Melbourne"
            value={pp.cities}
            onChange={(v) => onChange({ cities: v })}
            hint="Comma-separated"
            error={errors.cities}
          />
        </div>
      </div>

      <div className="grid gap-4 bg-[#FFF9F5] p-4 rounded-2xl border border-[#A10E4D]/5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A10E4D]">
          Education & Career expectations
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred education levels"
            optional
            placeholder="e.g. Bachelor's, Master's"
            value={pp.educationLevels}
            onChange={(v) => onChange({ educationLevels: v })}
            hint="Comma-separated list"
            error={errors.educationLevels}
          />
          <Field
            label="Preferred occupations"
            optional
            placeholder="e.g. Software, Manager"
            value={pp.occupations}
            onChange={(v) => onChange({ occupations: v })}
            hint="Comma-separated list"
            error={errors.occupations}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Min annual income (AUD)"
            optional
            type="number"
            placeholder="80000"
            value={pp.incomeMin}
            onChange={(v) => onChange({ incomeMin: v })}
            error={errors.incomeMin}
          />
          <Field
            label="Max annual income (AUD)"
            optional
            type="number"
            placeholder="200000"
            value={pp.incomeMax}
            onChange={(v) => onChange({ incomeMax: v })}
            error={errors.incomeMax}
          />
        </div>
      </div>

      <Field
        label="Accepted marital statuses"
        optional
        placeholder="NEVER_MARRIED, DIVORCED"
        value={pp.maritalStatuses}
        onChange={(v) => onChange({ maritalStatuses: v })}
        hint="Comma-separated: NEVER_MARRIED, DIVORCED, WIDOWED, SEPARATED, ANNULLED"
        error={errors.maritalStatuses}
      />
    </div>
  );
}

// Step 10: Verification
function StepVerification({
  onSubmit,
  pending,
  submitMsg,
}: {
  onSubmit: () => void;
  pending: boolean;
  submitMsg: string | null;
}) {
  return (
    <div className="grid gap-6">
      <SectionTitle icon="✅" title="Review & Submit Profile" />

      <div className="rounded-3xl border border-[#D4A04C]/30 bg-[#FFFDF0] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[#FFF9F5] flex items-center justify-center text-[#D4A04C] border border-[#D4A04C]/20 shadow-sm shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="font-bold text-[#2F2F2F] text-sm">Ready to submit for approval?</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Your profile details will be moderated by the Vivah Australia team within 24–48 hours.
            </p>
          </div>
        </div>
        <ul className="mb-6 grid gap-2 text-xs font-semibold text-[#4B5563]">
          {[
            'All inputted information is genuine and accurate',
            'Uploaded photos comply with facial clarity requirements',
            'Content respects community guidelines',
            'Confirming you are at least 18 years of age',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 text-[#D4A04C] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#D4A04C] px-6 py-2.5 text-xs font-bold text-[#2F2F2F] shadow-lg shadow-[#D4A04C]/20 hover:bg-[#c9a126] transition disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4 shrink-0" />
          )}
          {pending ? 'Submitting draft...' : 'Submit Matrimonial Profile'}
        </button>
      </div>

      <div className="rounded-3xl border border-[#A10E4D]/10 bg-[#FFF9F5]/20 p-5 shadow-sm">
        <p className="mb-1.5 text-sm font-bold text-[#2F2F2F]">Verify your identity documents</p>
        <p className="mb-4 text-xs leading-relaxed text-[#6B7280]">
          Verified members receive up to 5x higher compatible match search priority. Submit
          government-issued ID or residency details to secure high-trust gold badges.
        </p>
        <Link
          href="/member/verification"
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#A10E4D]/20 bg-white px-5 py-2 text-xs font-semibold text-[#A10E4D] shadow-sm hover:bg-[#FFF0F3] transition"
        >
          <ShieldCheck className="size-4" />
          Go to Verification Centre
        </Link>
      </div>

      {submitMsg ? (
        <div className="flex items-start gap-2 rounded-2xl bg-[#FDECEF] p-4 text-xs font-semibold text-[#A10E4D] border border-red-200 animate-fade-in">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {submitMsg}
        </div>
      ) : null}
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-3 border-b border-[#A10E4D]/5 pb-3">
      <span className="text-2xl shrink-0">{icon}</span>
      <h2 className="text-base font-bold text-[#2F2F2F]">{title}</h2>
    </div>
  );
}

function journeyCompletionCount(step: number, mode: 'onboarding' | 'edit') {
  if (mode === 'edit') {
    return STEPS.length;
  }

  return Math.max(0, step);
}

// ─── Main wizard component ────────────────────────────────────────────────────

export default function ProfileForm({ mode }: Readonly<{ mode: 'onboarding' | 'edit' }>) {
  const router = useRouter();
  const memberRequest = useMemberRequest();
  const [step, setStep] = useState(0); // 0-indexed
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [errors, setErrors] = useState<StepErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing profile on mount
  useEffect(() => {
    async function load() {
      const result = await memberRequest('/api/me/profile');
      if (result.ok && result.data) {
        interface RawProfile {
          id: string;
          verification?: {
            mobileVerified?: boolean;
            emailVerified?: boolean;
          };
          moderation?: {
            approvalStatus?: string;
          };
        }
        const rawProfile = (result.data as { profile?: RawProfile }).profile;
        if (rawProfile?.id) {
          setProfileId(rawProfile.id);
        }

        // Guard if onboarding mode is active
        if (mode === 'onboarding') {
          if (rawProfile?.moderation?.approvalStatus && rawProfile.moderation.approvalStatus !== 'DRAFT') {
            router.replace('/member');
            return;
          }
        }

        setDraft(apiToDraft(result.data as Record<string, unknown>));
      }
      setLoading(false);
    }
    void load();
  }, [mode, router, memberRequest]);

  function showToast(text: string, ok: boolean) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  }

  // Validate required fields for step 0 (Basic Details)
  function validateStep0(): StepErrors {
    const errs: StepErrors = {};
    if (!draft.personal.firstName.trim()) errs.firstName = 'First name is required';
    if (!draft.personal.lastName.trim()) errs.lastName = 'Last name is required';
    if (!draft.personal.gender) errs.gender = 'Please select your gender';
    if (!draft.personal.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!draft.personal.maritalStatus) errs.maritalStatus = 'Please select your marital status';
    return errs;
  }

  function validateStep1(): StepErrors {
    const errs: StepErrors = {};
    if (!draft.location.country.trim()) errs.country = 'Country is required';
    if (!draft.location.state.trim()) errs.state = 'State is required';
    if (!draft.location.city.trim()) errs.city = 'City is required';
    return errs;
  }

  function validateCurrentStep(): StepErrors {
    if (step === 0) return validateStep0();
    if (step === 1) return validateStep1();
    return {};
  }

  async function saveDraft(silent = false) {
    if (!silent) setSaving(true);
    const payload = draftToPayload(draft);
    const parsed = profileDraftSchema.safeParse(payload);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? 'Please check your details', false);
      if (!silent) setSaving(false);
      return false;
    }
    const result = await memberRequest('/api/me/profile', {
      method: 'PATCH',
      body: parsed.data as unknown as Record<string, unknown>,
    });
    if (!silent) {
      showToast(result.ok ? 'Draft saved successfully' : result.message, result.ok);
      setSaving(false);
    }
    return result.ok;
  }

  async function handleSaveAndContinue() {
    const errs = validateCurrentStep();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    const payload = draftToPayload(draft);
    const parsed = profileDraftSchema.safeParse(payload);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? 'Please check your details', false);
      setSaving(false);
      return;
    }
    const result = await memberRequest('/api/me/profile', {
      method: 'PATCH',
      body: parsed.data as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, false);
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else showToast('All sections complete! You can submit your profile.', true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const result = await memberRequest('/api/me/profile/submit', {
      method: 'POST',
      body: { confirm: true },
    });
    setSubmitMsg(result.message);
    setSubmitting(false);
    if (result.ok) {
      showToast('Profile onboarding submitted successfully', true);
      setTimeout(() => {
        router.push('/member');
      }, 1500);
    }
  }

  // Patch helpers per section
  const patchPersonal = useCallback(
    (patch: Partial<ProfileDraft['personal']>) =>
      setDraft((d) => ({ ...d, personal: { ...d.personal, ...patch } })),
    [],
  );
  const patchLocation = useCallback(
    (patch: Partial<ProfileDraft['location']>) =>
      setDraft((d) => ({ ...d, location: { ...d.location, ...patch } })),
    [],
  );
  const patchReligion = useCallback(
    (patch: Partial<ProfileDraft['religion']>) =>
      setDraft((d) => ({ ...d, religion: { ...d.religion, ...patch } })),
    [],
  );
  const patchEducation = useCallback(
    (patch: Partial<ProfileDraft['education']>) =>
      setDraft((d) => ({ ...d, education: { ...d.education, ...patch } })),
    [],
  );
  const patchEmployment = useCallback(
    (patch: Partial<ProfileDraft['employment']>) =>
      setDraft((d) => ({ ...d, employment: { ...d.employment, ...patch } })),
    [],
  );
  const patchFamily = useCallback(
    (patch: Partial<ProfileDraft['family']>) =>
      setDraft((d) => ({ ...d, family: { ...d.family, ...patch } })),
    [],
  );
  const patchLifestyle = useCallback(
    (patch: Partial<ProfileDraft['lifestyle']>) =>
      setDraft((d) => ({ ...d, lifestyle: { ...d.lifestyle, ...patch } })),
    [],
  );
  const patchAbout = useCallback(
    (patch: Partial<ProfileDraft['about']>) =>
      setDraft((d) => ({ ...d, about: { ...d.about, ...patch } })),
    [],
  );
  const patchPartnerPreference = useCallback(
    (patch: Partial<ProfileDraft['partnerPreference']>) =>
      setDraft((d) => ({ ...d, partnerPreference: { ...d.partnerPreference, ...patch } })),
    [],
  );

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLastStep = step === STEPS.length - 1;
  const currentStepMeta = STEP_META[step] ?? STEP_META[0];
  const completedSteps = journeyCompletionCount(step, mode);
  const remainingSteps = Math.max(0, STEPS.length - (step + 1));

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-3xl border border-[#A10E4D]/10 bg-white">
        <Loader2 className="size-6 animate-spin text-[#A10E4D]" />
        <span className="ml-3 text-sm font-semibold text-[#6B7280]">
          Loading your matrimonial profile...
        </span>
      </div>
    );
  }

  return (
    <div className="relative grid gap-6">
      {/* Toast */}
      {toast ? (
        <div
          className={cx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl transition-all animate-fade-in',
            toast.ok ? 'bg-green-600 text-white' : 'bg-[#A10E4D] text-white',
          )}
        >
          {toast.ok ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.text}
        </div>
      ) : null}

      <div className="rounded-[36px] border border-[#A10E4D]/10 bg-[linear-gradient(180deg,#FFFCFA_0%,#FFF6F1_100%)] p-5 shadow-[0_24px_70px_rgba(122,31,43,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A04C]">
              {mode === 'onboarding' ? 'Create your profile' : 'Edit your profile'}
            </p>
            <h1 className="mt-3 font-playfair text-3xl font-bold leading-tight text-[#2F2F2F] sm:text-4xl">
              {currentStepMeta.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5F5F5F] sm:text-base">
              {currentStepMeta.description}
            </p>
            <p className="mt-3 rounded-2xl border border-[#D4A04C]/20 bg-white/80 px-4 py-3 text-sm font-medium text-[#7D6551]">
              {currentStepMeta.highlight}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-[#A10E4D]/10 bg-white px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Progress
              </p>
              <p className="mt-2 text-2xl font-bold text-[#A10E4D]">{Math.round(progress)}%</p>
              <p className="mt-1 text-xs text-[#6B7280]">Currently on step {step + 1} of {STEPS.length}</p>
            </div>
            <div className="rounded-2xl border border-[#A10E4D]/10 bg-white px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Completed
              </p>
              <p className="mt-2 text-2xl font-bold text-[#2F2F2F]">{completedSteps}</p>
              <p className="mt-1 text-xs text-[#6B7280]">sections ready</p>
            </div>
            <div className="rounded-2xl border border-[#A10E4D]/10 bg-white px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold text-[#2F2F2F]">{remainingSteps}</p>
              <p className="mt-1 text-xs text-[#6B7280]">before review</p>
            </div>
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#F3DFE8]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#A10E4D_0%,#D4A04C_100%)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (mode === 'edit' || i <= step || done) {
                    setStep(i);
                  }
                }}
                className={cx(
                  'flex min-w-[170px] shrink-0 items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition-all duration-200',
                  active
                    ? 'border-[#A10E4D] bg-white text-[#A10E4D] shadow-[0_18px_36px_rgba(161,14,77,0.10)]'
                    : done
                      ? 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                      : 'border-[#A10E4D]/10 bg-white/90 text-[#6B7280] hover:bg-white',
                  mode === 'edit' || i <= step || done ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    active && 'bg-[#FFF0F3] text-[#A10E4D]',
                    done && 'bg-[#E8F7EF] text-green-700',
                    !active && !done && 'bg-[#FFF9F5] text-[#6B7280]',
                  )}
                >
                  {done ? <Check className="size-4" /> : s.shortLabel}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                    Step {s.id}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-current">{s.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-[#A10E4D]/10 bg-white p-6 shadow-[0_18px_50px_rgba(122,31,43,0.06)] md:p-8">
          {step === 0 && <StepBasicDetails draft={draft} onChange={patchPersonal} errors={errors} />}
          {step === 1 && <StepLocation draft={draft} onChange={patchLocation} errors={errors} />}
          {step === 2 && <StepReligion draft={draft} onChange={patchReligion} errors={errors} />}
          {step === 3 && (
            <StepEducation
              draft={draft}
              onEdChange={patchEducation}
              onEmChange={patchEmployment}
              errors={errors}
            />
          )}
          {step === 4 && <StepFamily draft={draft} onChange={patchFamily} errors={errors} />}
          {step === 5 && <StepLifestyle draft={draft} onChange={patchLifestyle} errors={errors} />}
          {step === 6 && <StepAbout draft={draft} onChange={patchAbout} errors={errors} />}
          {step === 7 && <StepPhotos memberRequest={memberRequest} />}
          {step === 8 && (
            <StepPartnerPrefs draft={draft} onChange={patchPartnerPreference} errors={errors} />
          )}
          {step === 9 && (
            <StepVerification
              onSubmit={() => void handleSubmit()}
              pending={submitting}
              submitMsg={submitMsg}
            />
          )}
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              Your onboarding promise
            </p>
            <div className="mt-5 grid gap-3">
              {ONBOARDING_PROMISES.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#FFF9F5] px-4 py-4">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#A10E4D]">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-sm leading-6 text-[#5F5F5F]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#D4A04C]/20 bg-[linear-gradient(180deg,#FFF9EE_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_50px_rgba(122,31,43,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
              Trust and visibility
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[#2F2F2F]">
              Verified profiles stand out faster
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Clear photos, completed basics, and trust checks usually make the strongest first impression.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                'Better response confidence',
                'Higher search trust signals',
                'Smoother family introductions',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#5F5F5F]">
                  <ShieldCheck className="size-4 text-[#A10E4D]" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/member/verification"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#A10E4D]"
            >
              Visit verification centre
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {profileId ? (
            <div className="rounded-3xl border border-[#A10E4D]/10 bg-white p-5 shadow-[0_18px_50px_rgba(122,31,43,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A04C]">
                Review in public view
              </p>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Preview how your profile presents to other members while you continue refining it.
              </p>
              <Link
                href={`/profiles/${profileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#A10E4D]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#A10E4D] hover:bg-[#FFF0F3] transition shadow-sm"
              >
                <Eye className="size-4" />
                Preview Profile
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Navigation Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#A10E4D]/10 pt-5 mt-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 flex items-center justify-center shrink-0">
            <svg className="size-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-[#FFF0F3]"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-[#A10E4D] transition-all duration-300"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 - (progress / 100) * 2 * Math.PI * 20}
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#A10E4D]">
              {Math.round(progress)}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Progress
            </p>
            <p className="text-xs font-bold text-[#A10E4D]">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep((s) => s - 1);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#A10E4D]/20 bg-white px-5 py-2 text-sm font-semibold text-[#A10E4D] shadow-sm hover:bg-[#FFF0F3] transition"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          )}

          {!isLastStep && (
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#A10E4D]/20 bg-white px-5 py-2 text-sm font-semibold text-[#A10E4D] shadow-sm hover:bg-[#FFF0F3] transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save draft
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={() => void handleSaveAndContinue()}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#A10E4D] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#A10E4D]/15 hover:bg-[#890B40] transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save & continue'}
              {!saving && <ChevronRight className="size-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#D4A04C] px-6 py-2.5 text-sm font-bold text-[#2F2F2F] shadow-lg shadow-[#D4A04C]/20 hover:bg-[#c9a126] transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? 'Saving...' : 'Save Complete Profile'}
            </button>
          )}
        </div>
      </div>

      {/* Bottom tip */}
      <p className="text-center text-[10px] text-[#6B7280] font-semibold leading-relaxed mt-2 bg-[#FFF9F5] py-2 rounded-xl border border-[#A10E4D]/5 max-w-sm mx-auto w-full">
        Your partial progress is saved securely. You can return and modify any step later.
      </p>
    </div>
  );
}
