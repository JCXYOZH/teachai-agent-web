'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api/client';
import {
  generateClassroomNarration,
  generateSceneNarration,
} from '@/lib/api/narration';
import type { Classroom } from '@/lib/api/types';
import { retryGenerationJobFlow } from '@/lib/classroom/retry-generation';
import {
  JobPollAbortedError,
  waitForGenerationJob,
} from '@/lib/classroom/wait-for-job';
import { retryAction } from '@/lib/utils/classroom-scene';

export function useClassroomNarration({
  classroom,
  clearAudioCache,
}: {
  classroom: Classroom;
  clearAudioCache: () => void;
}) {
  const queryClient = useQueryClient();
  const narrationAbortRef = useRef<AbortController | null>(null);
  const narrationJobRef = useRef<string | null>(null);

  const [narrationProgress, setNarrationProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);

  const retryNarration = useCallback(
    async (jobId: string) => {
      try {
        await retryGenerationJobFlow(jobId, {
          onProgress: (update) =>
            setNarrationProgress({
              message: update.message,
              progress: update.progress,
            }),
          onDone: async (job) => {
            setNarrationProgress(null);
            clearAudioCache();
            toast.success(
              job.scene_count > 0
                ? `旁白已就绪 · ${job.scene_count} 个场景`
                : '旁白任务已完成',
            );
            await queryClient.invalidateQueries({
              queryKey: ['classroom', classroom.course_id],
            });
          },
        });
      } catch (error) {
        setNarrationProgress(null);
        toast.error(
          error instanceof ApiError ? error.message : '旁白重试失败，请稍后再试',
        );
      }
    },
    [clearAudioCache, queryClient, classroom.course_id],
  );

  const narrationMutation = useMutation({
    mutationFn: async (sceneId?: string) => {
      narrationAbortRef.current?.abort();
      const controller = new AbortController();
      narrationAbortRef.current = controller;
      const job = sceneId
        ? await generateSceneNarration(classroom.course_id, sceneId)
        : await generateClassroomNarration(classroom.course_id);
      narrationJobRef.current = job.id;
      return waitForGenerationJob(job.id, {
        signal: controller.signal,
        onProgress: (update) =>
          setNarrationProgress({
            message: update.message,
            progress: update.progress,
          }),
      });
    },
    onSuccess: async (job) => {
      setNarrationProgress(null);
      clearAudioCache();
      toast.success(
        job.scene_count > 0
          ? `旁白已就绪 · ${job.scene_count} 个场景`
          : '旁白任务已完成',
      );
      await queryClient.invalidateQueries({
        queryKey: ['classroom', classroom.course_id],
      });
    },
    onError: (error) => {
      setNarrationProgress(null);
      if (error instanceof JobPollAbortedError) {
        return;
      }
      toast.error(
        error instanceof ApiError ? error.message : '旁白生成失败，请稍后再试',
        retryAction(narrationJobRef.current, retryNarration),
      );
    },
  });

  useEffect(
    () => () => {
      narrationAbortRef.current?.abort();
    },
    [],
  );

  return {
    busy: narrationMutation.isLoading,
    progress: narrationProgress,
    generateScene: (sceneId: string) => narrationMutation.mutate(sceneId),
    generateAll: () => narrationMutation.mutate(undefined),
  };
}
