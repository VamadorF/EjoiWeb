// AUTO-SINCRONIZADO desde ejoiFE 64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7@64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7:src/features/proactivity/adapters/proactivity.adapter.ts. No editar: npm run sync:app
import {
  DEFAULT_PREFERRED_CONTACT,
  DEFAULT_PROACTIVITY_PREFERENCES,
  DEFAULT_QUIET_HOURS,
  PROACTIVITY_TYPE_KEY_TO_FLAG,
  type PreferenceChange,
  type PreferenceChangeStatus,
  type PreferredContactPreference,
  type ProactivityPreferences,
  type ProactivityPreferencesPatch,
  type ProactivityTypeFlags,
  type ProactivityTypeKey,
  type QuietHoursPreference,
} from '../types';

const PREFERENCE_CHANGE_STATUSES: readonly PreferenceChangeStatus[] = [
  'proposed',
  'applied',
  'rejected',
  'clarification_needed',
];

const CANONICAL_FLAGS: readonly (keyof ProactivityTypeFlags)[] = [
  'spontaneousGreetings',
  'followUps',
  'specialDates',
  'reminders',
];

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPreferenceChangeStatus = (value: unknown): value is PreferenceChangeStatus =>
  typeof value === 'string' &&
  (PREFERENCE_CHANGE_STATUSES as readonly string[]).includes(value);

const isProactivityTypeKey = (value: string): value is ProactivityTypeKey =>
  value in PROACTIVITY_TYPE_KEY_TO_FLAG;

const isHhMm = (value: unknown): value is string =>
  typeof value === 'string' && HH_MM.test(value.trim());

const fromRawQuietHours = (value: unknown): Partial<QuietHoursPreference> | undefined => {
  if (!isRecord(value)) return undefined;
  const quietHours: Partial<QuietHoursPreference> = {};
  if (typeof value.enabled === 'boolean') quietHours.enabled = value.enabled;
  if (isHhMm(value.start)) quietHours.start = value.start.trim();
  if (isHhMm(value.end)) quietHours.end = value.end.trim();
  return Object.keys(quietHours).length > 0 ? quietHours : undefined;
};

const fromRawPreferredContact = (
  value: unknown,
): Partial<PreferredContactPreference> | undefined => {
  if (!isRecord(value)) return undefined;
  const preferred: Partial<PreferredContactPreference> = {};
  if (typeof value.enabled === 'boolean') preferred.enabled = value.enabled;
  if (Array.isArray(value.times)) {
    preferred.times = value.times.filter(isHhMm).map((item) => item.trim());
  }
  return Object.keys(preferred).length > 0 ? preferred : undefined;
};

/**
 * Normaliza un patch de chat/GET al shape canónico de cuenta.
 * camelCase gana sobre `interactionTypes`. Incluye quietHours, preferredContact y timezone.
 */
export const fromRawProactivityPreferencesPatch = (
  value: unknown,
): ProactivityPreferencesPatch | undefined => {
  if (!isRecord(value)) return undefined;

  const patch: ProactivityPreferencesPatch = {};

  if (isRecord(value.interactionTypes)) {
    for (const [rawKey, rawVal] of Object.entries(value.interactionTypes)) {
      const key = rawKey.trim();
      if (isProactivityTypeKey(key) && typeof rawVal === 'boolean') {
        patch[PROACTIVITY_TYPE_KEY_TO_FLAG[key]] = rawVal;
      }
    }
  }

  for (const flag of CANONICAL_FLAGS) {
    const raw = value[flag];
    if (typeof raw === 'boolean') {
      patch[flag] = raw;
    }
  }

  const quietHours = fromRawQuietHours(value.quietHours);
  if (quietHours) patch.quietHours = quietHours;

  const preferredContact = fromRawPreferredContact(value.preferredContact);
  if (preferredContact) patch.preferredContact = preferredContact;

  if (value.timezone === null) {
    patch.timezone = null;
  } else if (typeof value.timezone === 'string' && value.timezone.trim()) {
    patch.timezone = value.timezone.trim();
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
};

export const fromRawPreferenceChange = (value: unknown): PreferenceChange | undefined => {
  if (!isRecord(value) || !isPreferenceChangeStatus(value.status)) {
    return undefined;
  }

  const proposalId =
    typeof value.proposalId === 'string' && value.proposalId.trim()
      ? value.proposalId.trim()
      : undefined;

  const change: PreferenceChange = { status: value.status };
  if (proposalId) change.proposalId = proposalId;
  const patch = fromRawProactivityPreferencesPatch(value.patch);
  const applied = fromRawProactivityPreferencesPatch(value.applied);
  if (patch) change.patch = patch;
  if (applied) change.applied = applied;
  return change;
};

export const fromRawProactivityPreferences = (value: unknown): ProactivityPreferences => {
  const patch = fromRawProactivityPreferencesPatch(value) ?? {};
  return {
    ...DEFAULT_PROACTIVITY_PREFERENCES,
    ...patch,
    quietHours: {
      ...DEFAULT_QUIET_HOURS,
      ...(patch.quietHours ?? {}),
    },
    preferredContact: {
      ...DEFAULT_PREFERRED_CONTACT,
      times: patch.preferredContact?.times ?? [...DEFAULT_PREFERRED_CONTACT.times],
      ...(patch.preferredContact?.enabled !== undefined
        ? { enabled: patch.preferredContact.enabled }
        : {}),
    },
    timezone: patch.timezone === undefined ? null : patch.timezone,
  };
};

export const shouldInvalidateProactivityPreferences = (
  preferenceChange?: PreferenceChange,
): boolean => preferenceChange?.status === 'applied';
