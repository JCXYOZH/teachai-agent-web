import { create } from 'zustand';

import type { AuthResponse, User } from '@/lib/api/types';

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'restoring',
  setSession: (session) =>
    set({
      user: session.user,
      accessToken: session.access_token,
      status: 'authenticated',
    }),
  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      status: 'unauthenticated',
    }),
}));
