'use client';

import { useEffect } from 'react';

export function DevBfcacheGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return undefined;
    }
    // 页面进入 BFCache 后 Chrome 会冻结 Next.js 的热更新 WebSocket。
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
