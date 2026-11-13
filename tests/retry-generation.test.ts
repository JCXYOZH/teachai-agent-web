import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GenerationJob } from '@/lib/api/types';
import { retryGenerationJobFlow } from '@/lib/classroom/retry-generation';

const api = vi.hoisted(() => ({
  getGenerationJob: vi.fn(),
  retryGenerationJob: vi.fn(),
}));

vi.mock('@/lib/api/generation', () => api);

function job(overrides: Partial<GenerationJob>): GenerationJob {
  return {
    id: 'job-1',
    course_id: 'course-1',
    kind: 'narration',
    outline_id: null,
    stage_id: null,
    provider_id: 'llama-local',
    model_name: 'Qwen3.6-35B-A3B',
    status: 'failed',
    progress: 0,
    message: 'Generation failed',
    error_code: 'IMAGE_PROVIDER_FAILED',
    error_message: 'boom',
    scene_count: 0,
    created_at: '2026-11-13T10:00:00Z',
    started_at: '2026-11-13T10:00:01Z',
    completed_at: '2026-11-13T10:00:02Z',
    ...overrides,
  };
}

describe('retryGenerationJobFlow', () => {
  beforeEach(() => {
    api.getGenerationJob.mockReset();
    api.retryGenerationJob.mockReset();
  });

  it('retries the failed job, polls the new one and reports completion', async () => {
    api.retryGenerationJob.mockResolvedValue(job({ id: 'job-2', status: 'queued' }));
    api.getGenerationJob.mockResolvedValue(
      job({ id: 'job-2', status: 'completed', progress: 100, scene_count: 6 }),
    );
    const done: GenerationJob[] = [];
    const progress: number[] = [];

    const finished = await retryGenerationJobFlow('job-1', {
      onProgress: (update) => progress.push(update.progress),
      onDone: (result) => {
        done.push(result);
      },
    });

    expect(api.retryGenerationJob).toHaveBeenCalledWith('job-1');
    expect(api.getGenerationJob).toHaveBeenCalledWith('job-2');
    expect(progress).toEqual([100]);
    expect(done).toHaveLength(1);
    expect(finished.status).toBe('completed');
    expect(finished.scene_count).toBe(6);
  });
});
