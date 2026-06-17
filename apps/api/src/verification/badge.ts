import { VerificationLevel } from '@vivah/shared';
import { SystemSettingModel } from '../models/index.js';

type VerificationFlags = {
  emailVerified?: boolean;
  mobileVerified?: boolean;
  identityVerified?: boolean;
  addressVerified?: boolean;
  employmentVerified?: boolean;
  visaVerified?: boolean;
  policeClearanceVerified?: boolean;
  facialVerified?: boolean;
  verification?: VerificationFlags;
};

export const VERIFICATION_BADGE_RULES_SETTING_KEY = 'verificationBadgeRules';

export const verificationBadgeRuleKeys = [
  'emailVerified',
  'mobileVerified',
  'identityVerified',
  'addressVerified',
  'employmentVerified',
  'visaVerified',
  'policeClearanceVerified',
  'facialVerified',
] as const;

export type VerificationBadgeRuleKey = (typeof verificationBadgeRuleKeys)[number];

export type VerificationBadgeTier =
  | typeof VerificationLevel.BASIC
  | typeof VerificationLevel.SILVER
  | typeof VerificationLevel.GOLD
  | typeof VerificationLevel.PLATINUM
  | typeof VerificationLevel.FULLY_VERIFIED;

export interface VerificationBadgeRuleGroup {
  count: number;
  from: VerificationBadgeRuleKey[];
}

export interface VerificationBadgeTierRule {
  allOf: VerificationBadgeRuleKey[];
  atLeast?: VerificationBadgeRuleGroup[];
}

export type VerificationBadgeRules = Record<VerificationBadgeTier, VerificationBadgeTierRule>;

const tierOrder: VerificationBadgeTier[] = [
  VerificationLevel.FULLY_VERIFIED,
  VerificationLevel.PLATINUM,
  VerificationLevel.GOLD,
  VerificationLevel.SILVER,
  VerificationLevel.BASIC,
];

export const DEFAULT_VERIFICATION_BADGE_RULES: VerificationBadgeRules = {
  [VerificationLevel.BASIC]: {
    allOf: ['emailVerified', 'mobileVerified'],
  },
  [VerificationLevel.SILVER]: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
  },
  [VerificationLevel.GOLD]: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
    atLeast: [{ count: 1, from: ['addressVerified', 'employmentVerified', 'visaVerified'] }],
  },
  [VerificationLevel.PLATINUM]: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
    atLeast: [
      {
        count: 2,
        from: [
          'addressVerified',
          'employmentVerified',
          'visaVerified',
          'policeClearanceVerified',
          'facialVerified',
        ],
      },
    ],
  },
  [VerificationLevel.FULLY_VERIFIED]: {
    allOf: ['emailVerified', 'mobileVerified', 'identityVerified', 'addressVerified'],
    atLeast: [
      { count: 1, from: ['employmentVerified', 'visaVerified'] },
      { count: 1, from: ['policeClearanceVerified', 'facialVerified'] },
    ],
  },
};

function normalizeFlags(profileOrUser: VerificationFlags) {
  return profileOrUser.verification ?? profileOrUser;
}

function isRuleKey(value: unknown): value is VerificationBadgeRuleKey {
  return typeof value === 'string' && verificationBadgeRuleKeys.includes(value as VerificationBadgeRuleKey);
}

function parseRuleKeys(value: unknown): VerificationBadgeRuleKey[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value.filter(isRuleKey);
  if (parsed.length !== value.length) {
    return null;
  }

  return Array.from(new Set(parsed));
}

function parseRuleGroup(value: unknown): VerificationBadgeRuleGroup | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const count = 'count' in value ? value.count : undefined;
  const from = 'from' in value ? parseRuleKeys(value.from) : null;

  if (
    typeof count !== 'number' ||
    !Number.isInteger(count) ||
    count < 1 ||
    !from ||
    from.length === 0 ||
    count > from.length
  ) {
    return null;
  }

  return { count, from };
}

function parseTierRule(value: unknown): VerificationBadgeTierRule | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const allOf = 'allOf' in value ? parseRuleKeys(value.allOf) : null;
  if (!allOf) {
    return null;
  }

  let atLeast: VerificationBadgeRuleGroup[] | undefined;
  if ('atLeast' in value && value.atLeast !== undefined) {
    if (!Array.isArray(value.atLeast)) {
      return null;
    }

    const parsedGroups = value.atLeast.map(parseRuleGroup);
    if (parsedGroups.some((group) => group === null)) {
      return null;
    }

    atLeast = parsedGroups.filter((group): group is VerificationBadgeRuleGroup => Boolean(group));
  }

  return { allOf, ...(atLeast && atLeast.length > 0 ? { atLeast } : {}) };
}

export function parseVerificationBadgeRulesSetting(value: unknown): VerificationBadgeRules | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsedEntries = tierOrder.map((tier) => {
    const tierValue = (value as Record<string, unknown>)[tier];
    return [tier, parseTierRule(tierValue)] as const;
  });

  if (parsedEntries.some(([, tierRule]) => tierRule === null)) {
    return null;
  }

  return Object.fromEntries(
    parsedEntries.map(([tier, tierRule]) => [tier, tierRule]),
  ) as VerificationBadgeRules;
}

export async function getVerificationBadgeRules(): Promise<VerificationBadgeRules> {
  const setting = (await SystemSettingModel.findOne({
    key: VERIFICATION_BADGE_RULES_SETTING_KEY,
    isDeleted: false,
  })
    .select('value')
    .lean()) as { value?: unknown } | null;

  return parseVerificationBadgeRulesSetting(setting?.value) ?? DEFAULT_VERIFICATION_BADGE_RULES;
}

function meetsTierRule(flags: VerificationFlags, rule: VerificationBadgeTierRule) {
  if (!rule.allOf.every((key) => Boolean(flags[key]))) {
    return false;
  }

  if (!rule.atLeast?.length) {
    return true;
  }

  return rule.atLeast.every((group) => {
    const satisfied = group.from.filter((key) => Boolean(flags[key])).length;
    return satisfied >= group.count;
  });
}

export function calculateVerificationBadgeFromRules(
  profileOrUser: VerificationFlags,
  rules: VerificationBadgeRules,
) {
  const flags = normalizeFlags(profileOrUser);

  for (const tier of tierOrder) {
    if (meetsTierRule(flags, rules[tier])) {
      return tier;
    }
  }

  return VerificationLevel.NONE;
}

export async function calculateVerificationBadge(profileOrUser: VerificationFlags) {
  const rules = await getVerificationBadgeRules();
  return calculateVerificationBadgeFromRules(profileOrUser, rules);
}
