import { ApiError, ApiNetworkError } from '@/lib/api/client';

export function messageForError(error: unknown): string {
  if (error instanceof ApiNetworkError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: '手机号/邮箱或密码不正确，请重新输入。',
      EMAIL_ALREADY_REGISTERED: '这个邮箱已经注册，可以直接登录。',
      PHONE_ALREADY_REGISTERED: '这个手机号已经注册，可以直接登录。',
      EMAIL_VERIFICATION_NOT_FOUND: '请先点击“发送验证码”，再提交注册。',
      PHONE_VERIFICATION_NOT_FOUND: '请先点击“发送验证码”，再提交注册。',
      VERIFICATION_CODE_EXPIRED: '验证码已过期，请重新发送。',
      INVALID_VERIFICATION_CODE: '验证码不正确，请检查后重试。',
      SMS_SEND_RATE_LIMITED: '发送太频繁，请稍后再试。',
      VERIFICATION_ATTEMPTS_EXCEEDED: '尝试次数过多，请重新发送验证码。',
      VERIFICATION_RESEND_TOO_SOON: '发送太频繁，请稍后再试。',
      EMAIL_DELIVERY_UNAVAILABLE: '验证邮件暂时无法发送，请稍后再试。',
      SMS_DELIVERY_UNAVAILABLE: '验证短信暂时无法发送，请稍后再试。',
      REGISTRATION_ALREADY_PENDING: '验证码刚刚已发送，请稍候再试。',
      VALIDATION_ERROR: '请检查填写内容后重试。',
      CSRF_INVALID: '会话校验失败，请刷新页面后重试。',
      INVALID_REFRESH_TOKEN: '会话已过期，请重新登录。',
    };
    return messages[error.code] ?? error.message;
  }
  return '暂时无法完成请求，请稍后再试。';
}

export function retryAfterSeconds(details: unknown): number {
  if (details && typeof details === 'object' && 'retry_after' in details) {
    const value = (details as { retry_after?: unknown }).retry_after;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.ceil(value);
    }
  }
  return 60;
}
