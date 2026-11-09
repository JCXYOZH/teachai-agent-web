import { apiRequest } from '@/lib/api/client';
import type { ChatReply, ChatSendPayload, ChatThread } from '@/lib/api/types';

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

export function clearCourseChat(courseId: string): Promise<void> {
  return apiRequest<void>(`/courses/${courseId}/chat`, { method: 'DELETE' });
}
