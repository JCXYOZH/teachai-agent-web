import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClassroomAction } from '@/lib/api/types';
import { useClassroomPlayback } from '@/lib/classroom/use-classroom-playback';

const actions: ClassroomAction[] = [
  { id: 'speech-1', type: 'speech', text: '先看定义。' },
  { id: 'reveal-1', type: 'reveal', elementId: 'el-1' },
  { id: 'reveal-2', type: 'reveal', elementId: 'el-2' },
];

describe('useClassroomPlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows everything until playback starts', () => {
    const { result } = renderHook(() => useClassroomPlayback(actions, 'scene-1'));

    expect(result.current.revealed).toBeNull();
    expect(result.current.playing).toBe(false);
    expect(result.current.total).toBe(3);
  });

  it('walks the action timeline one step at a time', () => {
    const { result } = renderHook(() => useClassroomPlayback(actions, 'scene-1'));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(true);
    expect(result.current.revealed).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(result.current.speech).toBe('先看定义。');
    expect(result.current.step).toBe(1);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.revealed).toEqual(['el-1']);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.revealed).toEqual(['el-1', 'el-2']);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.step).toBe(3);
    expect(result.current.playing).toBe(false);
  });

  it('resets when the scene changes', () => {
    const { result, rerender } = renderHook(
      ({ sceneId }) => useClassroomPlayback(actions, sceneId),
      { initialProps: { sceneId: 'scene-1' } },
    );

    act(() => {
      result.current.toggle();
    });
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(result.current.step).toBe(1);

    rerender({ sceneId: 'scene-2' });

    expect(result.current.step).toBe(0);
    expect(result.current.revealed).toBeNull();
    expect(result.current.playing).toBe(false);
  });

  it('pauses and resumes at the same step', () => {
    const { result } = renderHook(() => useClassroomPlayback(actions, 'scene-1'));

    act(() => {
      result.current.toggle();
    });
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(result.current.step).toBe(1);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.step).toBe(1);

    act(() => {
      result.current.toggle();
    });
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.revealed).toEqual(['el-1']);
  });
});
