import bcrypt from 'bcryptjs';
import { AccountStatus, Gender, MaritalStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { env } from '../env.js';
import {
  AuthProvider,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  UserModel,
  phaseOneModels,
} from '../models/index.js';

interface SeedUserProfile {
  email: string;
  firstName: string;
  lastName: string;
  gender: (typeof Gender)[keyof typeof Gender];
  dateOfBirth: Date;
  displayId: string;
  slug: string;
  city: string;
  occupation: string;
}

const samplePlans = [
  {
    code: 'FREE',
    name: 'Free',
    priceCents: 0,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Create profile', 'Browse public profiles'],
    limits: { interestsPerMonth: 5, messagesPerMonth: 0 },
    active: true,
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    priceCents: 4900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Send interests', 'View contact-gated profile details', 'Message matches'],
    limits: { interestsPerMonth: 50, messagesPerMonth: 500 },
    active: true,
  },
  {
    code: 'PLATINUM',
    name: 'Platinum',
    priceCents: 9900,
    currency: 'AUD',
    interval: 'MONTH',
    features: ['Priority profile visibility', 'Dedicated matchmaking review', 'Unlimited messages'],
    limits: { interestsPerMonth: 200, messagesPerMonth: 5000 },
    active: true,
  },
] as const;

const sampleProfiles: SeedUserProfile[] = [
  {
    email: 'amit.test@example.com',
    firstName: 'Amit',
    lastName: 'Sharma',
    gender: Gender.MALE,
    dateOfBirth: new Date('1992-04-12'),
    displayId: 'VA100001',
    slug: 'amit-sharma-va100001',
    city: 'Melbourne',
    occupation: 'Software Engineer',
  },
  {
    email: 'priya.test@example.com',
    firstName: 'Priya',
    lastName: 'Patel',
    gender: Gender.FEMALE,
    dateOfBirth: new Date('1994-08-23'),
    displayId: 'VA100002',
    slug: 'priya-patel-va100002',
    city: 'Sydney',
    occupation: 'Accountant',
  },
  {
    email: 'rajesh.test@example.com',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    gender: Gender.MALE,
    dateOfBirth: new Date('1990-06-15'),
    displayId: 'VA100003',
    slug: 'rajesh-kumar-va100003',
    city: 'Brisbane',
    occupation: 'Consultant',
  },
  {
    email: 'neha.test@example.com',
    firstName: 'Neha',
    lastName: 'Singh',
    gender: Gender.FEMALE,
    dateOfBirth: new Date('1996-12-08'),
    displayId: 'VA100004',
    slug: 'neha-singh-va100004',
    city: 'Perth',
    occupation: 'Doctor',
  },
  {
    email: 'arjun.test@example.com',
    firstName: 'Arjun',
    lastName: 'Desai',
    gender: Gender.MALE,
    dateOfBirth: new Date('1988-03-22'),
    displayId: 'VA100005',
    slug: 'arjun-desai-va100005',
    city: 'Adelaide',
    occupation: 'Lawyer',
  },
];

function calculateAge(dateOfBirth: Date, asOf = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = asOf.getMonth() - dateOfBirth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return age;
}

async function syncModelIndexes() {
  await Promise.all(
    [UserModel, ProfileModel, ...phaseOneModels].map((model) => model.syncIndexes()),
  );
}

async function seedAdmin() {
  const email = env.ADMIN_SEED_EMAIL ?? 'admin@example.com';
  const password = env.ADMIN_SEED_PASSWORD ?? 'ChangeMeStrong123!';
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await UserModel.updateOne(
    { email },
    {
      $setOnInsert: {
        email,
        passwordHash,
        authProviders: [AuthProvider.EMAIL],
        role: UserRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        mobileVerified: false,
        failedLoginAttempts: 0,
        refreshTokenVersion: 0,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        marketingConsent: false,
        metadata: {},
      },
    },
    { upsert: true },
  );
}

async function seedPlans() {
  await Promise.all(
    samplePlans.map((plan) =>
      PlanModel.updateOne(
        { code: plan.code },
        {
          $set: {
            name: plan.name,
            priceCents: plan.priceCents,
            currency: plan.currency,
            interval: plan.interval,
            features: [...plan.features],
            limits: plan.limits,
            active: plan.active,
          },
        },
        { upsert: true },
      ),
    ),
  );
}

async function seedTestProfiles() {
  const passwordHash = await bcrypt.hash('TestUserStrong123!', 12);
  const now = new Date();

  for (const sample of sampleProfiles) {
    await UserModel.updateOne(
      { email: sample.email },
      {
        $setOnInsert: {
          email: sample.email,
          passwordHash,
          authProviders: [AuthProvider.EMAIL],
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
          mobileVerified: false,
          failedLoginAttempts: 0,
          refreshTokenVersion: 0,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          marketingConsent: false,
          metadata: {},
        },
      },
      { upsert: true },
    );

    const user = await UserModel.findOne({ email: sample.email }).orFail();
    const userId = user._id;

    await ProfileModel.updateOne(
      { userId },
      {
        $setOnInsert: {
          userId,
          displayId: sample.displayId,
          slug: sample.slug,
          completionPercentage: 85,
          personal: {
            firstName: sample.firstName,
            lastName: sample.lastName,
            gender: sample.gender,
            dateOfBirth: sample.dateOfBirth,
            age: calculateAge(sample.dateOfBirth),
            maritalStatus: MaritalStatus.NEVER_MARRIED,
          },
          religion: {
            religion: 'Hindu',
            community: 'Indian',
            motherTongue: 'English',
            languagesSpoken: ['English', 'Hindi'],
          },
          location: {
            country: 'Australia',
            state: sample.city === 'Sydney' ? 'NSW' : 'VIC',
            city: sample.city,
          },
          education: {
            highestQualification: 'Bachelor degree',
          },
          employment: {
            occupation: sample.occupation,
            annualIncomeVisibility: 'PRIVATE',
          },
          family: {},
          lifestyle: {},
          about: {
            aboutMe: `${sample.firstName} is a sample member profile for development testing.`,
            hobbies: ['Travel', 'Food'],
          },
          partnerPreference: {
            ageMin: 25,
            ageMax: 36,
            countries: ['Australia'],
          },
          verification: {
            level: 'BASIC',
            emailVerified: true,
            mobileVerified: false,
            identityVerified: false,
            addressVerified: false,
            employmentVerified: false,
            visaVerified: false,
            policeClearanceVerified: false,
            facialVerified: false,
          },
          visibility: {
            status: 'MEMBERS_ONLY',
            showPhoto: true,
            showIncome: false,
            showEmployer: false,
            showLastName: false,
          },
          stats: {
            profileViews: 0,
            interestsReceived: 0,
            interestsSent: 0,
            favouritesCount: 0,
          },
          moderation: {
            approvalStatus: ProfileApprovalStatus.APPROVED,
          },
        },
      },
      { upsert: true },
    );
  }
}

async function runSeed() {
  await connectDatabase(env.MONGODB_URI);
  await syncModelIndexes();
  await seedAdmin();
  await seedPlans();
  await seedTestProfiles();
  
  // Print credentials to console
  console.log('\n' + '='.repeat(70));
  console.log('🌱 DATABASE SEEDING COMPLETE');
  console.log('='.repeat(70));
  
  const adminEmail = env.ADMIN_SEED_EMAIL ?? 'admin@example.com';
  const adminPassword = env.ADMIN_SEED_PASSWORD ?? 'ChangeMeStrong123!';
  
  console.log('\n👤 ADMIN USER');
  console.log('-'.repeat(70));
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Role:     SUPER_ADMIN`);
  
  console.log('\n👥 TEST USERS (All use password: TestUserStrong123!)');
  console.log('-'.repeat(70));
  sampleProfiles.forEach((profile) => {
    console.log(`${profile.firstName} ${profile.lastName}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  City:  ${profile.city}`);
    console.log(`  Job:   ${profile.occupation}`);
  });
  
  console.log('\n📋 PLANS SEEDED');
  console.log('-'.repeat(70));
  console.log('✓ FREE (0 AUD/month) - Limited features');
  console.log('✓ PREMIUM (49 AUD/month) - Send interests & messages');
  console.log('✓ PLATINUM (99 AUD/month) - Priority visibility');
  
  console.log('\n' + '='.repeat(70));
  console.log('Login at: http://localhost:3000/login');
  console.log('API Docs: http://localhost:4000/health');
  console.log('='.repeat(70) + '\n');
  
  await disconnectDatabase();
}

runSeed()
  .then(() => {
    console.log('Database seed completed.');
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
