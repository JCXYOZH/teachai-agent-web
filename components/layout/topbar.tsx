'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Brand } from '@/components/layout/brand';
import { PAGE_META } from '@/lib/navigation';

export function Topbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { eyebrow: 'TeachAI / Workspace', title: '备课桌' };

  return (
    <header className='sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-xl'>
      <div className='flex h-[68px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[76px] lg:px-10'>
        <div className='flex min-w-0 items-center gap-4'>
          <Brand compact className='lg:hidden' />
          <span className='hidden h-7 w-px bg-ink/10 lg:block' />
          <div className='min-w-0'>
            <p className='truncate font-mono text-[0.5rem] uppercase tracking-[0.18em] text-ink/35'>
              {meta.eyebrow}
            </p>
            <h1 className='mt-1 truncate font-display text-xl font-medium tracking-[-0.025em] text-ink'>
              {meta.title}
            </h1>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='hidden items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/35 sm:flex'>
            <span className='h-1.5 w-1.5 rounded-full bg-sage' />
            备课中
          </div>
          <Link
            href='/create'
            className='inline-flex h-10 items-center gap-2 rounded-[3px] bg-ink px-3.5 text-xs font-medium text-paper transition-colors hover:bg-ink-soft sm:px-4'
          >
            <Plus className='h-3.5 w-3.5' />
            <span className='hidden xs:inline'>新建课程</span>
            <span className='xs:hidden'>新课程</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
