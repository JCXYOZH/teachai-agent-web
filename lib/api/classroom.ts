import { apiRequest } from '@/lib/api/client';
import type {
  Classroom,
  ClassroomGeneratePayload,
  GenerationJob,
} from '@/lib/api/types';

export function getClassroom(courseId: string): Promise<Classroom> {
  return apiRequest<Classroom>(`/courses/${courseId}/classroom`);
}

export function generateClassroom(
  courseId: string,
  payload: ClassroomGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/courses/${courseId}/classroom/generate`, {
    method: 'POST',
    body: payload,
  });
}
