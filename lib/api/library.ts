import { apiDownload, apiRequest } from '@/lib/api/client';
import type {
  Asset,
  AssetDetail,
  AssetListResponse,
  Course,
  CourseListResponse,
  Folder,
  SearchResponse,
} from '@/lib/api/types';

export interface CourseListParams {
  q?: string;
  folderId?: string;
  limit?: number;
  offset?: number;
}

export interface AssetListParams extends CourseListParams {
  courseId?: string;
}

export interface CoursePayload {
  title: string;
  description?: string | null;
  folder_id?: string | null;
}

export interface AssetUpdatePayload {
  filename?: string;
  course_id?: string | null;
  folder_id?: string | null;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export function listFolders(): Promise<Folder[]> {
  return apiRequest<Folder[]>('/folders');
}

export function createFolder(name: string): Promise<Folder> {
  return apiRequest<Folder>('/folders', { method: 'POST', body: { name } });
}

export function updateFolder(id: string, name: string): Promise<Folder> {
  return apiRequest<Folder>(`/folders/${id}`, { method: 'PATCH', body: { name } });
}

export function deleteFolder(id: string): Promise<void> {
  return apiRequest<void>(`/folders/${id}`, { method: 'DELETE' });
}

export function listCourses(params: CourseListParams = {}): Promise<CourseListResponse> {
  return apiRequest<CourseListResponse>(
    `/courses${queryString({
      q: params.q,
      folder_id: params.folderId,
      limit: params.limit,
      offset: params.offset,
    })}`,
  );
}

export function createCourse(payload: CoursePayload): Promise<Course> {
  return apiRequest<Course>('/courses', { method: 'POST', body: payload });
}

export function getCourse(id: string): Promise<Course> {
  return apiRequest<Course>(`/courses/${id}`);
}

export function updateCourse(id: string, payload: Partial<CoursePayload>): Promise<Course> {
  return apiRequest<Course>(`/courses/${id}`, { method: 'PATCH', body: payload });
}

export function deleteCourse(id: string): Promise<void> {
  return apiRequest<void>(`/courses/${id}`, { method: 'DELETE' });
}

export function listAssets(params: AssetListParams = {}): Promise<AssetListResponse> {
  return apiRequest<AssetListResponse>(
    `/assets${queryString({
      q: params.q,
      folder_id: params.folderId,
      course_id: params.courseId,
      limit: params.limit,
      offset: params.offset,
    })}`,
  );
}

export function getAsset(id: string): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/assets/${id}`);
}

export function updateAsset(id: string, payload: AssetUpdatePayload): Promise<Asset> {
  return apiRequest<Asset>(`/assets/${id}`, { method: 'PATCH', body: payload });
}

export function deleteAsset(id: string): Promise<void> {
  return apiRequest<void>(`/assets/${id}`, { method: 'DELETE' });
}

export function uploadAsset(file: File, courseId?: string, folderId?: string): Promise<Asset> {
  const form = new FormData();
  form.append('file', file);
  if (courseId) {
    form.append('course_id', courseId);
  }
  if (folderId) {
    form.append('folder_id', folderId);
  }
  return apiRequest<Asset>('/assets', { method: 'POST', body: form });
}

export function searchLibrary(q: string, limit = 8): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(`/search${queryString({ q, limit })}`);
}

export async function downloadAsset(asset: Asset): Promise<void> {
  const blob = await apiDownload(`/assets/${asset.id}/download`);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = asset.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const ACCEPTED_UPLOAD_TYPES = '.pdf,.docx,.pptx,.md,.markdown,.txt';
