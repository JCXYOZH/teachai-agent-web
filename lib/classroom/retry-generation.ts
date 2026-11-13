import type { GenerationJob } from '@/lib/api/types';
import { retryGenerationJob } from '@/lib/api/generation';
import { waitForGenerationJob } from '@/lib/classroom/wait-for-job';

export interface RetryFlowHandlers {
  onProgress?: (job: GenerationJob) => void;
  onDone: (job: GenerationJob) => Promise<void> | void;
}

export async function retryGenerationJobFlow(
  jobId: string,
  handlers: RetryFlowHandlers,
): Promise<GenerationJob> {
  const job = await retryGenerationJob(jobId);
  const finished = await waitForGenerationJob(job.id, {
    onProgress: handlers.onProgress,
  });
  await handlers.onDone(finished);
  return finished;
}
