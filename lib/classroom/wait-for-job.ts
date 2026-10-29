import { ApiError } from '@/lib/api/client';
import { getGenerationJob } from '@/lib/api/generation';
import type { GenerationJob } from '@/lib/api/types';

export interface WaitForJobOptions {
  signal?: AbortSignal;
  intervalMs?: number;
  timeoutMs?: number;
  onProgress?: (job: GenerationJob) => void;
}

export class JobPollAbortedError extends Error {
  constructor() {
    super('Generation polling was aborted');
    this.name = 'AbortError';
  }
}

const DEFAULT_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new JobPollAbortedError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new JobPollAbortedError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function waitForGenerationJob(
  jobId: string,
  options: WaitForJobOptions = {},
): Promise<GenerationJob> {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  for (;;) {
    if (options.signal?.aborted) {
      throw new JobPollAbortedError();
    }
    const job = await getGenerationJob(jobId);
    options.onProgress?.(job);
    if (job.status === 'completed') {
      return job;
    }
    if (job.status === 'failed') {
      throw new ApiError(
        502,
        job.error_code ?? 'GENERATION_FAILED',
        job.error_message ?? 'Generation failed',
      );
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new ApiError(504, 'GENERATION_POLL_TIMEOUT', 'Generation timed out');
    }
    await delay(intervalMs, options.signal);
  }
}
