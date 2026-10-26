// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/proactivity/api/proactivity.api.ts. No editar: npm run sync:app
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
