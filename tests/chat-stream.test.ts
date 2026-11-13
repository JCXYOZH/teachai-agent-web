import { beforeEach, describe, expect, it, vi } from 'vitest';

const clientMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  apiStreamRequest: vi.fn(),
}));

vi.mock('@/lib/api/client', () => {
  class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;

    constructor(status: number, code: string, message: string, details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }
  return { ...clientMock, ApiError };
});

import { streamCourseChatMessage } from '@/lib/api/chat';
import { apiStreamRequest } from '@/lib/api/client';

function streamResponse(chunks: string[]): Response {
  let index = 0;
  const encoder = new TextEncoder();
  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= chunks.length) {
            return { done: true, value: undefined };
          }
          const value = encoder.encode(chunks[index]);
          index += 1;
          return { done: false, value };
        },
        cancel: async () => undefined,
        releaseLock: () => undefined,
      }),
    },
  } as unknown as Response;
}

const reply = {
  course_id: 'course-1',
  session_id: 'session-1',
  question: { content: 'hello' },
  reply: { content: 'Hello world' },
  daily_limit: 200,
  daily_used: 1,
  remaining_today: 199,
};

beforeEach(() => {
  clientMock.apiRequest.mockReset();
  clientMock.apiStreamRequest.mockReset();
});

describe('streamCourseChatMessage', () => {
  it('parses deltas split across chunks and returns the done reply', async () => {
    clientMock.apiStreamRequest.mockResolvedValue(
      streamResponse([
        'event: delta\ndata: {"text":"Hello"}\n\n',
        'event: delta\ndata: {"text":" world"}\n',
        '\nevent: done\ndata: ' + JSON.stringify(reply) + '\n\n',
      ]),
    );
    const deltas: string[] = [];

    const result = await streamCourseChatMessage(
      'course-1',
      { message: 'hello' },
      { onDelta: (text) => deltas.push(text) },
    );

    expect(deltas).toEqual(['Hello', ' world']);
    expect(result).toEqual(reply);
    expect(apiStreamRequest).toHaveBeenCalledWith(
      '/courses/course-1/chat/messages/stream',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('turns an error event into an ApiError', async () => {
    clientMock.apiStreamRequest.mockResolvedValue(
      streamResponse([
        'event: error\ndata: {"status":502,"error":{"code":"CHAT_PROVIDER_ERROR","message":"failed"}}\n\n',
      ]),
    );

    await expect(
      streamCourseChatMessage('course-1', { message: 'hello' }),
    ).rejects.toMatchObject({
      status: 502,
      code: 'CHAT_PROVIDER_ERROR',
      message: 'failed',
    });
  });

  it('rejects a stream that ends without a done event', async () => {
    clientMock.apiStreamRequest.mockResolvedValue(streamResponse([]));

    await expect(
      streamCourseChatMessage('course-1', { message: 'hello' }),
    ).rejects.toMatchObject({ code: 'CHAT_STREAM_INCOMPLETE' });
  });
});
