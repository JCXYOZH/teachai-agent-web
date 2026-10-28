import { useAuthStore } from '@/lib/stores/auth-store';
import { resolveApiBaseUrl } from '@/lib/api/base-url';
import type { ApiErrorBody } from '@/lib/api/types';

export const API_BASE_URL = resolveApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  typeof window === 'undefined' ? undefined : window.location.hostname,
);

const CSRF_COOKIE_NAME = 'teachai_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
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

export class ApiNetworkError extends Error {
  constructor() {
    super('无法连接课程服务，请确认后端已启动');
    this.name = 'ApiNetworkError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  retry?: boolean;
  csrf?: boolean;
}

let unauthorizedHandler: (() => Promise<boolean>) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<boolean>) | null) {
  unauthorizedHandler = handler;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function hasSessionHint(): boolean {
  return getCookie(CSRF_COOKIE_NAME) !== null;
}

function buildHeaders(options: RequestOptions, method: string): Headers {
  const headers = new Headers(options.headers);
  const accessToken = useAuthStore.getState().accessToken;
  const bodyIsFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (options.body !== undefined && !bodyIsFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const csrfEnabled = options.csrf ?? MUTATING_METHODS.has(method);
  const csrfToken = getCookie(CSRF_COOKIE_NAME);
  if (csrfEnabled && csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }
  return headers;
}

function serializeBody(options: RequestOptions): BodyInit | undefined {
  if (options.body === undefined) {
    return undefined;
  }
  if (
    typeof FormData !== 'undefined' && options.body instanceof FormData
  ) {
    return options.body;
  }
  if (typeof Blob !== 'undefined' && options.body instanceof Blob) {
    return options.body;
  }
  if (typeof options.body === 'string') {
    return options.body;
  }
  return JSON.stringify(options.body);
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as Partial<ApiErrorBody>;
    const error = payload.error;
    if (error?.code && error.message) {
      return new ApiError(response.status, error.code, error.message, error.details);
    }
  } catch {
    // The response was not JSON; fall through to a generic error.
  }
  return new ApiError(
    response.status,
    'HTTP_ERROR',
    response.statusText || '请求失败，请稍后再试',
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await performRequest(path, options);

  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

export async function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const response = await performRequest(path, options);
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.blob();
}

async function performRequest(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = buildHeaders(options, method);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      body: serializeBody(options),
      credentials: 'include',
      cache: options.cache ?? 'no-store',
    });
  } catch {
    throw new ApiNetworkError();
  }

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    const refreshed = unauthorizedHandler ? await unauthorizedHandler() : false;
    if (refreshed) {
      return performRequest(path, { ...options, retry: false });
    }
  }
  return response;
}
