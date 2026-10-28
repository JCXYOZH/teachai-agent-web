import { apiRequest } from '@/lib/api/client';
import type {
  ProviderConfig,
  ProviderConfigUpdate,
  ProviderTestRequest,
  ProviderTestResponse,
} from '@/lib/api/types';

export function listProviders(): Promise<ProviderConfig[]> {
  return apiRequest<ProviderConfig[]>('/providers');
}

export function updateProviderConfig(
  providerId: string,
  payload: ProviderConfigUpdate,
): Promise<ProviderConfig> {
  return apiRequest<ProviderConfig>(`/providers/${encodeURIComponent(providerId)}/config`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteProviderConfig(providerId: string): Promise<void> {
  return apiRequest<void>(`/providers/${encodeURIComponent(providerId)}/config`, {
    method: 'DELETE',
  });
}

export function testProvider(
  providerId: string,
  payload: ProviderTestRequest,
): Promise<ProviderTestResponse> {
  return apiRequest<ProviderTestResponse>(`/providers/${encodeURIComponent(providerId)}/test`, {
    method: 'POST',
    body: payload,
  });
}
