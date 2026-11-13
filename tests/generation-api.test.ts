import { afterEach, describe, expect, it, vi } from 'vitest';

import { retryGenerationJob } from '@/lib/api/generation';
import { useAuthStore } from '@/lib/stores/auth-store';

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 201,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  } as unknown as Response;
}

describe('retryGenerationJob', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
    vi.unstubAllGlobals();
  });

  it('posts to the retry endpoint of the failed job', async () => {
    useAuthStore.setState({ accessToken: 'test-access-token' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'job-2' }));
    vi.stubGlobal('fetch', fetchMock);

    const job = await retryGenerationJob('job-1');

    expect(job.id).toBe('job-2');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/generation/jobs/job-1/retry'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
