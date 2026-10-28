'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { refreshSession } from '@/lib/api/auth';
import { hasSessionHint } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;
    if (hasSessionHint()) {
      void refreshSession();
    } else {
      useAuthStore.getState().clearSession();
    }
  }, []);

  return <>{children}</>;
}
