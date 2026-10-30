'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ClassroomAction } from '@/lib/api/types';

const DEFAULT_STEP_DELAY = 900;
const MIN_SPEECH_DELAY = 1800;
const MAX_SPEECH_DELAY = 8000;
const HIGHLIGHT_DURATION = 1800;

function stepDelay(action: ClassroomAction): number {
  if (action.type === 'speech') {
    const text = typeof action.text === 'string' ? action.text : '';
    return Math.min(
      MAX_SPEECH_DELAY,
      Math.max(MIN_SPEECH_DELAY, text.length * 90),
    );
  }
  const delay = typeof action.delay === 'number' ? action.delay : DEFAULT_STEP_DELAY;
  return Math.max(300, Math.min(delay, 4000));
}

export interface ClassroomPlayback {
  playing: boolean;
  step: number;
  total: number;
  revealed: string[] | null;
  highlighted: string | null;
  speech: string | null;
  toggle: () => void;
  reset: () => void;
}

export function useClassroomPlayback(
  actions: ClassroomAction[],
  resetKey: string,
): ClassroomPlayback {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState<string[] | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const stepRef = useRef(0);

  stepRef.current = step;

  const reset = useCallback(() => {
    setPlaying(false);
    setStep(0);
    setRevealed(null);
    setHighlighted(null);
    setSpeech(null);
  }, []);

  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  const toggle = useCallback(() => {
    setPlaying((current) => {
      if (current) {
        return false;
      }
      if (stepRef.current >= actions.length) {
        setStep(0);
        setRevealed([]);
        setSpeech(null);
        setHighlighted(null);
        return true;
      }
      if (stepRef.current === 0) {
        setRevealed([]);
      }
      return true;
    });
  }, [actions.length]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    if (step >= actions.length) {
      setPlaying(false);
      return undefined;
    }
    const action = actions[step];
    const timer = window.setTimeout(() => {
      if (action.type === 'reveal' && typeof action.elementId === 'string') {
        const elementId = action.elementId;
        setRevealed((current) => (current ? [...current, elementId] : current));
      } else if (action.type === 'highlight' && typeof action.elementId === 'string') {
        setHighlighted(action.elementId);
      } else if (action.type === 'speech' && typeof action.text === 'string') {
        setSpeech(action.text);
      }
      setStep((value) => value + 1);
    }, stepDelay(action));
    return () => window.clearTimeout(timer);
  }, [actions, playing, step]);

  useEffect(() => {
    if (!highlighted) {
      return undefined;
    }
    const timer = window.setTimeout(
      () => setHighlighted(null),
      HIGHLIGHT_DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [highlighted]);

  return {
    playing,
    step,
    total: actions.length,
    revealed,
    highlighted,
    speech,
    toggle,
    reset,
  };
}
