'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CircleHelp,
  Loader2,
  Play,
  Presentation,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api/client';
import { generateClassroom } from '@/lib/api/classroom';
import { generateCourseOutline, getCourseOutline } from '@/lib/api/outlines';
import type { Course, GenerationJob } from '@/lib/api/types';
import { classroomErrorMessage, formatElapsed } from '@/lib/classroom/messages';
import {
  JobPollAbortedError,
  waitForGenerationJob,
} from '@/lib/classroom/wait-for-job';
import { cn } from '@/lib/utils/cn';

type Phase = 'idle' | 'outline' | 'classroom';

const steps = [
  {
    key: 'outline',
    label: '整理大纲',
    detail: '从课程素材提炼教学顺序',
  },
  {
    key: 'classroom',
    label: '编排场景',
    detail: '生成幻灯片、测验与旁白',
  },
  {
    key: 'ready',
    label: '布置课堂',
    detail: '写入版本并准备播放',
  },
] as const;

const phaseLabels: Record<Exclude<Phase, 'idle'>, string> = {
  outline: '正在整理课程大纲…',
  classroom: '正在编排课堂场景…',
};

interface JobProgress {
  progress: number;
  message: string;
}

async function startOrResumeJob(
  start: () => Promise<GenerationJob>,
): Promise<string> {
  try {
    const job = await start();
    return job.id;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'GENERATION_IN_PROGRESS') {
      const details = error.details as { job_id?: unknown } | null | undefined;
      if (details && typeof details.job_id === 'string') {
        return details.job_id;
      }
    }
    throw error;
  }
}

export function ClassroomOpening({
  course,
  courseId,
}: {
  course: Course;
  courseId: string;
}) {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<GenerationJob>({
    mutationFn: async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const trimmed = instructions.trim();
      const onProgress = (job: GenerationJob) =>
        setProgress({ progress: job.progress, message: job.message });

      setPhase('outline');
      setProgress(null);
      try {
        await getCourseOutline(courseId);
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 'OUTLINE_NOT_FOUND') {
          throw error;
        }
        const outlineJobId = await startOrResumeJob(() =>
          generateCourseOutline(courseId, {
            instructions: trimmed || undefined,
            scene_count: 8,
          }),
        );
        await waitForGenerationJob(outlineJobId, {
          signal: controller.signal,
          onProgress,
        });
      }
      setPhase('classroom');
      setProgress(null);
      const classroomJobId = await startOrResumeJob(() =>
        generateClassroom(courseId, {
          instructions: trimmed || undefined,
        }),
      );
      return waitForGenerationJob(classroomJobId, {
        signal: controller.signal,
        onProgress,
      });
    },
    onSuccess: async () => {
      setPhase('idle');
      setProgress(null);
      toast.success('课堂已生成，准备开场');
      await queryClient.invalidateQueries({ queryKey: ['classroom', courseId] });
    },
    onError: (error) => {
      setPhase('idle');
      setProgress(null);
      if (!(error instanceof JobPollAbortedError)) {
        toast.error(classroomErrorMessage(error));
      }
    },
  });

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!mutation.isLoading) {
      setElapsed(0);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mutation.isLoading]);

  let activeStep: (typeof steps)[number]['key'] | null = null;
  if (phase === 'outline') {
    activeStep = 'outline';
  } else if (phase === 'classroom') {
    activeStep = progress && progress.progress >= 90 ? 'ready' : 'classroom';
  }

  return (
    <div className='mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-16'>
      <div className='grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center'>
        <div>
          <p className='flex items-center gap-3 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-sage/60'>
            <span className='h-px w-8 bg-ember/70' />
            The room is quiet / 课堂尚未开场
          </p>
          <h2 className='mt-6 font-display text-[clamp(2.5rem,5vw,4.8rem)] font-normal leading-[0.96] tracking-[-0.05em] text-chalk'>
            把这门课，
            <br />
            变成可以
            <span className='italic text-ember'>走进去</span>
            <br />
            的课堂。
          </h2>
          <p className='mt-6 max-w-xl text-sm leading-7 text-chalk/50'>
            {course.title}
            {course.description ? ` · ${course.description}` : ''}
          </p>

          <div className='mt-8 flex flex-wrap gap-2.5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-chalk/40'>
            <span className='flex items-center gap-2 border border-chalk/10 px-2.5 py-2'>
              <Presentation className='h-3.5 w-3.5 text-sage' />
              幻灯片
            </span>
            <span className='flex items-center gap-2 border border-chalk/10 px-2.5 py-2'>
              <CircleHelp className='h-3.5 w-3.5 text-ochre' />
              测验
            </span>
            <span className='flex items-center gap-2 border border-chalk/10 px-2.5 py-2'>
              <Sparkles className='h-3.5 w-3.5 text-ember' />
              教师旁白
            </span>
          </div>

          <p className='mt-8 max-w-lg border-l border-ember/50 pl-4 text-xs leading-6 text-chalk/35'>
            第一次开场会自动检查课程大纲。若还没有大纲，系统会先整理教学顺序，再把它编排成可播放的课堂。
          </p>
        </div>

        <div className='relative border border-chalk/12 bg-chalk/[0.03] p-5 shadow-stage sm:p-6'>
          <span className='absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center border border-ember/40 bg-classroom font-mono text-[0.52rem] text-ember'>
            01
          </span>
          <div className='flex items-center justify-between border-b border-chalk/10 pb-4'>
            <p className='font-mono text-[0.52rem] uppercase tracking-[0.2em] text-chalk/40'>
              Open the room
            </p>
            <span className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/25'>
              v1
            </span>
          </div>

          <ol className='mt-5 space-y-3'>
            {steps.map((step, index) => {
              const active = activeStep === step.key;
              return (
                <li key={step.key} className='flex items-start gap-3'>
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[0.48rem]',
                      active
                        ? 'border-ember/60 bg-ember/10 text-ember'
                        : 'border-chalk/12 text-chalk/30',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span
                      className={cn(
                        'block text-xs transition-colors',
                        active ? 'text-chalk' : 'text-chalk/55',
                      )}
                    >
                      {step.label}
                    </span>
                    <span className='mt-0.5 block text-[0.68rem] leading-5 text-chalk/30'>
                      {step.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <label className='mt-6 block'>
            <span className='flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.16em] text-chalk/40'>
              教学要求
              <span className='normal-case tracking-normal text-chalk/25'>可选</span>
            </span>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={4000}
              rows={4}
              placeholder='例如：面向零基础学习者，多举生活例子，最后用一道测验收束。'
              className='mt-2 w-full resize-y border border-chalk/15 bg-classroom/60 px-3 py-3 text-sm leading-6 text-chalk/80 placeholder:text-chalk/25 focus:border-sage/50 focus:outline-none'
            />
          </label>

          <button
            type='button'
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
            className='mt-4 inline-flex h-11 w-full items-center justify-center gap-2 bg-ember px-5 text-sm font-medium text-white shadow-button transition-colors hover:bg-ember-dark disabled:cursor-wait disabled:opacity-70'
          >
            {mutation.isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                {phase === 'outline' ? phaseLabels.outline : phaseLabels.classroom}
              </>
            ) : (
              <>
                <Play className='h-4 w-4' />
                生成课堂
              </>
            )}
          </button>

          {mutation.isLoading ? (
            <div className='mt-4'>
              <div
                role='progressbar'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress?.progress ?? 0}
                className='h-[3px] w-full overflow-hidden bg-chalk/10'
              >
                <div
                  className='h-full bg-ember transition-[width] duration-700'
                  style={{ width: `${Math.max(4, progress?.progress ?? 4)}%` }}
                />
              </div>
              <div className='mt-2 flex items-center justify-between gap-3 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-chalk/30'>
                <span className='truncate text-[0.62rem] normal-case tracking-normal text-chalk/45'>
                  {progress?.message ??
                    (phase === 'outline' ? '准备大纲' : '准备课堂')}
                </span>
                <span className='shrink-0'>{formatElapsed(elapsed)}</span>
              </div>
            </div>
          ) : (
            <p className='mt-3 text-center text-[0.66rem] leading-5 text-chalk/30'>
              使用设置页的默认模型；若还没有大纲，会先生成一份。
            </p>
          )}

          {mutation.isError ? (
            <div
              role='alert'
              className='mt-4 border border-ember/35 bg-ember/[0.06] px-3 py-3 text-xs leading-6 text-ember/90'
            >
              {classroomErrorMessage(mutation.error)}
            </div>
          ) : null}

          <p className='mt-4 text-center text-[0.66rem] text-chalk/25'>
            模型或 API Key 有问题？
            <Link
              href='/settings'
              className='ml-1 text-chalk/50 underline decoration-chalk/20 underline-offset-4 transition-colors hover:text-chalk'
            >
              检查模型设置
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
