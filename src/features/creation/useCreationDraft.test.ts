import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as draftApi from './onboardingDraft.api';
import { useCreationDraft } from './useCreationDraft';

describe('useCreationDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(draftApi, 'getOnboardingDraftRecord').mockResolvedValue(null);
    vi.spyOn(draftApi, 'putOnboardingDraft').mockResolvedValue({
      schemaVersion: 1,
      step: 12,
      data: { webView: 'quien' },
      updatedAt: new Date().toISOString(),
    });
    vi.spyOn(draftApi, 'putOnboardingDraftKeepalive').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounce: muchos cambios rápidos → un solo PUT final', async () => {
    const { result } = renderHook(() => useCreationDraft({ webView: 'quien' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.loaded).toBe(true);
    vi.mocked(draftApi.putOnboardingDraft).mockClear();

    act(() => {
      result.current.setGender('femenino');
      result.current.setVisualStyle('realista');
      result.current.toggleInterest('Arte y cultura');
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(draftApi.putOnboardingDraft).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(draftApi.putOnboardingDraft).toHaveBeenCalledTimes(1);
    const body = vi.mocked(draftApi.putOnboardingDraft).mock.calls[0]![0];
    expect(body.data.gender).toBe('femenino');
    expect(body.data.visualStyle).toBe('realista');
    expect(body.data.interests).toEqual(['Arte y cultura']);
    expect(body.data.webView).toBe('quien');
  });

  it('pagehide envía keepalive', async () => {
    const { result } = renderHook(() => useCreationDraft({ webView: 'quien' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.loaded).toBe(true);

    act(() => {
      result.current.setGender('masculino');
    });

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(draftApi.putOnboardingDraftKeepalive).toHaveBeenCalled();
  });
});
