import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ClassroomPreview } from '@/components/auth/classroom-preview';
import { LoginForm } from '@/components/auth/login-form';
import { Brand } from '@/components/layout/brand';

export const metadata: Metadata = {
  title: '登录',
};

export default function LoginPage() {
  return (
    <main className='min-h-screen lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]'>
      <ClassroomPreview />

      <section className='flex min-h-screen flex-col bg-paper'>
        <div className='stage-grid relative overflow-hidden px-6 pb-8 pt-6 lg:hidden'>
          <div className='pointer-events-none absolute -right-16 top-4 h-40 w-40 rounded-full border border-sage/10' />
          <Brand inverted />
          <div className='mt-10 animate-rise'>
            <p className='font-mono text-[0.55rem] uppercase tracking-[0.2em] text-sage/60'>
              TeachAI / 备课预演
            </p>
            <p className='mt-3 max-w-xs font-display text-[2.1rem] leading-[1.02] tracking-[-0.04em] text-chalk'>
              把一节课，
              <br />
              写成可以
              <span className='italic text-ember'>走进去</span>
              的空间。
            </p>
          </div>
        </div>

        <div className='relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:py-16'>
          <div className='pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-ink/10 lg:block' />
          <Suspense
            fallback={
              <div className='w-full max-w-[29rem] animate-pulse'>
                <div className='h-3 w-32 bg-ink/10' />
                <div className='mt-5 h-10 w-72 bg-ink/10' />
                <div className='mt-3 h-4 w-64 bg-ink/[0.06]' />
                <div className='mt-12 h-px bg-ink/10' />
                <div className='mt-10 h-12 border-b border-ink/10' />
                <div className='mt-8 h-12 border-b border-ink/10' />
                <div className='mt-10 h-12 bg-ink/10' />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <footer className='flex items-center justify-between border-t border-ink/10 px-6 py-5 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ink/30 sm:px-10'>
          <span>TeachAI / 2026</span>
          <span>教师备课空间</span>
        </footer>
      </section>
    </main>
  );
}
