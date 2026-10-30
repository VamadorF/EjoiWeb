// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/proactivity/api/proactivity.api.ts. No editar: npm run sync:app
import { httpClient, ApiError } from '@/shared/services/http/client';

import { fromRawProactivityPreferences } from '../adapters/proactivity.adapter';
import {
  DEFAULT_PROACTIVITY_PREFERENCES,
  type ProactivityPreferences,
  type ProactivityPreferencesPatch,
} from '../types';

export function fromProactivityPreferencesResponse(
  raw: unknown,
): ProactivityPreferences {
  return fromRawProactivityPreferences(raw);
}

export const getProactivityPreferences = async (): Promise<ProactivityPreferences> => {
  try {
    const response = await httpClient.get<unknown>('/proactivity/preferences');
    return fromProactivityPreferencesResponse(response.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ...DEFAULT_PROACTIVITY_PREFERENCES };
    }
    throw error;
  }
};

export const patchProactivityPreferences = async (
  patch: ProactivityPreferencesPatch,
): Promise<ProactivityPreferences> => {
  const response = await httpClient.patch<unknown>('/proactivity/preferences', patch);
  return fromProactivityPreferencesResponse(response.data);
};
