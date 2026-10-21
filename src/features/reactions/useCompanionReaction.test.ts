import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCompanionReaction } from './useCompanionReaction';

describe('useCompanionReaction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispara reacción ~150 ms tras trigger', () => {
    const { result } = renderHook(() => useCompanionReaction());
    act(() => {
      result.current.notifyActivity();
      result.current.trigger('surprise', { interactionPhase: 'user_message' });
    });
    expect(result.current.current).toBeNull();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.current?.kind).toBe('surprise');
  });

  it('respeta cooldown de 1200 ms entre reacciones', () => {
    const { result } = renderHook(() => useCompanionReaction());
    act(() => {
      result.current.notifyActivity();
      result.current.trigger('love');
      vi.advanceTimersByTime(150);
    });
    act(() => {
      result.current.trigger('fire');
      vi.advanceTimersByTime(150);
    });
    expect(result.current.current?.kind).toBe('love');
  });

  it('programa reacción espontánea moai tras inactividad', () => {
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const { result } = renderHook(() => useCompanionReaction({ spontaneousEnabled: true }));
    act(() => {
      result.current.notifyActivity();
    });
    const idleCall = spy.mock.calls.find(([, ms]) => typeof ms === 'number' && ms >= 250_000);
    expect(idleCall).toBeTruthy();
    spy.mockRestore();
  });
});
