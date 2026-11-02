'use client';

import { useEffect } from 'react';

export function DevBfcacheGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return undefined;
    }
    // Chrome freezes the Next.js HMR WebSocket with the page in BFCache.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
  return null;
}
