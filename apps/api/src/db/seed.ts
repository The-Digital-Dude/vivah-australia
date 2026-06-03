import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import {
  AccountStatus,
  CommunityPostStatus,
  Gender,
  InterestStatus,
  MaritalStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  PaymentStatus,
  ProfileVisibility,
  RefundStatus,
  ReportStatus,
  SubscriptionStatus,
  UserRole,
  VerificationLevel,
  VerificationStatus,
} from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { env } from '../env.js';
import {
  ActivityLogModel,
  AdminNoteModel,
  AuditLogModel,
  AuthProvider,
  BannerModel,
  BlogPostModel,
  BlockModel,
  CmsPageModel,
  CommunityCommentModel,
  CommunityPostModel,
  CommunityReactionModel,
  CommunityRoomModel,
  ContactInquiryModel,
  ConversationModel,
  CouponModel,
  FavouriteModel,
  FraudEventModel,
  InterestModel,
  InvoiceModel,
  MessageModel,
  NotificationModel,
  PaymentModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileBoostModel,
  ProfileMediaModel,
  ProfileModel,
  ProfileViewModel,
  PushSubscriptionModel,
  RefundModel,
  ReportModel,
  SavedSearchModel,
  SubscriptionModel,
  SuccessStoryModel,
  SystemSettingModel,
  TestimonialModel,
  UserModel,
  VerificationDocumentModel,
  VerificationRequestModel,
  phaseOneModels,
} from '../models/index.js';

const DEMO_TAG = 'vivah-demo-seed';
const MEMBER_PASSWORD = 'TestUserStrong123!';
const ADMIN_PASSWORD = 'ChangeMeStrong123!';
const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

type ObjectId = Types.ObjectId;

interface DemoMember {
  index: number;
  email: string;
  firstName: string;
  lastName: string;
  gender: (typeof Gender)[keyof typeof Gender];
  dateOfBirth: Date;
  displayId: string;
  slug: string;
  city: string;
  state: string;
  suburb: string;
  occupation: string;
  industry: string;
  qualification: string;
  institution: string;
  religion: string;
  community: string;
  motherTongue: string;
  languages: string[];
  maritalStatus: (typeof MaritalStatus)[keyof typeof MaritalStatus];
  status: (typeof AccountStatus)[keyof typeof AccountStatus];
  planCode: string;
  verificationLevel: (typeof VerificationLevel)[keyof typeof VerificationLevel];
  approvalStatus: (typeof ProfileApprovalStatus)[keyof typeof ProfileApprovalStatus];
  visibility: (typeof ProfileVisibility)[keyof typeof ProfileVisibility];
}

const admins = [
  { email: 'admin@vivahaustralia.com', role: UserRole.SUPER_ADMIN },
  { email: 'manager@vivahaustralia.com', role: UserRole.ADMIN },
  { email: 'moderator@vivahaustralia.com', role: UserRole.MODERATOR },
] as const;

const femaleNames = [
  ['priya', 'sharma'],
  ['neha', 'singh'],
  ['meera', 'iyer'],
  ['anika', 'reddy'],
  ['simran', 'kaur'],
  ['isha', 'patel'],
  ['kavya', 'nair'],
  ['rhea', 'kapoor'],
  ['saanvi', 'joshi'],
  ['diya', 'mehta'],
  ['tara', 'chopra'],
  ['avani', 'rao'],
  ['nisha', 'fernandes'],
  ['pooja', 'menon'],
  ['leena', 'das'],
  ['maya', 'bhatt'],
  ['sonal', 'trivedi'],
  ['ritika', 'agrawal'],
  ['aisha', 'khan'],
  ['jasmine', 'gill'],
] as const;

const maleNames = [
  ['arjun', 'patel'],
  ['rohan', 'desai'],
  ['amit', 'kumar'],
  ['kabir', 'malhotra'],
  ['dev', 'patel'],
  ['vikram', 'shah'],
  ['rahul', 'verma'],
  ['karan', 'kapoor'],
  ['samar', 'gupta'],
  ['naveen', 'rao'],
  ['aditya', 'iyer'],
  ['rishi', 'singh'],
  ['manav', 'reddy'],
  ['sahil', 'bansal'],
  ['varun', 'nair'],
  ['nikhil', 'joshi'],
  ['sameer', 'khan'],
  ['harpreet', 'kaur'],
  ['akash', 'mehta'],
  ['yusuf', 'ali'],
] as const;

const locations = [
  ['Melbourne', 'VIC', 'Glen Waverley'],
  ['Sydney', 'NSW', 'Parramatta'],
  ['Brisbane', 'QLD', 'Sunnybank'],
  ['Perth', 'WA', 'Cannington'],
  ['Adelaide', 'SA', 'Mawson Lakes'],
  ['Canberra', 'ACT', 'Belconnen'],
  ['Gold Coast', 'QLD', 'Southport'],
  ['Geelong', 'VIC', 'Belmont'],
  ['Dandenong', 'VIC', 'Dandenong'],
  ['Blacktown', 'NSW', 'Blacktown'],
  ['Harris Park', 'NSW', 'Harris Park'],
  ['Melbourne', 'VIC', 'Docklands'],
  ['Sydney', 'NSW', 'Rhodes'],
  ['Brisbane', 'QLD', 'Indooroopilly'],
  ['Perth', 'WA', 'Victoria Park'],
] as const;

const religions = ['Hindu', 'Sikh', 'Muslim', 'Christian', 'Jain', 'Buddhist', 'Other'] as const;
const communities = [
  'Punjabi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Malayali',
  'Bengali',
  'Marathi',
  'Sindhi',
  'Rajasthani',
  'Kannada',
  'Hindi Speaking',
  'South Indian',
  'North Indian',
] as const;
const motherTongues = [
  'Hindi',
  'Punjabi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Urdu',
  'Kannada',
] as const;
const occupations = [
  ['Software Engineer', 'Technology'],
  ['Data Analyst', 'Technology'],
  ['Doctor', 'Healthcare'],
  ['Dentist', 'Healthcare'],
  ['Pharmacist', 'Healthcare'],
  ['Accountant', 'Finance'],
  ['Finance Analyst', 'Finance'],
  ['Project Manager', 'Consulting'],
  ['Teacher', 'Education'],
  ['Civil Engineer', 'Engineering'],
  ['Mechanical Engineer', 'Engineering'],
  ['Lawyer', 'Legal'],
  ['Nurse', 'Healthcare'],
  ['Marketing Manager', 'Retail'],
  ['Business Analyst', 'Consulting'],
  ['Consultant', 'Consulting'],
  ['Entrepreneur', 'Retail'],
  ['Chef', 'Hospitality'],
  ['Architect', 'Design'],
  ['HR Manager', 'Government'],
  ['UX Designer', 'Design'],
  ['Product Manager', 'Technology'],
  ['Cybersecurity Analyst', 'Technology'],
  ['Data Scientist', 'Research'],
  ['University Lecturer', 'Education'],
] as const;
const qualifications = [
  "Bachelor's Degree",
  "Master's Degree",
  'MBA',
  'PhD',
  'Diploma',
  'Professional Certification',
  'MBBS',
  'BDS',
  'CPA',
  'CA',
] as const;
const institutions = [
  'University of Melbourne',
  'Monash University',
  'RMIT University',
  'University of Sydney',
  'UNSW',
  'University of Queensland',
  'Deakin University',
  'University of Adelaide',
  'Curtin University',
  'Australian National University',
  'Swinburne University',
  'Macquarie University',
] as const;
const visaStatuses = [
  'Australian Citizen',
  'Permanent Resident',
  'Student Visa',
  'Temporary Skilled Visa',
  'Partner Visa',
  'Work Visa',
  'Graduate Visa',
] as const;
const familyValues = ['Traditional', 'Moderate', 'Liberal'] as const;
const familyTypes = ['Nuclear', 'Joint', 'Extended'] as const;
const diets = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan', 'Halal'] as const;
const fitness = [
  'Gym',
  'Yoga',
  'Walking',
  'Cricket',
  'Badminton',
  'Swimming',
  'Hiking',
  'Pilates',
  'Running',
  'Cycling',
] as const;
const hobbies = [
  'Travel',
  'Cooking',
  'Music',
  'Reading',
  'Movies',
  'Volunteering',
  'Photography',
  'Food',
  'Fitness',
  'Gardening',
] as const;
const identityVerifiedLevels = [
  VerificationLevel.SILVER,
  VerificationLevel.GOLD,
  VerificationLevel.PLATINUM,
  VerificationLevel.FULLY_VERIFIED,
] as const;
const goldVerifiedLevels = [
  VerificationLevel.GOLD,
  VerificationLevel.PLATINUM,
  VerificationLevel.FULLY_VERIFIED,
] as const;
const platinumVerifiedLevels = [
  VerificationLevel.PLATINUM,
  VerificationLevel.FULLY_VERIFIED,
] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function repeat<T>(value: T, count: number): T[] {
  return Array.from({ length: count }, () => value);
}

function title(value: string) {
  return value
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function slugify(first: string, last: string, displayId: string) {
  return `${first}-${last}-${displayId}`.toLowerCase();
}

function calculateAge(dateOfBirth: Date, asOf = now): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = asOf.getMonth() - dateOfBirth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

function buildMembers(): DemoMember[] {
  const names = [...femaleNames, ...maleNames];
  const statuses: Array<(typeof AccountStatus)[keyof typeof AccountStatus]> = [
    ...repeat(AccountStatus.ACTIVE, 30),
    ...repeat(AccountStatus.PENDING, 5),
    ...repeat(AccountStatus.SUSPENDED, 3),
    ...repeat(AccountStatus.BANNED, 2),
  ];
  const plans = ['FREE', 'PREMIUM_MONTHLY', 'GOLD_MONTHLY', 'PLATINUM_MONTHLY'];
  const levels = [
    VerificationLevel.NONE,
    VerificationLevel.BASIC,
    VerificationLevel.SILVER,
    VerificationLevel.GOLD,
    VerificationLevel.PLATINUM,
    VerificationLevel.FULLY_VERIFIED,
  ];
  const maritalStatuses = [
    MaritalStatus.NEVER_MARRIED,
    MaritalStatus.DIVORCED,
    MaritalStatus.SEPARATED,
    MaritalStatus.WIDOWED,
    MaritalStatus.ANNULLED,
  ];

  return names.map(([first, last], index) => {
    const displayId = `VA${String(100001 + index).padStart(6, '0')}`;
    const [city, state, suburb] = pick(locations, index);
    const [occupation, industry] = pick(occupations, index);
    const year = 1984 + (index % 18);
    return {
      index,
      email: `${first}.${last}@example.com`,
      firstName: title(first),
      lastName: title(last),
      gender: index < 20 ? Gender.FEMALE : Gender.MALE,
      dateOfBirth: new Date(Date.UTC(year, index % 12, 8 + (index % 18))),
      displayId,
      slug: slugify(first, last, displayId),
      city,
      state,
      suburb,
      occupation,
      industry,
      qualification: pick(qualifications, index),
      institution: pick(institutions, index),
      religion: pick(religions, index),
      community: pick(communities, index),
      motherTongue: pick(motherTongues, index),
      languages: ['English', pick(motherTongues, index)],
      maritalStatus: pick(maritalStatuses, index),
      status: statuses[index] ?? AccountStatus.ACTIVE,
      planCode: pick(plans, index),
      verificationLevel: pick(levels, index),
      approvalStatus:
        index < 30
          ? ProfileApprovalStatus.APPROVED
          : index < 35
            ? ProfileApprovalStatus.PENDING
            : index < 38
              ? ProfileApprovalStatus.NEEDS_CHANGES
              : ProfileApprovalStatus.REJECTED,
      visibility: index % 7 === 0 ? ProfileVisibility.PUBLIC : ProfileVisibility.MEMBERS_ONLY,
    };
  });
}

const members = buildMembers();

const plans = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'A starter profile for browsing and limited interest sending.',
    priceCents: 0,
    interval: 'MONTH' as const,
    sortOrder: 0,
    features: ['Create a profile', 'Browse public profiles', 'Send limited interests'],
    limits: { interestsPerMonth: 5, messagesPerMonth: 0, profileBoosts: 0 },
  },
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    description: 'More interests, member profile details, and message access after acceptance.',
    priceCents: 4900,
    interval: 'MONTH' as const,
    sortOrder: 10,
    features: ['50 interests per month', 'Message accepted matches', 'Advanced filters'],
    limits: { interestsPerMonth: 50, messagesPerMonth: 500, profileBoosts: 1 },
  },
  {
    code: 'PREMIUM_QUARTERLY',
    name: 'Premium Quarterly',
    description: 'Three months of premium access for serious searchers.',
    priceCents: 12900,
    interval: 'MONTH' as const,
    sortOrder: 20,
    features: ['Quarterly value', 'Message accepted matches', 'Advanced filters'],
    limits: { interestsPerMonth: 60, messagesPerMonth: 700, profileBoosts: 2 },
  },
  {
    code: 'GOLD_MONTHLY',
    name: 'Gold Monthly',
    description: 'Priority discovery with more visibility and support.',
    priceCents: 7900,
    interval: 'MONTH' as const,
    sortOrder: 30,
    features: ['Priority discovery', 'More profile boosts', 'Verification support'],
    limits: { interestsPerMonth: 120, messagesPerMonth: 1500, profileBoosts: 4 },
  },
  {
    code: 'PLATINUM_MONTHLY',
    name: 'Platinum Monthly',
    description: 'Highest visibility with premium support for committed members.',
    priceCents: 9900,
    interval: 'MONTH' as const,
    sortOrder: 40,
    features: ['Highest profile visibility', 'Dedicated review', 'Unlimited accepted messaging'],
    limits: { interestsPerMonth: 200, messagesPerMonth: 5000, profileBoosts: 8 },
  },
] as const;

function seedMetadata(extra: Record<string, unknown> = {}) {
  return { seedTag: DEMO_TAG, ...extra };
}

async function syncModelIndexes() {
  await Promise.all(
    [UserModel, ProfileModel, ...phaseOneModels].map((model) => model.syncIndexes()),
  );
}

async function upsertUser(
  email: string,
  passwordHash: string,
  role: (typeof UserRole)[keyof typeof UserRole],
  status: (typeof AccountStatus)[keyof typeof AccountStatus],
  mobile?: string,
) {
  await UserModel.updateOne(
    { email },
    {
      $set: {
        role,
        status,
        emailVerified: true,
        mobileVerified: Boolean(mobile),
        failedLoginAttempts: 0,
        refreshTokenVersion: 0,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        marketingConsent: false,
        notificationPreferences: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          marketingNotifications: false,
        },
        metadata: seedMetadata({ signupIp: '127.0.0.1', signupUserAgent: 'Vivah demo seed' }),
        ...(mobile ? { mobile } : {}),
      },
      $setOnInsert: {
        email,
        passwordHash,
        authProviders: [AuthProvider.EMAIL],
      },
    },
    { upsert: true },
  );
  return UserModel.findOne({ email }).orFail();
}

async function seedAdmins(passwordHash: string) {
  for (const admin of admins) {
    await upsertUser(admin.email, passwordHash, admin.role, AccountStatus.ACTIVE);
  }
}

async function seedPlans() {
  for (const plan of plans) {
    await PlanModel.updateOne(
      { code: plan.code },
      {
        $set: {
          name: plan.name,
          description: plan.description,
          priceCents: plan.priceCents,
          currency: 'AUD',
          interval: plan.interval,
          features: [...plan.features],
          limits: plan.limits,
          stripePriceId: `price_demo_${plan.code.toLowerCase()}`,
          sortOrder: plan.sortOrder,
          active: true,
        },
      },
      { upsert: true },
    );
  }
}

function profilePayload(member: DemoMember, userId: ObjectId) {
  const age = calculateAge(member.dateOfBirth);
  const aboutMe = `I am a family-oriented professional based in ${member.city}. I value honesty, respect, culture, and meaningful conversations. I enjoy travelling, cooking, music, and spending time with family.`;
  const partnerExpectations =
    'Looking for a kind, educated, family-oriented partner who values communication, respect, and long-term commitment.';

  return {
    userId,
    displayId: member.displayId,
    slug: member.slug,
    completionPercentage: member.approvalStatus === ProfileApprovalStatus.APPROVED ? 95 : 78,
    personal: {
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      age,
      heightCm: 155 + (member.index % 38),
      weightKg: 52 + (member.index % 34),
      maritalStatus: member.maritalStatus,
      numberOfChildren: member.maritalStatus === MaritalStatus.NEVER_MARRIED ? 0 : member.index % 2,
      disabilityStatus: member.index % 11 === 0 ? 'Prefer not to say' : 'None',
    },
    religion: {
      religion: member.religion,
      community: member.community,
      caste: member.index % 4 === 0 ? 'Prefer not to say' : undefined,
      subCaste: undefined,
      motherTongue: member.motherTongue,
      languagesSpoken: member.languages,
    },
    location: {
      country: 'Australia',
      state: member.state,
      city: member.city,
      suburb: member.suburb,
      citizenshipStatus: pick(visaStatuses, member.index),
      visaStatus: pick(visaStatuses, member.index + 2),
    },
    education: {
      highestQualification: member.qualification,
      institutionName: member.institution,
      graduationYear: 2012 + (member.index % 14),
      additionalCertifications:
        member.index % 3 === 0 ? ['Professional development certificate'] : [],
    },
    employment: {
      occupation: member.occupation,
      industry: member.industry,
      employmentStatus: pick(
        ['Employed', 'Self-employed', 'Business Owner', 'Student', 'Looking for Work'],
        member.index,
      ),
      employerName: `Demo ${member.industry} Group`,
      annualIncome: pick([48000, 62000, 84000, 118000, 155000, 0], member.index),
      annualIncomeVisibility: member.index % 5 === 0 ? 'MATCHES_ONLY' : 'PRIVATE',
    },
    family: {
      fatherDetails: `${pick(['Business Owner', 'Retired', 'Engineer', 'Teacher', 'Government Employee', 'Doctor', 'Accountant', 'Farmer'], member.index)} father`,
      motherDetails: `${pick(['Homemaker', 'Teacher', 'Nurse', 'Business Owner', 'Retired', 'Doctor', 'Accountant'], member.index)} mother`,
      siblingDetails: `${member.index % 4} sibling${member.index % 4 === 1 ? '' : 's'}`,
      familyValues: pick(familyValues, member.index),
      familyType: pick(familyTypes, member.index),
    },
    lifestyle: {
      smokingHabits: pick(['Never', 'No', 'Occasionally'], member.index),
      drinkingHabits: pick(['Never', 'No', 'Socially'], member.index + 1),
      dietaryPreferences: pick(diets, member.index),
      fitnessInterests: [pick(fitness, member.index), pick(fitness, member.index + 3)],
      religiousPractices: pick(
        ['Regular', 'Occasional', 'Cultural', 'Spiritual', 'Prefer not to say'],
        member.index,
      ),
    },
    about: {
      aboutMe,
      hobbies: [
        pick(hobbies, member.index),
        pick(hobbies, member.index + 2),
        pick(hobbies, member.index + 5),
      ],
      interests: [
        member.industry,
        pick(['Culture', 'Family', 'Community', 'Travel', 'Wellbeing'], member.index),
      ],
      personalGoals:
        'To build a balanced family life in Australia while continuing to grow professionally.',
      partnerExpectations,
    },
    partnerPreference: {
      ageMin: Math.max(22, age - 5),
      ageMax: age + 5,
      heightMinCm: member.gender === Gender.FEMALE ? 165 : 150,
      heightMaxCm: member.gender === Gender.FEMALE ? 195 : 185,
      religions: member.index % 5 === 0 ? [] : [member.religion],
      communities: member.index % 4 === 0 ? [] : [member.community],
      motherTongues: member.index % 3 === 0 ? [] : [member.motherTongue, 'English'],
      countries: ['Australia'],
      states: member.index % 2 === 0 ? [member.state] : [],
      cities: member.index % 2 === 0 ? [member.city] : [],
      educationLevels: [member.qualification],
      occupations: member.index % 3 === 0 ? [] : [member.occupation],
      incomeMin: member.index % 4 === 0 ? undefined : 50000,
      incomeMax: member.index % 4 === 0 ? undefined : 200000,
      maritalStatuses:
        member.maritalStatus === MaritalStatus.NEVER_MARRIED
          ? [MaritalStatus.NEVER_MARRIED]
          : [MaritalStatus.NEVER_MARRIED, MaritalStatus.DIVORCED, MaritalStatus.WIDOWED],
    },
    verification: {
      level: member.verificationLevel,
      emailVerified: true,
      mobileVerified: member.verificationLevel !== VerificationLevel.NONE,
      identityVerified: identityVerifiedLevels.some((level) => level === member.verificationLevel),
      addressVerified: goldVerifiedLevels.some((level) => level === member.verificationLevel),
      employmentVerified: platinumVerifiedLevels.some(
        (level) => level === member.verificationLevel,
      ),
      visaVerified: platinumVerifiedLevels.some((level) => level === member.verificationLevel),
      policeClearanceVerified: member.verificationLevel === VerificationLevel.FULLY_VERIFIED,
      facialVerified: platinumVerifiedLevels.some((level) => level === member.verificationLevel),
    },
    visibility: {
      status: member.visibility,
      showPhoto: true,
      showIncome: false,
      showEmployer: member.index % 6 === 0,
      showLastName: member.index % 5 === 0,
    },
    stats: {
      profileViews: 20 + member.index * 7,
      interestsReceived: member.index % 12,
      interestsSent: member.index % 9,
      favouritesCount: member.index % 10,
      lastActiveAt: new Date(now.getTime() - member.index * dayMs),
    },
    moderation: {
      approvalStatus: member.approvalStatus,
      reviewedAt:
        member.approvalStatus === ProfileApprovalStatus.APPROVED
          ? new Date(now.getTime() - member.index * dayMs)
          : undefined,
      rejectionReason:
        member.approvalStatus === ProfileApprovalStatus.REJECTED
          ? 'Demo profile requires clearer information before approval.'
          : undefined,
      internalNote: 'Seeded matrimonial demo profile.',
    },
  };
}

async function seedMembers(passwordHash: string) {
  const result = new Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>();
  for (const member of members) {
    const user = await upsertUser(
      member.email,
      passwordHash,
      UserRole.USER,
      member.status,
      `+6140000${String(member.index + 1).padStart(4, '0')}`,
    );
    await ProfileModel.updateOne(
      { displayId: member.displayId },
      { $set: profilePayload(member, user._id) },
      { upsert: true },
    );
    const profile = await ProfileModel.findOne({ displayId: member.displayId }).orFail();
    result.set(member.displayId, { userId: user._id, profileId: profile._id, member });
  }
  return result;
}

async function seedMedia(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  for (const { userId, profileId, member } of records.values()) {
    const genderPath = member.gender === Gender.FEMALE ? 'female' : 'male';
    const base = (member.index % 4) + 1;
    const mediaItems = [
      {
        storageKey: `demo/profiles/${member.slug}/profile.jpg`,
        assetUrl: `/demo/profiles/${genderPath}-${base}.jpg`,
        category: MediaCategory.PROFILE_PHOTO,
        visibility: MediaVisibility.PUBLIC,
        isPrimary: true,
        approvalStatus: VerificationStatus.APPROVED,
      },
      {
        storageKey: `demo/profiles/${member.slug}/public-1.jpg`,
        assetUrl: `/demo/profiles/${genderPath}-${(base % 4) + 1}.jpg`,
        category: MediaCategory.PUBLIC_GALLERY,
        visibility: MediaVisibility.PUBLIC,
        isPrimary: false,
        approvalStatus:
          member.index % 9 === 0 ? VerificationStatus.PENDING : VerificationStatus.APPROVED,
      },
      {
        storageKey: `demo/profiles/${member.slug}/public-2.jpg`,
        assetUrl: `/demo/profiles/${genderPath}-${((base + 1) % 4) + 1}.jpg`,
        category: MediaCategory.PUBLIC_GALLERY,
        visibility: MediaVisibility.PUBLIC,
        isPrimary: false,
        approvalStatus:
          member.index % 13 === 0 ? VerificationStatus.REJECTED : VerificationStatus.APPROVED,
      },
      ...(member.index % 3 === 0
        ? [
            {
              storageKey: `demo/profiles/${member.slug}/private-1.jpg`,
              assetUrl: `/demo/profiles/${genderPath}-${((base + 2) % 4) + 1}.jpg`,
              category: MediaCategory.PRIVATE_GALLERY,
              visibility: MediaVisibility.PRIVATE,
              isPrimary: false,
              approvalStatus: VerificationStatus.APPROVED,
            },
          ]
        : []),
    ];

    for (const item of mediaItems) {
      await ProfileMediaModel.updateOne(
        { storageKey: item.storageKey },
        {
          $set: {
            userId,
            profileId,
            assetUrl: item.assetUrl,
            storageKey: item.storageKey,
            mediaType: 'PHOTO',
            category: item.category,
            uploadStatus: MediaUploadStatus.UPLOADED,
            mimeType: 'image/jpeg',
            fileSizeBytes: 280000 + member.index * 1000,
            originalFilename: item.storageKey.split('/').at(-1) ?? 'demo-profile.jpg',
            width: 1200,
            height: 1600,
            visibility: item.visibility,
            approvalStatus: item.approvalStatus,
            isPrimary: item.isPrimary,
            moderationReason:
              item.approvalStatus === VerificationStatus.REJECTED
                ? 'Demo rejected image for moderation queue.'
                : undefined,
          },
        },
        { upsert: true },
      );
    }
  }
}

function activeMembers(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  return [...records.values()].filter((item) => item.member.status === AccountStatus.ACTIVE);
}

async function seedInteractions(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const males = active.filter((item) => item.member.gender === Gender.MALE);
  const females = active.filter((item) => item.member.gender === Gender.FEMALE);
  const statuses = [
    InterestStatus.PENDING,
    InterestStatus.ACCEPTED,
    InterestStatus.REJECTED,
    InterestStatus.WITHDRAWN,
  ];

  for (let index = 0; index < 80; index += 1) {
    const sender = index % 2 === 0 ? pick(males, index) : pick(females, index);
    const receiver = index % 2 === 0 ? pick(females, index + 3) : pick(males, index + 5);
    if (sender.userId.equals(receiver.userId)) continue;
    const status = pick(statuses, index);
    await InterestModel.updateOne(
      { senderId: sender.userId, receiverId: receiver.userId },
      {
        $set: {
          senderId: sender.userId,
          receiverId: receiver.userId,
          status,
          respondedAt:
            status === InterestStatus.PENDING
              ? undefined
              : new Date(now.getTime() - index * 3600000),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  for (let index = 0; index < 60; index += 1) {
    const user = pick(active, index);
    const target = pick(active, index + 7);
    if (user.userId.equals(target.userId)) continue;
    await FavouriteModel.updateOne(
      { userId: user.userId, profileId: target.profileId },
      { $set: { userId: user.userId, profileId: target.profileId, isDeleted: false } },
      { upsert: true },
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const blocker = pick(active, index + 2);
    const blocked = pick(active, index + 17);
    await BlockModel.updateOne(
      { blockerId: blocker.userId, blockedId: blocked.userId },
      { $set: { blockerId: blocker.userId, blockedId: blocked.userId, isDeleted: false } },
      { upsert: true },
    );
  }
}

async function seedReports(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const reasons = [
    'Fake profile',
    'Inappropriate message',
    'Suspicious activity',
    'Harassment',
    'Wrong information',
    'Spam',
  ];
  const statuses = [
    ReportStatus.OPEN,
    ReportStatus.ASSIGNED,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
  ];
  const admin = await UserModel.findOne({ email: 'moderator@vivahaustralia.com' }).orFail();
  for (let index = 0; index < 12; index += 1) {
    const reporter = pick(active, index);
    const reported = pick(active, index + 11);
    await ReportModel.updateOne(
      { reporterId: reporter.userId, targetId: reported.profileId, reason: pick(reasons, index) },
      {
        $set: {
          reporterId: reporter.userId,
          reportedUserId: reported.userId,
          targetType: 'PROFILE',
          targetId: reported.profileId,
          reason: `${pick(reasons, index)} - safe demo report for admin queue review.`,
          status: pick(statuses, index),
          severity: pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, index),
          assignedTo: index % 3 === 0 ? admin._id : undefined,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }
}

async function seedMessages(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const males = active.filter((item) => item.member.gender === Gender.MALE);
  const females = active.filter((item) => item.member.gender === Gender.FEMALE);
  const messageBodies = [
    'Hi, thanks for accepting my interest. I liked your profile and family values.',
    'Thanks, nice to connect with you too.',
    'Are you currently based in Melbourne?',
    'Yes, I work locally and live with my family.',
    'That sounds great. Would you prefer to continue the conversation here first?',
    'Yes, that would be good.',
    'I appreciate respectful communication and taking time to know each other.',
    'Same here. Family values and clarity are important to me too.',
  ];

  for (let index = 0; index < 10; index += 1) {
    const first = pick(males, index);
    const second = pick(females, index);
    const participantIds = [first.userId, second.userId].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
    const existingConversation = await ConversationModel.findOne({
      participantIds: { $all: participantIds, $size: 2 },
    });
    const conversation =
      existingConversation ??
      (await ConversationModel.create({
        participantIds,
        lastMessageAt: new Date(now.getTime() - index * dayMs),
        deletedFor: index >= 5 ? [first.userId] : [],
        isDeleted: false,
      }));
    conversation.set({
      participantIds,
      lastMessageAt: new Date(now.getTime() - index * dayMs),
      deletedFor: index >= 5 ? [first.userId] : [],
      isDeleted: false,
    });
    await conversation.save();

    for (let messageIndex = 0; messageIndex < 8; messageIndex += 1) {
      const sender = messageIndex % 2 === 0 ? first : second;
      const body = pick(messageBodies, messageIndex);
      await MessageModel.updateOne(
        {
          conversationId: conversation._id,
          senderId: sender.userId,
          body,
        },
        {
          $set: {
            conversationId: conversation._id,
            senderId: sender.userId,
            body,
            readBy: messageIndex < 6 ? participantIds : [sender.userId],
            deletedFor: [],
            isDeleted: false,
          },
        },
        { upsert: true },
      );
    }
  }
}

async function seedVerifications(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const reviewer = await UserModel.findOne({ email: 'moderator@vivahaustralia.com' }).orFail();
  const types = ['IDENTITY', 'ADDRESS', 'EMPLOYMENT', 'VISA', 'POLICE_CLEARANCE', 'FACIAL'];
  const statuses: Array<(typeof VerificationStatus)[keyof typeof VerificationStatus]> = [
    ...repeat(VerificationStatus.PENDING, 10),
    ...repeat(VerificationStatus.APPROVED, 15),
    ...repeat(VerificationStatus.REJECTED, 5),
    ...repeat(VerificationStatus.NEEDS_RESUBMISSION, 5),
  ];

  for (let index = 0; index < statuses.length; index += 1) {
    const target = pick(active, index);
    const type = pick(types, index);
    const storageKey = `demo/verification/${type.toLowerCase()}-${target.member.displayId.toLowerCase()}.pdf`;
    const request = await VerificationRequestModel.findOneAndUpdate(
      { userId: target.userId, type, 'documentUrls.0': storageKey },
      {
        $set: {
          userId: target.userId,
          profileId: target.profileId,
          type,
          status: statuses[index],
          documentUrls: [storageKey],
          submittedAt: new Date(now.getTime() - index * dayMs),
          reviewReason:
            statuses[index] === VerificationStatus.REJECTED
              ? 'Demo request rejected for clearer document copy.'
              : undefined,
          adminNote:
            'Demo document metadata: demo-identity-document.pdf, application/pdf, 245000 bytes.',
          reviewedBy: statuses[index] === VerificationStatus.PENDING ? undefined : reviewer._id,
          reviewedAt:
            statuses[index] === VerificationStatus.PENDING
              ? undefined
              : new Date(now.getTime() - index * dayMs),
          isDeleted: false,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).orFail();

    await VerificationDocumentModel.updateOne(
      { requestId: request._id, storageKey },
      {
        $set: {
          requestId: request._id,
          userId: target.userId,
          documentType:
            type === 'IDENTITY' ? 'Driver Licence' : `${title(type.toLowerCase())} Document`,
          storageKey,
          encrypted: true,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }
}

async function seedNotifications(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records).slice(0, 18);
  const types = [
    ['INTEREST_RECEIVED', 'New interest received'],
    ['INTEREST_ACCEPTED', 'Interest accepted'],
    ['NEW_MESSAGE', 'New message'],
    ['VERIFICATION_APPROVED', 'Verification approved'],
    ['VERIFICATION_REJECTED', 'Verification needs attention'],
    ['PROFILE_APPROVED', 'Profile approved'],
    ['SUBSCRIPTION_UPDATED', 'Membership updated'],
    ['REPORT_RESOLVED', 'Report resolved'],
  ] as const;

  for (const [memberIndex, member] of active.entries()) {
    for (let index = 0; index < 6; index += 1) {
      const [typeValue, titleValue] = pick(types, memberIndex + index);
      await NotificationModel.updateOne(
        {
          userId: member.userId,
          type: typeValue,
          title: `${titleValue} (${member.member.displayId})`,
        },
        {
          $set: {
            userId: member.userId,
            type: typeValue,
            title: `${titleValue} (${member.member.displayId})`,
            body: 'Demo notification for member dashboard and notification page testing.',
            data: seedMetadata({ displayId: member.member.displayId }),
            readAt: index % 3 === 0 ? new Date(now.getTime() - index * dayMs) : undefined,
            isDeleted: false,
          },
        },
        { upsert: true },
      );
    }
  }
}

async function seedBilling(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const planDocs = new Map(
    (await PlanModel.find({ code: { $in: plans.map((plan) => plan.code) } })).map((plan) => [
      plan.code,
      plan,
    ]),
  );
  const active = activeMembers(records);
  const coupons = [
    { code: 'WELCOME20', percentOff: 20 },
    { code: 'VERIFIED10', percentOff: 10 },
    { code: 'PLATINUM50', amountOffCents: 5000 },
  ];
  for (const coupon of coupons) {
    await CouponModel.updateOne(
      { code: coupon.code },
      {
        $set: {
          code: coupon.code,
          percentOff: coupon.percentOff,
          amountOffCents: coupon.amountOffCents,
          stripeCouponId: `coupon_demo_${coupon.code.toLowerCase()}`,
          maxRedemptions: 500,
          redemptionCount: coupon.code === 'WELCOME20' ? 22 : 6,
          active: true,
          expiresAt: new Date(now.getTime() + 180 * dayMs),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  const subscriptionStatuses: Array<(typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]> =
    [
      ...repeat(SubscriptionStatus.ACTIVE, 10),
      ...repeat(SubscriptionStatus.CANCELED, 3),
      ...repeat(SubscriptionStatus.EXPIRED, 2),
      ...repeat(SubscriptionStatus.PAST_DUE, 2),
    ];
  for (let index = 0; index < subscriptionStatuses.length; index += 1) {
    const member = pick(active, index);
    const plan = planDocs.get(member.member.planCode) ?? planDocs.get('PREMIUM_MONTHLY');
    if (!plan) continue;
    const providerSubscriptionId = `sub_demo_${member.member.displayId.toLowerCase()}`;
    await SubscriptionModel.updateOne(
      { providerSubscriptionId },
      {
        $set: {
          userId: member.userId,
          planId: plan._id,
          status: subscriptionStatuses[index],
          startsAt: new Date(now.getTime() - (30 + index) * dayMs),
          endsAt:
            subscriptionStatuses[index] === SubscriptionStatus.EXPIRED
              ? new Date(now.getTime() - index * dayMs)
              : new Date(now.getTime() + (30 - index) * dayMs),
          provider: 'demo',
          providerSubscriptionId,
          providerCustomerId: `cus_demo_${member.member.displayId.toLowerCase()}`,
          currentPeriodStart: new Date(now.getTime() - 10 * dayMs),
          currentPeriodEnd: new Date(now.getTime() + 20 * dayMs),
          cancelAtPeriodEnd: subscriptionStatuses[index] === SubscriptionStatus.CANCELED,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  const paymentStatuses = [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ];
  for (let index = 0; index < 24; index += 1) {
    const member = pick(active, index);
    const plan = planDocs.get(member.member.planCode) ?? planDocs.get('PREMIUM_MONTHLY');
    if (!plan) continue;
    const status = pick(paymentStatuses, index);
    const payment = await PaymentModel.findOneAndUpdate(
      { providerPaymentId: `pay_demo_${member.member.displayId.toLowerCase()}_${index}` },
      {
        $set: {
          userId: member.userId,
          amountCents: plan.priceCents,
          currency: 'AUD',
          status,
          provider: 'demo',
          providerPaymentId: `pay_demo_${member.member.displayId.toLowerCase()}_${index}`,
          providerCustomerId: `cus_demo_${member.member.displayId.toLowerCase()}`,
          providerSubscriptionId: `sub_demo_${member.member.displayId.toLowerCase()}`,
          planId: plan._id,
          description: `${plan.name} demo payment`,
          refundedAmountCents:
            status === PaymentStatus.REFUNDED
              ? plan.priceCents
              : status === PaymentStatus.PARTIALLY_REFUNDED
                ? Math.floor(plan.priceCents / 2)
                : 0,
          isDeleted: false,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).orFail();

    await InvoiceModel.updateOne(
      { invoiceNumber: `INV-DEMO-${String(index + 1).padStart(4, '0')}` },
      {
        $set: {
          userId: member.userId,
          paymentId: payment._id,
          invoiceNumber: `INV-DEMO-${String(index + 1).padStart(4, '0')}`,
          providerInvoiceId: `in_demo_${index + 1}`,
          providerHostedUrl: `https://demo.vivahaustralia.com.au/invoices/${index + 1}`,
          providerPdfUrl: `https://demo.vivahaustralia.com.au/invoices/${index + 1}.pdf`,
          status: status === PaymentStatus.SUCCEEDED ? 'PAID' : 'OPEN',
          totalCents: plan.priceCents,
          currency: 'AUD',
          isDeleted: false,
        },
      },
      { upsert: true },
    );

    if (status === PaymentStatus.REFUNDED || status === PaymentStatus.PARTIALLY_REFUNDED) {
      await RefundModel.updateOne(
        { providerRefundId: `refund_demo_${member.member.displayId.toLowerCase()}_${index}` },
        {
          $set: {
            userId: member.userId,
            paymentId: payment._id,
            amountCents: Math.max(100, payment.refundedAmountCents),
            currency: 'AUD',
            status: RefundStatus.SUCCEEDED,
            provider: 'demo',
            providerRefundId: `refund_demo_${member.member.displayId.toLowerCase()}_${index}`,
            reason: 'Demo refund record for admin payment queue.',
            isDeleted: false,
          },
        },
        { upsert: true },
      );
    }
  }

  for (let index = 0; index < 13; index += 1) {
    const member = pick(active, index + 4);
    await ProfileBoostModel.updateOne(
      {
        profileId: member.profileId,
        source: pick(['ENTITLEMENT', 'PURCHASE', 'ADMIN'] as const, index),
      },
      {
        $set: {
          userId: member.userId,
          profileId: member.profileId,
          source: pick(['ENTITLEMENT', 'PURCHASE', 'ADMIN'] as const, index),
          startsAt:
            index < 5
              ? new Date(now.getTime() - dayMs)
              : index < 10
                ? new Date(now.getTime() - 12 * dayMs)
                : new Date(now.getTime() + 3 * dayMs),
          endsAt:
            index < 5
              ? new Date(now.getTime() + 5 * dayMs)
              : index < 10
                ? new Date(now.getTime() - dayMs)
                : new Date(now.getTime() + 10 * dayMs),
          active: index < 5,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }
}

async function seedCmsAndBlog() {
  const pages = [
    ['about', 'About Us'],
    ['contact', 'Contact Us'],
    ['privacy', 'Privacy Policy'],
    ['terms', 'Terms & Conditions'],
    ['refund-policy', 'Refund Policy'],
    ['safety', 'Safety Guidelines'],
    ['community-guidelines', 'Community Guidelines'],
    ['verification-policy', 'Verification Policy'],
    ['help', 'Help Centre'],
    ['faq', 'FAQ'],
  ] as const;
  for (const [slug, titleValue] of pages) {
    await CmsPageModel.updateOne(
      { slug },
      {
        $set: {
          slug,
          title: titleValue,
          body: `${titleValue} for Vivah Australia. This polished demo content explains our premium, safe, and respectful matrimonial experience for Australian singles and families.`,
          seoTitle: `${titleValue} | Vivah Australia`,
          seoDescription: `${titleValue} information for Vivah Australia demo users.`,
          published: true,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  const blogTitles = [
    'How to Create a Strong Matrimonial Profile',
    'Online Safety Tips Before Meeting a Match',
    'What Families Should Know About Modern Matchmaking',
    'Understanding Verification Badges',
    'How to Start a Respectful Conversation',
    'Choosing the Right Membership Plan',
    'Matrimony for Professionals in Australia',
    'Privacy Tips for Online Matchmaking',
  ];
  const author = await UserModel.findOne({ email: 'manager@vivahaustralia.com' }).orFail();
  for (const [index, titleValue] of blogTitles.entries()) {
    const slug = titleValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    await BlogPostModel.updateOne(
      { slug },
      {
        $set: {
          slug,
          title: titleValue,
          body: `${titleValue}. Practical guidance for respectful, safe, and family-aware matrimonial matching in Australia. This demo article includes category metadata, tags, and a placeholder cover image in the body content.`,
          published: true,
          authorId: author._id,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
    await BannerModel.updateOne(
      { key: `blog-${index + 1}` },
      {
        $set: {
          key: `blog-${index + 1}`,
          title: titleValue,
          imageUrl: `https://demo.vivahaustralia.com.au/blog/${slug}.jpg`,
          active: true,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  await SystemSettingModel.updateOne(
    { key: 'homepageContent' },
    {
      $set: {
        key: 'homepageContent',
        description: 'Seeded public homepage demo content',
        value: {
          hero: {
            title: 'Vivah Australia',
            subtitle: 'A premium matrimonial platform for serious Australian singles and families.',
            primaryAction: 'Create Free Profile',
            secondaryAction: 'Browse Membership',
          },
          howItWorks: [
            'Create your profile',
            'Verify your details',
            'Connect with compatible matches',
          ],
          safety: ['Manual moderation', 'Verification badges', 'Private gallery controls'],
          faq: [
            {
              question: 'Is Vivah Australia available nationally?',
              answer: 'Yes, the platform is designed for members across Australia.',
            },
            {
              question: 'Can I control profile visibility?',
              answer:
                'Yes, member visibility and private fields can be managed from profile settings.',
            },
          ],
          contact: { email: 'support@vivahaustralia.com.au', location: 'Australia' },
        },
        isDeleted: false,
      },
    },
    { upsert: true },
  );

  await TestimonialModel.updateOne(
    { name: 'Demo Family' },
    {
      $set: {
        name: 'Demo Family',
        quote:
          'Vivah Australia gave our family a calm, respectful way to explore compatible introductions.',
        published: true,
        isDeleted: false,
      },
    },
    { upsert: true },
  );
  await SuccessStoryModel.updateOne(
    { slug: 'melbourne-demo-match' },
    {
      $set: {
        slug: 'melbourne-demo-match',
        title: 'A thoughtful Melbourne match',
        body: 'A safe demo success story for showcasing the member experience.',
        coupleName: 'Demo Couple',
        published: true,
        isDeleted: false,
      },
    },
    { upsert: true },
  );
}

async function seedCommunity(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const rooms = [
    ['general-discussions', 'General Discussions'],
    ['new-members', 'New Members'],
    ['success-stories', 'Success Stories'],
    ['community-support', 'Community Support'],
    ['cultural-discussions', 'Cultural Discussions'],
    ['platform-announcements', 'Platform Announcements'],
  ] as const;
  for (const [roomIndex, [slug, name]] of rooms.entries()) {
    const room = await CommunityRoomModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          slug,
          name,
          description: `${name} for respectful demo community participation.`,
          isDefault: roomIndex < 3,
          isDeleted: false,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).orFail();
    for (let postIndex = 0; postIndex < 5; postIndex += 1) {
      const author = pick(active, roomIndex + postIndex);
      const post = await CommunityPostModel.findOneAndUpdate(
        { roomId: room._id, title: `${name} demo topic ${postIndex + 1}` },
        {
          $set: {
            roomId: room._id,
            authorId: author.userId,
            title: `${name} demo topic ${postIndex + 1}`,
            body: 'A respectful demo post for community UI testing and moderation workflows.',
            status: CommunityPostStatus.PUBLISHED,
            isDeleted: false,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      ).orFail();
      for (let commentIndex = 0; commentIndex < 3; commentIndex += 1) {
        const commenter = pick(active, roomIndex + postIndex + commentIndex + 2);
        await CommunityCommentModel.updateOne(
          {
            postId: post._id,
            authorId: commenter.userId,
            body: `Demo comment ${commentIndex + 1}`,
          },
          {
            $set: {
              postId: post._id,
              authorId: commenter.userId,
              body: `Demo comment ${commentIndex + 1}`,
              isDeleted: false,
            },
          },
          { upsert: true },
        );
        const reaction = pick(['LIKE', 'LOVE', 'HELPFUL'], commentIndex);
        await CommunityReactionModel.updateOne(
          { targetType: 'POST', targetId: post._id, userId: commenter.userId, reaction },
          {
            $set: {
              targetType: 'POST',
              targetId: post._id,
              userId: commenter.userId,
              reaction,
              isDeleted: false,
            },
          },
          { upsert: true },
        );
      }
    }
  }
}

async function seedLogsAndRisk(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  const admin = await UserModel.findOne({ email: 'admin@vivahaustralia.com' }).orFail();
  const auditActions = [
    'ADMIN_LOGIN',
    'USER_STATUS_CHANGE',
    'ROLE_CHANGE',
    'PROFILE_APPROVAL',
    'PROFILE_REJECTION',
    'VERIFICATION_APPROVAL',
    'VERIFICATION_REJECTION',
    'REPORT_RESOLVED',
    'PAYMENT_REFUND',
    'CMS_UPDATE',
  ];
  for (let index = 0; index < 50; index += 1) {
    const target = pick(active, index);
    await AuditLogModel.updateOne(
      {
        action: pick(auditActions, index),
        targetUserId: target.userId,
        'metadata.sequence': index,
      },
      {
        $set: {
          actorId: admin._id,
          actorRole: UserRole.SUPER_ADMIN,
          action: pick(auditActions, index),
          targetType: 'USER',
          targetId: target.profileId,
          targetUserId: target.userId,
          metadata: seedMetadata({ sequence: index }),
          ipAddress: '127.0.0.1',
          userAgent: 'Vivah demo seed',
        },
      },
      { upsert: true },
    );
  }

  const activityEvents = [
    'LOGIN',
    'PROFILE_UPDATE',
    'SEARCH_PERFORMED',
    'INTEREST_SENT',
    'INTEREST_ACCEPTED',
    'MESSAGE_SENT',
    'VERIFICATION_SUBMITTED',
    'PAYMENT_COMPLETED',
    'NOTIFICATION_READ',
    'PROFILE_VIEWED',
  ];
  for (let index = 0; index < 100; index += 1) {
    const target = pick(active, index);
    await ActivityLogModel.updateOne(
      { actorId: target.userId, event: pick(activityEvents, index), 'metadata.sequence': index },
      {
        $set: {
          actorId: target.userId,
          event: pick(activityEvents, index),
          metadata: seedMetadata({ sequence: index, displayId: target.member.displayId }),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  const fraudRules = [
    'SUSPICIOUS_LOGIN_ATTEMPTS',
    'DUPLICATE_ACCOUNT_INDICATOR',
    'REPEATED_REPORTS',
    'HIGH_RISK_USER',
    'VERIFICATION_MISMATCH',
    'MULTIPLE_FAILED_LOGIN_EVENTS',
  ];
  for (let index = 0; index < 18; index += 1) {
    const target = pick(active, index + 4);
    await FraudEventModel.updateOne(
      { userId: target.userId, rule: pick(fraudRules, index), 'metadata.sequence': index },
      {
        $set: {
          userId: target.userId,
          rule: pick(fraudRules, index),
          severity: pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, index),
          status: pick(['OPEN', 'REVIEWED', 'DISMISSED'] as const, index),
          score: 20 + index * 3,
          metadata: seedMetadata({ sequence: index }),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }
}

async function seedSupportingRecords(
  records: Map<string, { userId: ObjectId; profileId: ObjectId; member: DemoMember }>,
) {
  const active = activeMembers(records);
  for (let index = 0; index < 12; index += 1) {
    const member = pick(active, index);
    await ProfileViewModel.updateOne(
      { viewerId: member.userId, profileId: pick(active, index + 5).profileId },
      {
        $set: {
          viewerId: member.userId,
          profileId: pick(active, index + 5).profileId,
          profileUserId: pick(active, index + 5).userId,
          viewedAt: new Date(now.getTime() - index * 3600000),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
    await SavedSearchModel.updateOne(
      { userId: member.userId, name: 'Demo compatible matches' },
      {
        $set: {
          userId: member.userId,
          name: 'Demo compatible matches',
          query: { city: [member.member.city], ageMin: 25, ageMax: 40 },
          notifyOnNewMatches: index % 2 === 0,
          lastRunAt: new Date(now.getTime() - index * dayMs),
          isDeleted: false,
        },
      },
      { upsert: true },
    );
    await PushSubscriptionModel.updateOne(
      {
        userId: member.userId,
        endpoint: `https://push.demo.vivahaustralia.com.au/${member.member.displayId}`,
      },
      {
        $set: {
          userId: member.userId,
          endpoint: `https://push.demo.vivahaustralia.com.au/${member.member.displayId}`,
          keys: { p256dh: `demo-p256dh-${index}`, auth: `demo-auth-${index}` },
          userAgent: 'Vivah demo browser',
          active: true,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  const manager = await UserModel.findOne({ email: 'manager@vivahaustralia.com' }).orFail();
  for (let index = 0; index < 8; index += 1) {
    const member = pick(active, index + 8);
    await AdminNoteModel.updateOne(
      { userId: member.userId, authorId: manager._id, note: `Demo admin note ${index + 1}` },
      {
        $set: {
          userId: member.userId,
          authorId: manager._id,
          note: `Demo admin note ${index + 1}`,
          isDeleted: false,
        },
      },
      { upsert: true },
    );
  }

  await ContactInquiryModel.updateOne(
    { email: 'demo.contact@example.com', subject: 'Membership question' },
    {
      $set: {
        name: 'Demo Contact',
        email: 'demo.contact@example.com',
        phone: '+61400009999',
        subject: 'Membership question',
        message: 'I would like to learn more about Vivah Australia memberships.',
        status: 'NEW',
        isDeleted: false,
      },
    },
    { upsert: true },
  );
}

async function resetDemoData() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      'Refusing to reset seed data in production without ALLOW_PRODUCTION_SEED=true.',
    );
  }

  const memberEmails = members.map((member) => member.email);
  const adminEmails = admins.map((admin) => admin.email);
  const demoUsers = await UserModel.find({
    email: { $in: [...memberEmails, ...adminEmails] },
  }).select('_id');
  const demoUserIds = demoUsers.map((user) => user._id);
  const demoProfiles = await ProfileModel.find({
    displayId: { $in: members.map((member) => member.displayId) },
  }).select('_id');
  const demoProfileIds = demoProfiles.map((profile) => profile._id);

  await Promise.all([
    ProfileMediaModel.deleteMany({
      $or: [{ userId: { $in: demoUserIds } }, { profileId: { $in: demoProfileIds } }],
    }),
    VerificationRequestModel.deleteMany({ userId: { $in: demoUserIds } }),
    VerificationDocumentModel.deleteMany({ userId: { $in: demoUserIds } }),
    InterestModel.deleteMany({
      $or: [{ senderId: { $in: demoUserIds } }, { receiverId: { $in: demoUserIds } }],
    }),
    FavouriteModel.deleteMany({ userId: { $in: demoUserIds } }),
    BlockModel.deleteMany({
      $or: [{ blockerId: { $in: demoUserIds } }, { blockedId: { $in: demoUserIds } }],
    }),
    ReportModel.deleteMany({
      $or: [{ reporterId: { $in: demoUserIds } }, { reportedUserId: { $in: demoUserIds } }],
    }),
    ProfileViewModel.deleteMany({
      $or: [{ viewerId: { $in: demoUserIds } }, { profileId: { $in: demoProfileIds } }],
    }),
    SavedSearchModel.deleteMany({ userId: { $in: demoUserIds } }),
    ConversationModel.deleteMany({ participantIds: { $in: demoUserIds } }),
    MessageModel.deleteMany({ senderId: { $in: demoUserIds } }),
    NotificationModel.deleteMany({ userId: { $in: demoUserIds } }),
    SubscriptionModel.deleteMany({ userId: { $in: demoUserIds } }),
    PaymentModel.deleteMany({ userId: { $in: demoUserIds } }),
    InvoiceModel.deleteMany({ userId: { $in: demoUserIds } }),
    RefundModel.deleteMany({ userId: { $in: demoUserIds } }),
    ProfileBoostModel.deleteMany({ userId: { $in: demoUserIds } }),
    PushSubscriptionModel.deleteMany({ userId: { $in: demoUserIds } }),
    FraudEventModel.deleteMany({ userId: { $in: demoUserIds } }),
    AuditLogModel.deleteMany({
      $or: [
        { actorId: { $in: demoUserIds } },
        { targetUserId: { $in: demoUserIds } },
        { 'metadata.seedTag': DEMO_TAG },
      ],
    }),
    ActivityLogModel.deleteMany({
      $or: [{ actorId: { $in: demoUserIds } }, { 'metadata.seedTag': DEMO_TAG }],
    }),
    AdminNoteModel.deleteMany({ userId: { $in: demoUserIds } }),
    CommunityReactionModel.deleteMany({ userId: { $in: demoUserIds } }),
    CommunityCommentModel.deleteMany({ authorId: { $in: demoUserIds } }),
    CommunityPostModel.deleteMany({ authorId: { $in: demoUserIds } }),
    ProfileModel.deleteMany({ _id: { $in: demoProfileIds } }),
    UserModel.deleteMany({ email: { $in: [...memberEmails, ...adminEmails] } }),
    PlanModel.deleteMany({ code: { $in: plans.map((plan) => plan.code) } }),
    CouponModel.deleteMany({ code: { $in: ['WELCOME20', 'VERIFIED10', 'PLATINUM50'] } }),
    CmsPageModel.deleteMany({
      slug: {
        $in: [
          'about',
          'contact',
          'privacy',
          'terms',
          'refund-policy',
          'safety',
          'community-guidelines',
          'verification-policy',
          'help',
          'faq',
        ],
      },
    }),
    BlogPostModel.deleteMany({
      slug: {
        $regex:
          /^(how-to-create|online-safety|what-families|understanding-verification|how-to-start|choosing-the-right|matrimony-for|privacy-tips)/,
      },
    }),
    TestimonialModel.deleteMany({ name: 'Demo Family' }),
    SuccessStoryModel.deleteMany({ slug: 'melbourne-demo-match' }),
    BannerModel.deleteMany({ key: { $regex: /^blog-\d+$/ } }),
    CommunityRoomModel.deleteMany({
      slug: {
        $in: [
          'general-discussions',
          'new-members',
          'success-stories',
          'community-support',
          'cultural-discussions',
          'platform-announcements',
        ],
      },
    }),
    SystemSettingModel.deleteMany({ key: 'homepageContent' }),
    ContactInquiryModel.deleteMany({ email: 'demo.contact@example.com' }),
  ]);
}

async function runSeed() {
  const mode = process.argv.includes('--reset') ? 'reset' : 'demo';
  await connectDatabase(env.MONGODB_URI);
  await syncModelIndexes();

  if (mode === 'reset') {
    await resetDemoData();
  }

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const memberPasswordHash = await bcrypt.hash(MEMBER_PASSWORD, 12);

  await seedAdmins(adminPasswordHash);
  await seedPlans();
  const records = await seedMembers(memberPasswordHash);
  await seedMedia(records);
  await seedInteractions(records);
  await seedReports(records);
  await seedMessages(records);
  await seedVerifications(records);
  await seedNotifications(records);
  await seedBilling(records);
  await seedCmsAndBlog();
  await seedCommunity(records);
  await seedLogsAndRisk(records);
  await seedSupportingRecords(records);

  console.log('\n' + '='.repeat(72));
  console.log(`Vivah Australia ${mode === 'reset' ? 'reset + ' : ''}demo seed complete`);
  console.log('='.repeat(72));
  console.log('Admins:');
  console.log(`  Super Admin: admin@vivahaustralia.com / ${ADMIN_PASSWORD}`);
  console.log(`  Admin:       manager@vivahaustralia.com / ${ADMIN_PASSWORD}`);
  console.log(`  Moderator:   moderator@vivahaustralia.com / ${ADMIN_PASSWORD}`);
  console.log('Members:');
  console.log(`  ${members.length} demo members / ${MEMBER_PASSWORD}`);
  console.log('  Demo members: priya.sharma@example.com, arjun.patel@example.com');
  console.log(
    'Data: profiles, media, matches, messages, verification, notifications, billing, CMS, community, reports, logs.',
  );
  console.log('='.repeat(72) + '\n');

  await disconnectDatabase();
}

runSeed().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase();
  process.exitCode = 1;
});
