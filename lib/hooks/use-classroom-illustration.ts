'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api/client';
import {
  generateClassroomIllustrations,
  generateSceneIllustration,
} from '@/lib/api/images';
import type {
  Classroom,
  ClassroomScene,
  IllustrationGeneratePayload,
} from '@/lib/api/types';
import { retryGenerationJobFlow } from '@/lib/classroom/retry-generation';
import {
  JobPollAbortedError,
  waitForGenerationJob,
} from '@/lib/classroom/wait-for-job';
import {
  isSlideContent,
  retryAction,
} from '@/lib/utils/classroom-scene';

export function useClassroomIllustration({
  classroom,
  scenes,
}: {
  classroom: Classroom;
  scenes: ClassroomScene[];
}) {
  const queryClient = useQueryClient();
  const illustrationAbortRef = useRef<AbortController | null>(null);
  const illustrationJobRef = useRef<string | null>(null);

  const [illustrationProvider, setIllustrationProvider] = useState('');
  const [illustrationProgress, setIllustrationProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);

  const retryIllustration = useCallback(
    async (jobId: string) => {
      try {
        await retryGenerationJobFlow(jobId, {
          onProgress: (update) =>
            setIllustrationProgress({
              message: update.message,
              progress: update.progress,
            }),
          onDone: async (job) => {
            setIllustrationProgress(null);
            toast.success(
              job.scene_count > 0
                ? `配图已就绪 · ${job.scene_count} 个场景`
                : '配图任务已完成',
            );
            await queryClient.invalidateQueries({
              queryKey: ['classroom', classroom.course_id],
            });
          },
        });
      } catch (error) {
        setIllustrationProgress(null);
        toast.error(
          error instanceof ApiError ? error.message : '配图重试失败，请稍后再试',
        );
      }
    },
    [queryClient, classroom.course_id],
  );

  const illustrationMutation = useMutation({
    mutationFn: async (sceneId?: string) => {
      illustrationAbortRef.current?.abort();
      const controller = new AbortController();
      illustrationAbortRef.current = controller;
      const targetScene = sceneId
        ? scenes.find((candidate) => candidate.id === sceneId)
        : null;
      const targetIllustration =
        targetScene && isSlideContent(targetScene.content)
          ? targetScene.content.illustration
          : null;
      const payload: IllustrationGeneratePayload = {
        ...(targetIllustration ? { regenerate: true } : {}),
        ...(illustrationProvider ? { provider_id: illustrationProvider } : {}),
      };
      const job = sceneId
        ? await generateSceneIllustration(
            classroom.course_id,
            sceneId,
            payload,
          )
        : await generateClassroomIllustrations(
            classroom.course_id,
            payload,
          );
      illustrationJobRef.current = job.id;
      return waitForGenerationJob(job.id, {
        signal: controller.signal,
        onProgress: (update) =>
          setIllustrationProgress({
            message: update.message,
            progress: update.progress,
          }),
      });
    },
    onSuccess: async (job) => {
      setIllustrationProgress(null);
      toast.success(
        job.scene_count > 0
          ? `配图已就绪 · ${job.scene_count} 个场景`
          : '配图任务已完成',
      );
      await queryClient.invalidateQueries({
        queryKey: ['classroom', classroom.course_id],
      });
    },
    onError: (error) => {
      setIllustrationProgress(null);
      if (error instanceof JobPollAbortedError) {
        return;
      }
      toast.error(
        error instanceof ApiError ? error.message : '配图生成失败，请稍后再试',
        retryAction(illustrationJobRef.current, retryIllustration),
      );
    },
  });

  useEffect(
    () => () => {
      illustrationAbortRef.current?.abort();
    },
    [],
  );

  return {
    busy: illustrationMutation.isLoading,
    progress: illustrationProgress,
    provider: illustrationProvider,
    setProvider: setIllustrationProvider,
    generateScene: (sceneId: string) => illustrationMutation.mutate(sceneId),
    generateAll: () => illustrationMutation.mutate(undefined),
  };
}
