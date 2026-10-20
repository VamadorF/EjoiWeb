import { useCallback, useEffect, useRef, useState } from 'react';

import type { Gender, OnboardingData, VisualStyle } from '@/features/onboarding/types';

import {
  buildPutBody,
  DEFAULT_WHO_STEP,
  emptyOnboardingData,
  getOnboardingDraftRecord,
  mergeDraftIntoData,
  persistSnapshotKey,
  putOnboardingDraft,
  putOnboardingDraftKeepalive,
  type WebView,
} from './onboardingDraft.api';
import { removeTimelineId, upsertTimelineId } from './whoValidation';

const AUTOSAVE_MS = 300;

export type UseCreationDraftOptions = {
  webView: WebView;
  step?: number;
};

export function useCreationDraft({ webView, step = DEFAULT_WHO_STEP }: UseCreationDraftOptions) {
  const [data, setData] = useState<OnboardingData>(() => emptyOnboardingData());
  const [tagTimeline, setTagTimeline] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const dataRef = useRef(data);
  const tagTimelineRef = useRef(tagTimeline);
  const lastSentRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ step: number; webView: WebView } | null>(null);

  dataRef.current = data;
  tagTimelineRef.current = tagTimeline;

  const buildBody = useCallback(
    (nextData: OnboardingData, view: WebView) => buildPutBody(step, nextData, view),
    [step],
  );

  const flushSave = useCallback(
    (view: WebView = webView, keepalive = false) => {
      const body = buildBody(dataRef.current, view);
      const key = persistSnapshotKey(body);
      if (key === lastSentRef.current) return;
      lastSentRef.current = key;
      if (keepalive) {
        putOnboardingDraftKeepalive(body);
      } else {
        void putOnboardingDraft(body).catch(() => {
          lastSentRef.current = null;
        });
      }
    },
    [buildBody, webView],
  );

  const scheduleSave = useCallback(
    (view: WebView = webView) => {
      pendingRef.current = { step, webView: view };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        flushSave(view, false);
      }, AUTOSAVE_MS);
    },
    [flushSave, step, webView],
  );

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active) return;
        if (draft?.data) {
          const merged = mergeDraftIntoData(emptyOnboardingData(), draft.data);
          setData(merged);
          const timeline: string[] = [];
          if (merged.gender) timeline.push('gender');
          if (merged.visualStyle) timeline.push('style');
          for (const interest of merged.interests) timeline.push(`interest:${interest}`);
          if (merged.ethnicity?.trim()) timeline.push('ethnicity');
          if (typeof merged.age === 'number') timeline.push('age');
          setTagTimeline(timeline);
          lastSentRef.current = persistSnapshotKey(buildPutBody(step, merged, webView));
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [step, webView]);

  useEffect(() => {
    if (!loaded) return;
    scheduleSave(webView);
  }, [data, loaded, scheduleSave, webView]);

  useEffect(() => {
    const onPageHide = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const view = pendingRef.current?.webView ?? webView;
      flushSave(view, true);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [flushSave, webView]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const patchData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const setGender = useCallback(
    (gender: Gender) => {
      patchData({ gender });
      setTagTimeline((t) => upsertTimelineId(t, 'gender'));
    },
    [patchData],
  );
  const setVisualStyle = useCallback(
    (visualStyle: VisualStyle) => {
      patchData({ visualStyle });
      setTagTimeline((t) => upsertTimelineId(t, 'style'));
    },
    [patchData],
  );
  const setEthnicity = useCallback(
    (ethnicity: string | undefined) => {
      patchData({ ethnicity: ethnicity || undefined });
      setTagTimeline((t) =>
        ethnicity?.trim() ? upsertTimelineId(t, 'ethnicity') : removeTimelineId(t, 'ethnicity'),
      );
    },
    [patchData],
  );
  const setAge = useCallback(
    (age: number) => {
      patchData({ age });
      setTagTimeline((t) => upsertTimelineId(t, 'age'));
    },
    [patchData],
  );

  const toggleInterest = useCallback((interest: string) => {
    let removing = false;
    setData((prev) => {
      removing = prev.interests.includes(interest);
      return {
        ...prev,
        interests: removing
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
    const tagId = `interest:${interest}`;
    setTagTimeline((order) =>
      removing ? removeTimelineId(order, tagId) : upsertTimelineId(order, tagId),
    );
  }, []);

  const saveWithWebView = useCallback(
    async (nextView: WebView) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const body = buildBody(dataRef.current, nextView);
      await putOnboardingDraft(body);
      lastSentRef.current = persistSnapshotKey(body);
    },
    [buildBody],
  );

  return {
    data,
    tagTimeline,
    loaded,
    setGender,
    setVisualStyle,
    setEthnicity,
    setAge,
    toggleInterest,
    saveWithWebView,
    flushSave,
  };
}
