import {
  apiRequest,
  setUnauthorizedHandler,
} from '@/lib/api/client';
import type {
  AuthResponse,
  LoginPayload,
  RegistrationCodeResponse,
  RegisterPayload,
} from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/auth-store';

let refreshPromise: Promise<boolean> | null = null;

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const session = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
    retry: false,
  });
  useAuthStore.getState().setSession(session);
  return session;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const session = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
    retry: false,
  });
  useAuthStore.getState().setSession(session);
  return session;
}

export async function sendRegistrationCode(
  email: string,
): Promise<RegistrationCodeResponse> {
  return apiRequest<RegistrationCodeResponse>('/auth/register/send-code', {
    method: 'POST',
    body: { email },
    auth: false,
    retry: false,
  });
}

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const accessTokenBeforeRefresh = useAuthStore.getState().accessToken;
  refreshPromise = (async () => {
    try {
      const session = await apiRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        auth: false,
        retry: false,
        csrf: true,
      });
      useAuthStore.getState().setSession(session);
      return true;
    } catch {
      const state = useAuthStore.getState();
      if (state.accessToken === accessTokenBeforeRefresh) {
        state.clearSession();
      }
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      auth: false,
      retry: false,
      csrf: true,
    });
  } finally {
    useAuthStore.getState().clearSession();
  }
}

setUnauthorizedHandler(refreshSession);
