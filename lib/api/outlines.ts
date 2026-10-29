import { apiRequest } from '@/lib/api/client';
import type {
  CourseOutlineGeneratePayload,
  CourseOutlineSummary,
  GenerationJob,
} from '@/lib/api/types';

export function getCourseOutline(courseId: string): Promise<CourseOutlineSummary> {
  return apiRequest<CourseOutlineSummary>(`/courses/${courseId}/outline`);
}

export function generateCourseOutline(
  courseId: string,
  payload: CourseOutlineGeneratePayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/courses/${courseId}/outline/generate`, {
    method: 'POST',
    body: payload,
  });
}
