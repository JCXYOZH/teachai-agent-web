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
  audioLoading: boolean;
  audioAvailable: boolean;
  toggle: () => void;
  reset: () => void;
}

export interface ClassroomPlaybackOptions {
  loadAudio?: (audioId: string) => Promise<string | null>;
}

export function useClassroomPlayback(
  actions: ClassroomAction[],
  resetKey: string,
  options: ClassroomPlaybackOptions = {},
): ClassroomPlayback {
  const loadAudio = options.loadAudio;
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState<string[] | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const stepRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStepRef = useRef(-1);

  stepRef.current = step;

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    audioRef.current = null;
    audioStepRef.current = -1;
    setAudioLoading(false);
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setStep(0);
    setRevealed(null);
    setHighlighted(null);
    setSpeech(null);
    stopAudio();
  }, [stopAudio]);

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
      audioRef.current?.pause();
      return undefined;
    }
    if (step >= actions.length) {
      setPlaying(false);
      return undefined;
    }
    const action = actions[step];
    let settled = false;
    const advance = () => {
      if (settled) {
        return;
      }
      settled = true;
      setStep((value) => value + 1);
    };

    const applyAction = () => {
      if (action.type === 'reveal' && typeof action.elementId === 'string') {
        const elementId = action.elementId;
        setRevealed((current) => (current ? [...current, elementId] : current));
      } else if (action.type === 'highlight' && typeof action.elementId === 'string') {
        setHighlighted(action.elementId);
      } else if (action.type === 'speech' && typeof action.text === 'string') {
        setSpeech(action.text);
      }
    };

    const audioId =
      action.type === 'speech' && typeof action.audioId === 'string'
        ? action.audioId
        : null;
    if (audioId && loadAudio) {
      if (action.type === 'speech' && typeof action.text === 'string') {
        setSpeech(action.text);
      }
      const existing = audioRef.current;
      if (existing && audioStepRef.current === step && !existing.ended) {
        void existing.play().catch(() => undefined);
        return () => {
          if (audioRef.current === existing) {
            existing.pause();
          }
        };
      }
      let disposed = false;
      let fallbackTimer: number | undefined;
      const fallback = () => {
        if (disposed || settled || fallbackTimer !== undefined) {
          return;
        }
        fallbackTimer = window.setTimeout(advance, stepDelay(action));
      };
      setAudioLoading(true);
      loadAudio(audioId)
        .then((url) => {
          if (disposed) {
            return;
          }
          if (!url) {
            fallback();
            return;
          }
          const audio = new Audio(url);
          audio.preload = 'auto';
          audioRef.current = audio;
          audioStepRef.current = step;
          audio.onended = advance;
          audio.onerror = fallback;
          void audio.play().catch(fallback);
        })
        .catch(fallback)
        .finally(() => {
          if (!disposed) {
            setAudioLoading(false);
          }
        });
      return () => {
        disposed = true;
        if (fallbackTimer !== undefined) {
          window.clearTimeout(fallbackTimer);
        }
        const audio = audioRef.current;
        if (audio && audioStepRef.current === step) {
          audio.pause();
        }
      };
    }

    const timer = window.setTimeout(() => {
      applyAction();
      advance();
    }, stepDelay(action));
    return () => window.clearTimeout(timer);
  }, [actions, loadAudio, playing, step]);

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
    audioLoading,
    audioAvailable: actions.some(
      (action) => action.type === 'speech' && typeof action.audioId === 'string',
    ),
    toggle,
    reset,
  };
}
