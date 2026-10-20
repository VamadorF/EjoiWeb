import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import { httpClient } from '~/platform/http';
import {
  fetchCompanionProfile,
  invalidateCompanionProfile,
  type CompanionProfile,
} from '~/features/chat/useProfile';

import {
  buildConversationalPatchBody,
  hasConversationalChanges,
  profileToEditForm,
  type EditFormSnapshot,
} from './editPatch';

export type UseEditFormResult = {
  loaded: boolean;
  loadError: boolean;
  profile: CompanionProfile | null;
  baseline: EditFormSnapshot | null;
  values: EditFormSnapshot | null;
  setValues: Dispatch<SetStateAction<EditFormSnapshot | null>>;
  saving: boolean;
  saveError: string | null;
  conversationalDirty: boolean;
  saveConversational: () => Promise<boolean>;
  reload: () => Promise<void>;
  syncFromProfile: (profile: CompanionProfile) => void;
};

export function useEditForm(queryClient: QueryClient): UseEditFormResult {
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [baseline, setBaseline] = useState<EditFormSnapshot | null>(null);
  const [values, setValues] = useState<EditFormSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(false);
    try {
      const next = await fetchCompanionProfile();
      const form = profileToEditForm(next);
      setProfile(next);
      setBaseline(form);
      setValues(form);
    } catch {
      setLoadError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const conversationalDirty =
    baseline != null && values != null && hasConversationalChanges(baseline, values);

  const syncFromProfile = useCallback((next: CompanionProfile) => {
    const form = profileToEditForm(next);
    setProfile(next);
    setBaseline(form);
    setValues(form);
  }, []);

  const saveConversational = useCallback(async (): Promise<boolean> => {
    if (!baseline || !values || !conversationalDirty) return true;
    const body = buildConversationalPatchBody(baseline, values);
    if (Object.keys(body).length === 0) return true;

    setSaving(true);
    setSaveError(null);
    try {
      await httpClient.patch('/companion/me', body);
      await invalidateCompanionProfile(queryClient);
      const refreshed = await fetchCompanionProfile();
      const form = profileToEditForm(refreshed);
      setProfile(refreshed);
      setBaseline(form);
      setValues(form);
      return true;
    } catch {
      setSaveError('save');
      return false;
    } finally {
      setSaving(false);
    }
  }, [baseline, conversationalDirty, queryClient, values]);

  return {
    loaded,
    loadError,
    profile,
    baseline,
    values,
    setValues,
    saving,
    saveError,
    conversationalDirty,
    saveConversational,
    reload,
    syncFromProfile,
  };
}
