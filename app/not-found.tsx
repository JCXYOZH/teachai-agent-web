import Link from 'next/link';

import { Brand } from '@/components/layout/brand';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center'>
      <Brand />
      <p className='mt-12 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink/35'>
        404 / Missing page
      </p>
      <h1 className='mt-4 font-display text-display-md font-normal text-ink'>
        这张讲义里，
        <span className='italic text-ember'>没有这一页</span>。
      </h1>
      <p className='mt-4 max-w-sm text-sm leading-6 text-ink/45'>
        链接可能已经移动，或者它还没有被写进你的备课桌。
      </p>
      <Link href='/library' className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-8`}>
        回到课程档案
      </Link>
    </main>
  );
}
