'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Brand } from '@/components/layout/brand';
import { logoutUser } from '@/lib/api/auth';
import { NAV_ITEMS } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils/cn';

function initials(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? 'T';
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      router.replace('/login');
    } catch {
      toast.error('退出时无法联系服务，请稍后重试');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className='stage-grid fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col overflow-hidden lg:flex'>
      <div className='pointer-events-none absolute -left-20 top-24 h-56 w-56 rounded-full border border-sage/10' />
      <div className='nav-stitch absolute right-0 top-0 h-full w-px opacity-40' />

      <div className='relative border-b border-chalk/10 px-6 py-6'>
        <Brand inverted />
      </div>

      <div className='relative flex-1 px-4 pt-8'>
        <p className='px-3 font-mono text-[0.52rem] uppercase tracking-[0.2em] text-chalk/30'>
          Workspace
        </p>
        <nav className='mt-4 space-y-1' aria-label='主导航'>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-[3px] px-3 py-3 transition-colors',
                  active
                    ? 'bg-chalk/[0.07] text-chalk'
                    : 'text-chalk/45 hover:bg-chalk/[0.04] hover:text-chalk/80',
                )}
              >
                <span
                  className={cn(
                    'absolute bottom-2 left-0 top-2 w-[2px] bg-ember transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon className={cn('h-[17px] w-[17px] shrink-0', active && 'text-sage')} />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='text-[0.82rem]'>{item.label}</span>
                  <span className='mt-0.5 font-mono text-[0.48rem] uppercase tracking-[0.12em] text-chalk/25'>
                    {item.caption}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className='mx-3 mt-10 border-l border-ember/60 pl-4'>
          <p className='font-display text-[1.05rem] italic leading-snug text-chalk/55'>
            “先写问题，
            <br />
            再写答案。”
          </p>
          <p className='mt-3 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-chalk/25'>
            备课手记 / note 01
          </p>
        </div>
      </div>

      <div className='relative mt-auto px-4 pb-5'>
        <div className='border-t border-chalk/10 pt-5'>
          <div className='flex items-center gap-3 px-1'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center border border-sage/30 bg-sage/10 font-display text-sm text-chalk'>
              {initials(user?.display_name ?? user?.email ?? 'TeachAI')}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-[0.78rem] text-chalk/80'>{user?.display_name}</p>
              <p className='mt-0.5 truncate font-mono text-[0.52rem] text-chalk/30'>
                {user?.email}
              </p>
            </div>
            <button
              type='button'
              onClick={handleLogout}
              disabled={loggingOut}
              className='flex h-8 w-8 shrink-0 items-center justify-center text-chalk/30 transition-colors hover:bg-chalk/[0.06] hover:text-ember disabled:opacity-40'
              aria-label='退出登录'
              title='退出登录'
            >
              <LogOut className='h-4 w-4' />
            </button>
          </div>
          <p className='mt-4 px-1 font-mono text-[0.44rem] uppercase tracking-[0.16em] text-chalk/20'>
            TeachAI / Phase 1
          </p>
        </div>
      </div>
    </aside>
  );
}
