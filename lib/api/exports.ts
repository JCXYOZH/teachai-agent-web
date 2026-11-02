import { apiDownload, apiRequest } from '@/lib/api/client';
import type {
  ClassroomExport,
  ClassroomExportPayload,
  ClassroomExportsView,
  GenerationJob,
} from '@/lib/api/types';

export function createClassroomExport(
  courseId: string,
  payload: ClassroomExportPayload = {},
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/courses/${courseId}/classroom/export`, {
    method: 'POST',
    body: payload,
  });
}

export function listClassroomExports(
  courseId: string,
): Promise<ClassroomExportsView> {
  return apiRequest<ClassroomExportsView>(
    `/courses/${courseId}/classroom/exports`,
  );
}

export async function downloadClassroomExport(
  item: ClassroomExport,
): Promise<void> {
  const blob = await apiDownload(`/media/${item.media_id}/content`);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = item.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}