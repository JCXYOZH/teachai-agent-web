import { Brand } from '@/components/layout/brand';

export function SessionLoader() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-paper px-6'>
      <Brand />
      <div className='mt-10 h-px w-44 overflow-hidden bg-ink/10'>
        <div className='h-full w-1/2 animate-loading-line bg-ember' />
      </div>
      <p className='mt-5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/40'>
        正在翻开你的备课桌
      </p>
    </div>
  );
}
