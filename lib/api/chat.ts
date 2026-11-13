import { ApiError, apiRequest, apiStreamRequest } from '@/lib/api/client';
import type { ChatReply, ChatSendPayload, ChatThread } from '@/lib/api/types';

export interface ChatStreamHandlers {
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

interface ParsedSseEvent {
  event: string;
  data: string;
}

interface StreamErrorPayload {
  status?: number;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

function parseSseEvent(block: string): ParsedSseEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) {
      continue;
    }
    const separator = line.indexOf(':');
    if (separator < 0) {
      continue;
    }
    const field = line.slice(0, separator);
    let value = line.slice(separator + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }
    if (field === 'event') {
      event = value.trim();
    } else if (field === 'data') {
      data.push(value);
    }
  }
  if (data.length === 0) {
    return null;
  }
  return { event, data: data.join('\n') };
}

function parseJson<T>(value: string, message: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ApiError(502, 'CHAT_STREAM_INVALID', message);
  }
}

export function getCourseChat(courseId: string): Promise<ChatThread> {
  return apiRequest<ChatThread>(`/courses/${courseId}/chat`);
}

export function sendCourseChatMessage(
  courseId: string,
  payload: ChatSendPayload,
): Promise<ChatReply> {
  return apiRequest<ChatReply>(`/courses/${courseId}/chat/messages`, {
    method: 'POST',
    body: payload,
  });
}

export async function streamCourseChatMessage(
  courseId: string,
  payload: ChatSendPayload,
  handlers: ChatStreamHandlers = {},
): Promise<ChatReply> {
  const response = await apiStreamRequest(
    `/courses/${courseId}/chat/messages/stream`,
    {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: payload,
      signal: handlers.signal,
    },
  );
  if (!response.body) {
    throw new ApiError(
      502,
      'CHAT_STREAM_UNAVAILABLE',
      '课堂回答流不可用，请稍后重试。',
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let reply: ChatReply | null = null;
  let complete = false;

  const handleEvent = (event: ParsedSseEvent) => {
    if (event.event === 'delta') {
      const delta = parseJson<{ text?: unknown }>(
        event.data,
        '课堂回答流格式错误，请稍后重试。',
      );
      if (typeof delta.text === 'string' && delta.text) {
        handlers.onDelta?.(delta.text);
      }
      return;
    }
    if (event.event === 'error') {
      const payload = parseJson<StreamErrorPayload>(
        event.data,
        '课堂回答流格式错误，请稍后重试。',
      );
      throw new ApiError(
        payload.status ?? 502,
        payload.error?.code ?? 'CHAT_STREAM_ERROR',
        payload.error?.message ?? '课堂回答流格式错误，请稍后重试。',
        payload.error?.details,
      );
    }
    if (event.event === 'done') {
      reply = parseJson<ChatReply>(event.data, '课堂回答流格式错误，请稍后重试。');
      complete = true;
    }
  };

  const drain = () => {
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0 && !complete) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseSseEvent(block);
      if (event) {
        handleEvent(event);
      }
      boundary = buffer.indexOf('\n\n');
    }
  };

  try {
    while (!complete) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      drain();
    }
    if (!complete) {
      buffer += decoder.decode();
      buffer = buffer.replace(/\r\n/g, '\n');
      drain();
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }

  if (!reply) {
    throw new ApiError(
      502,
      'CHAT_STREAM_INCOMPLETE',
      '课堂回答流意外中断，请稍后重试。',
    );
  }
  return reply;
}

export function clearCourseChat(courseId: string): Promise<void> {
  return apiRequest<void>(`/courses/${courseId}/chat`, { method: 'DELETE' });
}
