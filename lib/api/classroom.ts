import { apiRequest } from '@/lib/api/client';
import type {
  Classroom,
  ClassroomAnswerItem,
  ClassroomGeneratePayload,
  ClassroomResponsesPayload,
  ClassroomSubmitResult,
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

export function submitClassroomResponses(
  courseId: string,
  sceneId: string,
  responses: ClassroomAnswerItem[],
): Promise<ClassroomSubmitResult> {
  return apiRequest<ClassroomSubmitResult>(
    `/courses/${courseId}/classroom/scenes/${sceneId}/responses`,
    { method: 'PUT', body: { responses } },
  );
}

export function getClassroomResponses(
  courseId: string,
): Promise<ClassroomResponsesPayload> {
  return apiRequest<ClassroomResponsesPayload>(
    `/courses/${courseId}/classroom/responses`,
  );
}
