import { apiDownload, apiRequest } from '@/lib/api/client';
import type { MediaAsset } from '@/lib/api/types';

export function getMediaAsset(mediaId: string): Promise<MediaAsset> {
  return apiRequest<MediaAsset>(`/media/${mediaId}`);
}

export function downloadMediaBlob(mediaId: string): Promise<Blob> {
  return apiDownload(`/media/${mediaId}/content`);
}
