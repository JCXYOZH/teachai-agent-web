import { ArrowUpRight, BookOpenText, FileStack, Plus } from 'lucide-react';
import Link from 'next/link';

import { StageCard } from '@/components/library/stage-card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const process = [
  {
    index: '01',
    title: '收集材料',
    description: 'PDF、DOCX、PPTX，或一段还没整理的 Markdown。',
  },
  {
    index: '02',
    title: '确认大纲',
    description: '先看结构，再让模型继续往下写。',
  },
  {
    index: '03',
    title: '走进课堂',
    description: '场景、讲解、互动与一次完整的预演。',
  },
];

export default function LibraryPage() {
  return (
    <div className='space-y-9'>
      <section className='grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]'>
        <div className='paper-card relative overflow-hidden p-7 sm:p-9 xl:p-10'>
          <div className='pointer-events-none absolute inset-0 bg-paper-grid bg-grid-32 opacity-30' />
          <div className='pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-ember/10' />

          <div className='relative flex items-center justify-between gap-4'>
            <p className='eyebrow'>From first thought to first room</p>
            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
              Page 01
            </span>
          </div>

          <div className='relative mt-10 max-w-2xl'>
            <h2 className='font-display text-display-lg font-normal text-ink'>
              今天，想把哪一节课
              <br />
              讲得
              <span className='italic text-ember'>更好？</span>
            </h2>
            <p className='mt-6 max-w-xl text-sm leading-7 text-ink/55 sm:text-[0.95rem]'>
              先放下一份资料，或者只写下那个还没想清楚的问题。TeachAI 会把它整理成大纲、场景，和一场可以提前走进去的课堂。
            </p>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link href='/create' className={buttonVariants({ variant: 'ember', size: 'lg' })}>
                <Plus className='h-4 w-4' />
                准备新课程
              </Link>
              <Link href='/knowledge' className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <BookOpenText className='h-4 w-4' />
                整理素材
              </Link>
            </div>

            <p className='margin-note mt-10 max-w-sm'>
              备课不是把一页写满，而是先找到值得被问出来的那个问题。
            </p>
          </div>

          <div className='relative mt-9 flex items-center justify-between border-t border-ink/10 pt-4 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
            <span>TeachAI / Lesson studio</span>
            <span>Qwen · llama.cpp</span>
          </div>
        </div>

        <StageCard />
      </section>

      <section>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <p className='eyebrow'>Courses / 最近课程</p>
            <h2 className='mt-2 font-display text-2xl font-medium tracking-[-0.03em] text-ink'>
              书架
            </h2>
          </div>
          <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
            All / 00
          </span>
        </div>

        <div className='mt-5 border border-dashed border-ink/15 px-5 py-8 sm:px-8 sm:py-9'>
          <div className='grid items-center gap-6 md:grid-cols-[auto_1fr_auto]'>
            <div className='relative h-16 w-20' aria-hidden='true'>
              <span className='absolute left-0 top-3 h-12 w-16 rotate-[-4deg] border border-ink/15 bg-paper/50' />
              <span className='absolute left-2 top-1 h-12 w-16 rotate-[2deg] border border-ink/20 bg-paper-deep/40' />
              <FileStack className='absolute bottom-0 right-1 h-6 w-6 text-ink/35' strokeWidth={1.4} />
            </div>
            <div>
              <h3 className='font-display text-xl font-medium text-ink'>书架还是空的</h3>
              <p className='mt-2 max-w-xl text-sm leading-6 text-ink/45'>
                先从一段文本、一个问题，或一份现成讲义开始。第一门课程会出现在这里。
              </p>
            </div>
            <Link
              href='/create'
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'justify-between md:justify-center')}
            >
              准备第一门课程
              <ArrowUpRight className='h-3.5 w-3.5' />
            </Link>
          </div>
        </div>
      </section>

      <section className='border-y border-ink/10 py-8'>
        <div className='rule-label'>From source to classroom / 从材料到课堂</div>
        <div className='mt-6 grid gap-6 md:grid-cols-3'>
          {process.map((item) => (
            <div key={item.index} className='relative md:border-l md:border-ink/10 md:pl-5'>
              <span className='font-mono text-[0.54rem] tracking-[0.16em] text-ember'>{item.index}</span>
              <h3 className='mt-3 font-display text-xl text-ink'>{item.title}</h3>
              <p className='mt-2 max-w-xs text-xs leading-6 text-ink/40'>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
