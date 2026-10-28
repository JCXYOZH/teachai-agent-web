export function resolveApiBaseUrl(
  configured: string | undefined,
  browserHostname?: string,
): string {
  const fallbackHost = browserHostname || 'localhost';
  const value = configured?.trim() || `http://${fallbackHost}:8000/api/v1`;

  try {
    const parsed = new URL(value);
    if (
      browserHostname &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      parsed.hostname = browserHostname;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}
