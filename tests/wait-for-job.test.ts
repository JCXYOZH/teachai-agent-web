import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import type { GenerationJob } from '@/lib/api/types';
import { waitForGenerationJob } from '@/lib/classroom/wait-for-job';

const api = vi.hoisted(() => ({ getGenerationJob: vi.fn() }));

vi.mock('@/lib/api/generation', () => api);

const running: GenerationJob = {
  id: 'job-1',
  course_id: 'course-1',
  kind: 'classroom',
  outline_id: 'outline-1',
  stage_id: null,
  provider_id: 'llama-local',
  model_name: 'Qwen3.6-35B-A3B',
  status: 'running',
  progress: 40,
  message: 'Composing scenes',
  error_code: null,
  error_message: null,
  scene_count: 0,
  created_at: '2026-10-29T10:00:00Z',
  started_at: '2026-10-29T10:00:01Z',
  completed_at: null,
};

describe('waitForGenerationJob', () => {
  beforeEach(() => {
    api.getGenerationJob.mockReset();
  });

  it('polls until the job completes and reports progress', async () => {
    const completed: GenerationJob = {
      ...running,
      status: 'completed',
      progress: 100,
      message: 'Classroom ready',
    };
    api.getGenerationJob
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(completed);
    const seen: string[] = [];

    const result = await waitForGenerationJob('job-1', {
      intervalMs: 0,
      onProgress: (job) => seen.push(job.status),
    });

    expect(result.status).toBe('completed');
    expect(seen).toEqual(['running', 'completed']);
    expect(api.getGenerationJob).toHaveBeenCalledTimes(2);
  });

  it('throws an ApiError with the job error code when generation fails', async () => {
    api.getGenerationJob.mockResolvedValue({
      ...running,
      status: 'failed',
      error_code: 'CLASSROOM_INVALID_RESPONSE',
      error_message: 'Model did not return a valid classroom',
    });

    const error = await waitForGenerationJob('job-1', { intervalMs: 0 }).catch(
      (value: unknown) => value,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('CLASSROOM_INVALID_RESPONSE');
  });

  it('stops polling when the abort signal fires', async () => {
    api.getGenerationJob.mockResolvedValue(running);
    const controller = new AbortController();

    const pending = waitForGenerationJob('job-1', {
      signal: controller.signal,
      intervalMs: 20,
    });
    setTimeout(() => controller.abort(), 0);

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
