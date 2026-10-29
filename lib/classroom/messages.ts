import { ApiError } from '@/lib/api/client';

export function classroomErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'OUTLINE_NOT_FOUND':
        return '这门课程还没有大纲。生成课堂前需要先整理一份课程大纲。';
      case 'OUTLINE_INVALID_RESPONSE':
        return '大纲生成结果不稳定，请补充更明确的教学要求后重试。';
      case 'OUTLINE_PROVIDER_ERROR':
        return '大纲模型暂时不可用，请检查 Provider 配置或稍后重试。';
      case 'OUTLINE_GENERATION_TIMEOUT':
        return '大纲生成超时，请稍后重试。';
      case 'CLASSROOM_INVALID_RESPONSE':
        return '课堂生成结果不完整，请补充教学要求后重试。';
      case 'CLASSROOM_PROVIDER_ERROR':
        return '课堂模型暂时不可用，请检查 Provider 配置后重试。';
      case 'CLASSROOM_GENERATION_TIMEOUT':
        return '课堂生成超时，请稍后重试。';
      case 'GENERATION_IN_PROGRESS':
        return '这门课已有生成任务在进行中，请稍候。';
      case 'GENERATION_INTERRUPTED':
        return '生成任务因服务重启而中断，请重新生成。';
      case 'GENERATION_POLL_TIMEOUT':
        return '等待生成结果超时，请稍后重试。';
      case 'GENERATION_JOB_NOT_FOUND':
        return '找不到这次生成任务，请重新生成。';
      case 'PROVIDER_API_KEY_REQUIRED':
        return '当前默认模型缺少 API Key，请先到设置页补齐。';
      case 'COURSE_NOT_FOUND':
        return '找不到这门课程，可能已被移除。';
      default:
        return error.message || '课堂生成失败，请稍后重试。';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '课堂生成失败，请稍后重试。';
}

export function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
