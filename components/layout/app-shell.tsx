'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='min-h-screen lg:pl-[248px]'>
      <Sidebar />
      <div className='flex min-h-screen flex-col'>
        <Topbar />
        <main className='mx-auto w-full max-w-[1500px] flex-1 px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-16 lg:pt-9'>
          <div key={pathname} className='animate-rise'>
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
