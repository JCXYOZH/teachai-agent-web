import { apiRequest } from '@/lib/api/client';
import type { GenerationJob, NarrationGeneratePayload } from '@/lib/api/types';

export function generateClassroomNarration(
  courseId: string,
  payload: NarrationGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/courses/${courseId}/classroom/narration`, {
    method: 'POST',
    body: payload,
  });
}

export function generateSceneNarration(
  courseId: string,
  sceneId: string,
  payload: NarrationGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(
    `/courses/${courseId}/classroom/scenes/${sceneId}/narration`,
    { method: 'POST', body: payload },
  );
}
