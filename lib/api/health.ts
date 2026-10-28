import { apiRequest } from '@/lib/api/client';
import type { HealthResponse } from '@/lib/api/types';

export function fetchHealth() {
  return apiRequest<HealthResponse>('/health', {
    auth: false,
    retry: false,
  });
}
