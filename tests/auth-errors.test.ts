import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/client';
import {
  cooldownLabel,
  messageForError,
  retryAfterSeconds,
} from '@/lib/utils/auth-errors';

describe('auth error helpers', () => {
  it('maps rate limit errors for both channels to friendly messages', () => {
    expect(
      messageForError(new ApiError(429, 'SMS_SEND_RATE_LIMITED', 'Too many SMS')),
    ).toBe('发送太频繁，请稍后再试。');
    expect(
      messageForError(new ApiError(429, 'EMAIL_SEND_RATE_LIMITED', 'Too many email')),
    ).toBe('发送太频繁，请稍后再试。');
  });

  it('falls back to the server message for unknown codes', () => {
    expect(messageForError(new ApiError(400, 'SOMETHING_NEW', 'Raw message'))).toBe(
      'Raw message',
    );
  });

  it('reads the retry_after hint and defaults to one minute', () => {
    expect(retryAfterSeconds({ retry_after: 42.2 })).toBe(43);
    expect(retryAfterSeconds({ retry_after: 0 })).toBe(60);
    expect(retryAfterSeconds(undefined)).toBe(60);
  });

  it('formats the cooldown in seconds up to one minute and in minutes beyond', () => {
    expect(cooldownLabel(42)).toBe('42 秒后重发');
    expect(cooldownLabel(60)).toBe('60 秒后重发');
    expect(cooldownLabel(61)).toBe('2 分钟后重发');
    expect(cooldownLabel(3600)).toBe('60 分钟后重发');
  });
});
