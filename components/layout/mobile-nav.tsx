'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label='移动端主导航'
      className='safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-chalk/10 bg-classroom/[0.97] px-2 pt-2 backdrop-blur-xl lg:hidden'
    >
      <div className='grid grid-cols-4'>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-1 py-2 text-[0.6rem] transition-colors',
                active ? 'text-chalk' : 'text-chalk/40',
              )}
            >
              <span
                className={cn(
                  'absolute -top-2 h-[2px] w-5 bg-ember transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon className={cn('h-[18px] w-[18px]', active && 'text-sage')} />
              <span className='truncate'>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
