// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/proactivity/types.ts. No editar: npm run sync:app
/**
 * Preferencias de proactividad — contrato canónico (SCRUM-35/36/37 + eJoi-BE).
 *
 * GET/PATCH `/proactivity/preferences`:
 * `{ spontaneousGreetings, followUps, specialDates, reminders, quietHours, timezone, preferredContact }`.
 *
 * El chat (SCRUM-38) emite `preferenceChange`. Las tools LLM no escriben `timezone`.
 *
 * @see src/features/chat/BACKEND_PROACTIVITY_PREFS_CONTRACT.ts
 */
export const PROACTIVITY_TYPE_KEYS = [
  'spontaneous_greetings',
  'follow_ups',
  'special_dates',
  'reminders',
] as const;

export type ProactivityTypeKey = (typeof PROACTIVITY_TYPE_KEYS)[number];

export type ProactivityTypeFlags = {
  spontaneousGreetings: boolean;
  followUps: boolean;
  specialDates: boolean;
  reminders: boolean;
};

export type QuietHoursPreference = {
  enabled: boolean;
  start: string;
  end: string;
};

export type PreferredContactPreference = {
  enabled: boolean;
  times: string[];
};

export type ProactivityPreferences = ProactivityTypeFlags & {
  quietHours: QuietHoursPreference;
  preferredContact: PreferredContactPreference;
  timezone: string | null;
};

export type ProactivityPreferencesPatch = Partial<ProactivityTypeFlags> & {
  quietHours?: Partial<QuietHoursPreference>;
  preferredContact?: Partial<PreferredContactPreference>;
  timezone?: string | null;
};

export const DEFAULT_QUIET_HOURS: QuietHoursPreference = {
  enabled: false,
  start: '23:00',
  end: '07:00',
};

export const DEFAULT_PREFERRED_CONTACT: PreferredContactPreference = {
  enabled: false,
  times: [],
};

export const DEFAULT_PROACTIVITY_PREFERENCES: ProactivityPreferences = {
  spontaneousGreetings: true,
  followUps: true,
  specialDates: true,
  reminders: true,
  quietHours: { ...DEFAULT_QUIET_HOURS },
  preferredContact: { ...DEFAULT_PREFERRED_CONTACT, times: [] },
  timezone: null,
};

export const PROACTIVITY_FLAG_TO_TYPE_KEY: Record<keyof ProactivityTypeFlags, ProactivityTypeKey> = {
  spontaneousGreetings: 'spontaneous_greetings',
  followUps: 'follow_ups',
  specialDates: 'special_dates',
  reminders: 'reminders',
};

export const PROACTIVITY_TYPE_KEY_TO_FLAG: Record<ProactivityTypeKey, keyof ProactivityTypeFlags> = {
  spontaneous_greetings: 'spontaneousGreetings',
  follow_ups: 'followUps',
  special_dates: 'specialDates',
  reminders: 'reminders',
};

export type PreferenceChangeStatus =
  | 'proposed'
  | 'applied'
  | 'rejected'
  | 'clarification_needed';

export interface PreferenceChange {
  status: PreferenceChangeStatus;
  proposalId?: string;
  patch?: ProactivityPreferencesPatch;
  applied?: ProactivityPreferencesPatch;
}
