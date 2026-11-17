'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api/client';
import {
  createClassroomExport,
  downloadClassroomExport,
  listClassroomExports,
} from '@/lib/api/exports';
import type {
  ClassroomExport,
  ClassroomExportFormat,
  ClassroomExportPayload,
} from '@/lib/api/types';
import { retryGenerationJobFlow } from '@/lib/classroom/retry-generation';
import {
  JobPollAbortedError,
  waitForGenerationJob,
} from '@/lib/classroom/wait-for-job';
import { retryAction } from '@/lib/utils/classroom-scene';

export function useClassroomExport({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const exportAbortRef = useRef<AbortController | null>(null);
  const exportJobRef = useRef<string | null>(null);
  const [exportProgress, setExportProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);
  const [downloadingExport, setDownloadingExport] =
    useState<ClassroomExportFormat | null>(null);

  const retryExport = useCallback(
    async (jobId: string) => {
      try {
        await retryGenerationJobFlow(jobId, {
          onProgress: (update) =>
            setExportProgress({
              message: update.message,
              progress: update.progress,
            }),
          onDone: async (job) => {
            setExportProgress(null);
            toast.success(
              job.scene_count > 0
                ? `导出文件已就绪 · ${job.scene_count} 个场景`
                : '导出任务已完成',
            );
            await queryClient.invalidateQueries({
              queryKey: ['classroom-exports', courseId],
            });
          },
        });
      } catch (error) {
        setExportProgress(null);
        toast.error(
          error instanceof ApiError ? error.message : '导出重试失败，请稍后再试',
        );
      }
    },
    [queryClient, courseId],
  );

  const exportMutation = useMutation({
    mutationFn: async (payload: ClassroomExportPayload) => {
      exportAbortRef.current?.abort();
      const controller = new AbortController();
      exportAbortRef.current = controller;
      const job = await createClassroomExport(courseId, payload);
      exportJobRef.current = job.id;
      return waitForGenerationJob(job.id, {
        signal: controller.signal,
        onProgress: (update) =>
          setExportProgress({
            message: update.message,
            progress: update.progress,
          }),
      });
    },
    onSuccess: async (job) => {
      setExportProgress(null);
      toast.success(
        job.scene_count > 0
          ? `导出文件已就绪 · ${job.scene_count} 个场景`
          : '导出任务已完成',
      );
      await queryClient.invalidateQueries({
        queryKey: ['classroom-exports', courseId],
      });
    },
    onError: (error) => {
      setExportProgress(null);
      if (error instanceof JobPollAbortedError) {
        return;
      }
      toast.error(
        error instanceof ApiError ? error.message : '导出失败，请稍后再试',
        retryAction(exportJobRef.current, retryExport),
      );
    },
  });

  const handleExportDownload = useCallback(async (item: ClassroomExport) => {
    setDownloadingExport(item.format);
    try {
      await downloadClassroomExport(item);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : '下载失败，请稍后再试',
      );
    } finally {
      setDownloadingExport(null);
    }
  }, []);

  useEffect(
    () => () => {
      exportAbortRef.current?.abort();
    },
    [],
  );

  const exportsQuery = useQuery({
    queryKey: ['classroom-exports', courseId],
    queryFn: () => listClassroomExports(courseId),
    retry: false,
    staleTime: 15_000,
  });

  return {
    exports: exportsQuery.data?.exports ?? [],
    busy: exportMutation.isLoading,
    progress: exportProgress,
    downloadingFormat: downloadingExport,
    create: (payload: ClassroomExportPayload) => exportMutation.mutate(payload),
    download: handleExportDownload,
  };
}
