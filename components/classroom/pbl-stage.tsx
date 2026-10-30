'use client';

import { Check, FolderKanban, Target } from 'lucide-react';
import { useState } from 'react';

import { submitClassroomResponses } from '@/lib/api/classroom';
import type { ClassroomPblContent } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

interface PblStageProps {
  content: ClassroomPblContent;
  courseId: string;
  sceneId: string;
  initialCompleted?: Record<string, boolean>;
}

export function PblStage({
  content,
  courseId,
  sceneId,
  initialCompleted,
}: PblStageProps) {
  const project = content.project;
  const milestones = Array.isArray(project?.milestones) ? project.milestones : [];
  const microtasks = milestones.flatMap((milestone) => milestone.microtasks ?? []);
  const [completed, setCompleted] = useState<Record<string, boolean>>(
    initialCompleted ?? {},
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const completedCount = microtasks.filter((task) => completed[task.id]).length;
  const progress =
    microtasks.length > 0 ? Math.round((completedCount / microtasks.length) * 100) : 0;

  const toggle = async (taskId: string) => {
    const nextValue = !completed[taskId];
    setCompleted((current) => ({ ...current, [taskId]: nextValue }));
    setSaving((current) => ({ ...current, [taskId]: true }));
    setError(null);
    try {
      await submitClassroomResponses(courseId, sceneId, [
        {
          kind: 'microtask',
          target_id: taskId,
          answer: { completed: nextValue },
        },
      ]);
    } catch {
      setCompleted((current) => ({ ...current, [taskId]: !nextValue }));
      setError('进度保存失败，请检查网络后重试。');
    } finally {
      setSaving((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
    }
  };

  return (
    <div className='relative overflow-hidden border border-chalk/10 bg-[#0B1714]'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(201,154,61,0.12),transparent_38%),radial-gradient(circle_at_88%_92%,rgba(169,189,168,0.1),transparent_42%)]' />
      <div className='relative p-4 sm:p-6 lg:p-8'>
        <header className='flex flex-wrap items-end justify-between gap-4 border-b border-chalk/10 pb-4'>
          <div className='min-w-0'>
            <p className='font-mono text-[0.52rem] uppercase tracking-[0.22em] text-sage/60'>
              Project / 项目任务
            </p>
            <h2 className='mt-2 flex items-center gap-2 font-display text-2xl font-medium tracking-[-0.02em] text-chalk sm:text-[1.75rem]'>
              <FolderKanban className='h-5 w-5 shrink-0 text-ember' strokeWidth={1.6} />
              <span className='min-w-0'>{project?.title || '项目任务'}</span>
            </h2>
            {project?.description ? (
              <p className='mt-2 max-w-2xl text-sm leading-7 text-chalk/55'>
                {project.description}
              </p>
            ) : null}
          </div>
          <p className='inline-flex shrink-0 items-center gap-2 border border-chalk/10 px-3 py-2 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/35'>
            {Object.values(saving).some(Boolean) ? 'Saving…' : 'Auto-saved'}
          </p>
        </header>

        {error ? (
          <p
            role='alert'
            className='mt-4 border border-ember/40 bg-ember/10 px-3 py-2 text-[0.75rem] leading-6 text-ember'
          >
            {error}
          </p>
        ) : null}

        <div className='mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] leading-6'>
          {project?.learningObjective ? (
            <p className='flex items-start gap-2 text-chalk/50'>
              <Target className='mt-1 h-3.5 w-3.5 shrink-0 text-sage/60' strokeWidth={1.6} />
              <span>
                <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-chalk/30'>
                  学习目标 ·{' '}
                </span>
                {project.learningObjective}
              </span>
            </p>
          ) : null}
          {project?.finalDeliverable ? (
            <p className='text-chalk/50'>
              <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-chalk/30'>
                最终产出 ·{' '}
              </span>
              <span className='text-ochre/80'>{project.finalDeliverable}</span>
            </p>
          ) : null}
        </div>

        <div className='mt-6 space-y-4'>
          {milestones.map((milestone, milestoneIndex) => {
            const tasks = milestone.microtasks ?? [];
            const done = tasks.filter((task) => completed[task.id]).length;
            return (
              <section
                key={milestone.id}
                aria-label={milestone.title}
                className='border border-chalk/10 bg-chalk/[0.025] p-4 sm:p-5'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-3 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-chalk/30'>
                      <span className='text-ember/80'>
                        Milestone {String(milestoneIndex + 1).padStart(2, '0')}
                      </span>
                      <span className='h-1 w-1 rounded-full bg-chalk/20' />
                      <span>
                        {done} / {tasks.length}
                      </span>
                    </div>
                    <h3 className='mt-2 text-[1rem] font-medium leading-7 text-chalk/90'>
                      {milestone.title}
                    </h3>
                    {milestone.description ? (
                      <p className='mt-1 text-[0.78rem] leading-6 text-chalk/45'>
                        {milestone.description}
                      </p>
                    ) : null}
                  </div>
                  {milestone.deliverable ? (
                    <p className='shrink-0 border border-ochre/25 px-2.5 py-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ochre/75'>
                      产出 · {milestone.deliverable}
                    </p>
                  ) : null}
                </div>

                <ul className='mt-4 space-y-2'>
                  {tasks.map((task, taskIndex) => {
                    const isDone = Boolean(completed[task.id]);
                    return (
                      <li key={task.id}>
                        <button
                          type='button'
                          onClick={() => {
                            void toggle(task.id);
                          }}
                          aria-pressed={isDone}
                          className={cn(
                            'flex w-full items-start gap-3 border px-3 py-3 text-left transition-colors',
                            isDone
                              ? 'border-sage/40 bg-sage/10'
                              : 'border-chalk/10 hover:border-chalk/25 hover:bg-chalk/[0.04]',
                          )}
                        >
                          <span
                            aria-hidden='true'
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[0.5rem]',
                              isDone
                                ? 'border-sage/60 text-sage'
                                : 'border-chalk/20 text-chalk/40',
                            )}
                          >
                            {isDone ? (
                              <Check className='h-3 w-3' />
                            ) : (
                              String(taskIndex + 1)
                            )}
                          </span>
                          <span className='min-w-0 flex-1'>
                            <span
                              className={cn(
                                'block text-sm leading-6',
                                isDone ? 'text-chalk/45 line-through' : 'text-chalk/85',
                              )}
                            >
                              {task.title}
                            </span>
                            {task.description ? (
                              <span className='mt-1 block text-[0.74rem] leading-6 text-chalk/40'>
                                {task.description}
                              </span>
                            ) : null}
                            {task.completionCriteria ? (
                              <span className='mt-1 block text-[0.72rem] leading-6 text-chalk/35'>
                                完成标准：{task.completionCriteria}
                              </span>
                            ) : null}
                            {task.hints?.length ? (
                              <span className='mt-1 block text-[0.72rem] italic leading-6 text-sage/50'>
                                提示：{task.hints.join('；')}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <div className='mt-6 border-t border-chalk/10 pt-4'>
          <div className='flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.14em] text-chalk/30'>
            <span>Project progress</span>
            <span>
              {completedCount} / {microtasks.length} · {progress}%
            </span>
          </div>
          <div className='mt-2 h-1 w-full overflow-hidden bg-chalk/10'>
            <div
              className='h-full bg-sage transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className='mt-3 text-[0.68rem] leading-6 text-chalk/30'>
            勾选会自动保存到你的课堂记录，重新进入课堂时会恢复进度。
          </p>
        </div>
      </div>
    </div>
  );
}
