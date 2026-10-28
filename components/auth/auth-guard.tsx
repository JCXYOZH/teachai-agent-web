'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { SessionLoader } from '@/components/layout/session-loader';
import { useAuthStore } from '@/lib/stores/auth-store';

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status !== 'authenticated') {
    return <SessionLoader />;
  }

  return <>{children}</>;
}
