import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from '@/lib/api/base-url';

describe('resolveApiBaseUrl', () => {
  it('keeps the configured remote API host', () => {
    expect(
      resolveApiBaseUrl('https://api.example.com/api/v1/', 'teacher.example.com'),
    ).toBe('https://api.example.com/api/v1');
  });

  it('normalizes a local API URL to the page hostname', () => {
    expect(
      resolveApiBaseUrl('http://localhost:8000/api/v1', '127.0.0.1'),
    ).toBe('http://127.0.0.1:8000/api/v1');
    expect(
      resolveApiBaseUrl('http://127.0.0.1:8000/api/v1', 'localhost'),
    ).toBe('http://localhost:8000/api/v1');
  });

  it('falls back to the current host when no API URL is configured', () => {
    expect(resolveApiBaseUrl(undefined, '192.168.1.20')).toBe(
      'http://192.168.1.20:8000/api/v1',
    );
  });

  it('preserves relative API paths', () => {
    expect(resolveApiBaseUrl('/api/v1/', '127.0.0.1')).toBe('/api/v1');
  });
});
