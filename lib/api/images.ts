import { apiRequest } from '@/lib/api/client';
import type { GenerationJob, IllustrationGeneratePayload } from '@/lib/api/types';

export function generateClassroomIllustrations(
  courseId: string,
  payload: IllustrationGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(
    `/courses/${courseId}/classroom/illustrations`,
    { method: 'POST', body: payload },
  );
}

export function generateSceneIllustration(
  courseId: string,
  sceneId: string,
  payload: IllustrationGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(
    `/courses/${courseId}/classroom/scenes/${sceneId}/illustration`,
    { method: 'POST', body: payload },
  );
}
