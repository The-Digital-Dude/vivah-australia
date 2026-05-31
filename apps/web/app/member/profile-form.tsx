'use client';

import { useState, type FormEvent } from 'react';
import { profileDraftSchema, profileSubmitSchema } from '@vivah/shared';
import { useMemberRequest } from '@/lib/member-api';
import { csvList, optionalNumber, optionalString, validationMessage } from '@/lib/member-api';

export default function ProfileForm({ mode }: Readonly<{ mode: 'onboarding' | 'edit' }>) {
  const memberRequest = useMemberRequest();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      personal: {
        firstName: optionalString(form.get('firstName')),
        lastName: optionalString(form.get('lastName')),
        gender: optionalString(form.get('gender')),
        dateOfBirth: optionalString(form.get('dateOfBirth')),
        maritalStatus: optionalString(form.get('maritalStatus')),
        heightCm: optionalNumber(form.get('heightCm')),
      },
      religion: {
        religion: optionalString(form.get('religion')),
        community: optionalString(form.get('community')),
        motherTongue: optionalString(form.get('motherTongue')),
        languagesSpoken: csvList(form.get('languagesSpoken')),
      },
      location: {
        country: optionalString(form.get('country')),
        state: optionalString(form.get('state')),
        city: optionalString(form.get('city')),
        suburb: optionalString(form.get('suburb')),
        visaStatus: optionalString(form.get('visaStatus')),
      },
      education: {
        highestQualification: optionalString(form.get('highestQualification')),
      },
      employment: {
        occupation: optionalString(form.get('occupation')),
        industry: optionalString(form.get('industry')),
        annualIncome: optionalNumber(form.get('annualIncome')),
        annualIncomeVisibility: optionalString(form.get('annualIncomeVisibility')),
      },
      about: {
        aboutMe: optionalString(form.get('aboutMe')),
        hobbies: csvList(form.get('hobbies')),
        interests: csvList(form.get('interests')),
        partnerExpectations: optionalString(form.get('partnerExpectations')),
      },
      partnerPreference: {
        ageMin: optionalNumber(form.get('ageMin')),
        ageMax: optionalNumber(form.get('ageMax')),
        countries: csvList(form.get('preferredCountries')),
        cities: csvList(form.get('preferredCities')),
      },
    };
    const parsed = profileDraftSchema.safeParse(payload);

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const result = await memberRequest('/api/me/profile', {
      method: 'PATCH',
      body: parsed.data,
    });

    setMessage(result.message);
    setPending(false);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const parsed = profileSubmitSchema.safeParse({ confirm: true });

    if (!parsed.success) {
      setMessage(validationMessage(parsed.error.issues));
      setPending(false);
      return;
    }

    const result = await memberRequest('/api/me/profile/submit', {
      method: 'POST',
      body: parsed.data,
    });

    setMessage(result.message);
    setPending(false);
  }

  return (
    <div className="grid gap-8">
      <form className="grid gap-5" onSubmit={(event) => void save(event)}>
        <Field label="First name" name="firstName" />
        <Field label="Last name" name="lastName" />
        <Select
          label="Gender"
          name="gender"
          options={['FEMALE', 'MALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']}
        />
        <Field label="Date of birth" name="dateOfBirth" type="date" />
        <Select
          label="Marital status"
          name="maritalStatus"
          options={['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ANNULLED']}
        />
        <Field label="Height cm" name="heightCm" type="number" />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Religion" name="religion" />
          <Field label="Community" name="community" />
          <Field label="Mother tongue" name="motherTongue" />
        </div>
        <Field label="Languages spoken" name="languagesSpoken" placeholder="English, Hindi" />
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Country" name="country" defaultValue="Australia" />
          <Field label="State" name="state" />
          <Field label="City" name="city" />
          <Field label="Suburb" name="suburb" />
        </div>
        <Field label="Visa/citizenship status" name="visaStatus" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Highest qualification" name="highestQualification" />
          <Field label="Occupation" name="occupation" />
        </div>
        <Field label="Industry" name="industry" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Annual income" name="annualIncome" type="number" />
          <Select
            label="Income visibility"
            name="annualIncomeVisibility"
            options={['PRIVATE', 'MATCHES_ONLY', 'PUBLIC']}
          />
        </div>
        <TextArea label="About me" name="aboutMe" />
        <TextArea label="Partner expectations" name="partnerExpectations" />
        <Field label="Hobbies" name="hobbies" placeholder="Travel, cooking" />
        <Field label="Interests" name="interests" placeholder="Music, hiking" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Preferred age min" name="ageMin" type="number" />
          <Field label="Preferred age max" name="ageMax" type="number" />
        </div>
        <Field label="Preferred countries" name="preferredCountries" placeholder="Australia" />
        <Field label="Preferred cities" name="preferredCities" placeholder="Sydney, Melbourne" />
        <button className="h-11 rounded-md bg-red-700 px-5 text-sm font-semibold text-white">
          {pending ? 'Saving...' : mode === 'onboarding' ? 'Save and continue' : 'Save profile'}
        </button>
      </form>
      <form
        className="grid gap-4 border-t border-neutral-200 pt-6"
        onSubmit={(event) => void submitProfile(event)}
      >
        <button className="h-11 rounded-md border border-neutral-300 px-5 text-sm font-semibold">
          Submit for approval
        </button>
      </form>
      {message ? (
        <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{message}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
}: Readonly<{
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-800">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 rounded-md border border-neutral-300 px-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

function TextArea({ label, name }: Readonly<{ label: string; name: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-800">
      {label}
      <textarea
        name={name}
        rows={5}
        className="rounded-md border border-neutral-300 px-3 py-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
}: Readonly<{ label: string; name: string; options: string[] }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-800">
      {label}
      <select
        name={name}
        className="h-11 rounded-md border border-neutral-300 px-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}
