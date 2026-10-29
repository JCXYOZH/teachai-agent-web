import { afterEach, describe, expect, it, vi } from 'vitest';

import { updateProviderConfig } from '@/lib/api/providers';
import { useAuthStore } from '@/lib/stores/auth-store';

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  } as unknown as Response;
}

describe('updateProviderConfig', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
    vi.unstubAllGlobals();
  });

  it('keeps the save request alive when the page changes', async () => {
    useAuthStore.setState({ accessToken: 'test-access-token' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await updateProviderConfig('llama-local', {
      base_url: 'http://127.0.0.1:65535/v1',
      default_model: 'Qwen3.6-35B-A3B',
      is_default: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/providers/llama-local/config'),
      expect.objectContaining({
        method: 'PUT',
        keepalive: true,
      }),
    );
  });
});
