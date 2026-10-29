import { apiRequest } from '@/lib/api/client';
import type { GenerationJob } from '@/lib/api/types';

export function getGenerationJob(jobId: string): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/generation/jobs/${jobId}`);
}
