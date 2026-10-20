import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as draftApi from '~/features/creation/onboardingDraft.api';

import {
  CREATION_POLL_MS,
  CREATION_READY_TIMEOUT_MS,
  fetchCompanionCreationStatus,
  useCreationStatus,
} from './useCreationStatus';
import { httpClient } from '~/platform/http';

vi.mock('~/platform/http', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe('useCreationStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(httpClient.get).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetchCompanionCreationStatus llama C12', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { state: 'creating', steps: {} },
      status: 200,
      statusText: 'OK',
    });
    const status = await fetchCompanionCreationStatus();
    expect(status.state).toBe('creating');
    expect(httpClient.get).toHaveBeenCalledWith(
      '/companion/me/creation',
      undefined,
      expect.objectContaining({ suppressFatalBoundary: true }),
    );
  });

  it('expone creating mientras el backend reporta creación', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { state: 'creating', steps: { personality: true } },
      status: 200,
      statusText: 'OK',
    });
    vi.spyOn(draftApi, 'getOnboardingDraftRecord').mockResolvedValue(null);

    const { result } = renderHook(() => useCreationStatus());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.state).toBe('creating');
    expect(result.current.isCreating).toBe(true);
  });

  it('marca TIMEOUT tras 90s sin ready', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { state: 'creating', steps: {} },
      status: 200,
      statusText: 'OK',
    });
    vi.spyOn(draftApi, 'getOnboardingDraftRecord').mockResolvedValue(null);

    const { result } = renderHook(() => useCreationStatus());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(result.current.state).toBe('creating');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREATION_READY_TIMEOUT_MS + CREATION_POLL_MS);
    });
    expect(result.current.state).toBe('error');
    expect(result.current.status.error?.code).toBe('TIMEOUT');
  });
});
