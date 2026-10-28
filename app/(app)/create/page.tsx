import { ArrowLeft, ArrowUpRight, CircleDashed, FileText, LayoutList, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const briefRows = [
  { label: '你想讲什么？', placeholder: '一个主题、一个问题，或一段还没整理的说明' },
  { label: '这堂课面向谁？', placeholder: '学段、基础、课堂场景' },
  { label: '希望上多久？', placeholder: '45 分钟 / 一节课' },
];

const nextSteps = [
  { icon: FileText, title: '放进素材', copy: '从讲义、PDF 或一段手动输入开始。' },
  { icon: LayoutList, title: '确认大纲', copy: '先看结构，再决定让模型写到哪里。' },
  { icon: Sparkles, title: '预演课堂', copy: '场景、讲解、互动与声音一次成型。' },
];

export default function CreatePage() {
  return (
    <div className='mx-auto max-w-5xl'>
      <section className='grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.72fr)]'>
        <div className='paper-card relative overflow-hidden p-7 sm:p-9'>
          <div className='pointer-events-none absolute inset-0 notebook-rule opacity-30' />
          <div className='relative'>
            <div className='flex items-center justify-between gap-4'>
              <p className='eyebrow'>New lesson / 课程草稿</p>
              <Badge tone='ember'>Phase 2</Badge>
            </div>

            <h2 className='mt-9 max-w-lg font-display text-display-md font-normal text-ink'>
              从一句话开始，
              <br />
              把课<span className='italic text-ember'>写出来</span>。
            </h2>
            <p className='mt-4 max-w-xl text-sm leading-7 text-ink/50'>
              课程创建流程将在阶段 2 接入。下面是编辑器的信息骨架：先说明要讲什么，再让学生、时长与素材把边界收紧。
            </p>

            <div className='mt-10 border-t border-ink/15'>
              {briefRows.map((row, index) => (
                <div
                  key={row.label}
                  className='grid gap-2 border-b border-ink/10 py-5 sm:grid-cols-[9rem_1fr] sm:items-baseline'
                >
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-[0.5rem] text-ember/80'>0{index + 1}</span>
                    <span className='text-xs text-ink/65'>{row.label}</span>
                  </div>
                  <p className='text-sm text-ink/25'>{row.placeholder}</p>
                </div>
              ))}
            </div>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <button type='button' disabled className={cn(buttonVariants({ variant: 'ember', size: 'lg' }), 'opacity-45')}>
                下一步：整理大纲
                <ArrowUpRight className='h-4 w-4' />
              </button>
              <span className='text-xs text-ink/35'>阶段 2 开放</span>
            </div>
          </div>
        </div>

        <aside className='flex flex-col justify-between border border-ink/10 bg-paper/35 p-6 sm:p-7'>
          <div>
            <div className='flex items-center justify-between'>
              <p className='eyebrow'>After that / 接下来</p>
              <CircleDashed className='h-4 w-4 text-ink/25' strokeWidth={1.4} />
            </div>
            <div className='mt-7 space-y-7'>
              {nextSteps.map(({ icon: Icon, title, copy }, index) => (
                <div key={title} className='grid grid-cols-[auto_1fr] gap-4'>
                  <div className='flex flex-col items-center'>
                    <span className='flex h-9 w-9 items-center justify-center border border-ink/15 bg-paper/70 text-ink/50'>
                      <Icon className='h-4 w-4' strokeWidth={1.5} />
                    </span>
                    {index < nextSteps.length - 1 && <span className='mt-2 h-8 w-px bg-ink/10' />}
                  </div>
                  <div className='pt-1'>
                    <p className='text-sm text-ink/70'>{title}</p>
                    <p className='mt-1.5 text-xs leading-5 text-ink/35'>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-8 border-l border-ember/50 pl-4'>
            <p className='font-display text-base italic leading-6 text-ink/50'>
              “结构先于句子。先决定学生要经过什么，再决定你要说什么。”
            </p>
          </div>
        </aside>
      </section>

      <div className='mt-6 flex flex-col justify-between gap-4 border border-dashed border-ink/15 px-5 py-4 text-xs text-ink/45 sm:flex-row sm:items-center'>
        <p>课程 CRUD、素材上传和大纲确认将在下一阶段接通。</p>
        <Link href='/library' className='inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink/50 hover:text-ember'>
          <ArrowLeft className='h-3.5 w-3.5' />
          回到课程档案
        </Link>
      </div>
    </div>
  );
}
