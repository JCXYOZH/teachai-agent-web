'use client';

import { Check, Eye, EyeOff, ListChecks } from 'lucide-react';
import { useState } from 'react';

import type { ClassroomQuestion, ClassroomQuizContent } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const questionTypeLabels: Record<ClassroomQuestion['type'], string> = {
  single: '单选题',
  multiple: '多选题',
  short_answer: '简答题',
};

export function QuizStage({ content }: { content: ClassroomQuizContent }) {
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [revealed, setRevealed] = useState(false);

  const toggleOption = (question: ClassroomQuestion, value: string) => {
    if (revealed) {
      return;
    }
    setSelected((current) => {
      const existing = current[question.id] ?? [];
      if (question.type === 'multiple') {
        const next = existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value];
        return { ...current, [question.id]: next };
      }
      return { ...current, [question.id]: [value] };
    });
  };

  return (
    <div className='relative min-h-[24rem] w-full overflow-hidden border border-chalk/10 bg-[#0B1714] p-4 sm:min-h-[28rem] sm:p-6 lg:p-8'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(217,88,61,0.12),transparent_38%),radial-gradient(circle_at_12%_90%,rgba(169,189,168,0.1),transparent_42%)]' />
      <div className='relative'>
        <header className='flex flex-wrap items-end justify-between gap-4 border-b border-chalk/10 pb-4'>
          <div>
            <p className='font-mono text-[0.52rem] uppercase tracking-[0.22em] text-sage/60'>
              Check / 检查理解
            </p>
            <h2 className='mt-2 flex items-center gap-2 font-display text-2xl font-medium tracking-[-0.02em] text-chalk sm:text-[1.75rem]'>
              <ListChecks className='h-5 w-5 text-ember' />
              {questions.length > 0 ? `${questions.length} 道题` : '还没有题目'}
            </h2>
          </div>
          {questions.length > 0 ? (
            <button
              type='button'
              onClick={() => setRevealed((value) => !value)}
              className='inline-flex h-9 items-center gap-2 border border-chalk/15 px-3 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-chalk/60 transition-colors hover:border-sage/40 hover:text-chalk'
              aria-pressed={revealed}
            >
              {revealed ? <EyeOff className='h-3.5 w-3.5' /> : <Eye className='h-3.5 w-3.5' />}
              {revealed ? '隐藏答案' : '查看答案'}
            </button>
          ) : null}
        </header>

        <div className='mt-5 space-y-4'>
          {questions.map((question, index) => {
            const selectedValues = selected[question.id] ?? [];
            const answerLabels = question.options
              .filter((option) => question.answer.includes(option.value))
              .map((option) => `${option.value}. ${option.label}`);
            return (
              <article
                key={question.id}
                className='border border-chalk/10 bg-chalk/[0.025] p-4 sm:p-5'
              >
                <div className='flex gap-3 sm:gap-4'>
                  <span className='mt-0.5 font-mono text-[0.58rem] tracking-[0.12em] text-ember/80'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-3 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/30'>
                      <span>{questionTypeLabels[question.type] ?? '题目'}</span>
                      <span className='h-1 w-1 rounded-full bg-chalk/20' />
                      <span>{question.points} 分</span>
                    </div>
                    <h3 className='mt-2 text-[0.98rem] leading-7 text-chalk/90 sm:text-base'>
                      {question.question}
                    </h3>

                    {question.options.length > 0 ? (
                      <div
                        className='mt-4 grid gap-2 md:grid-cols-2'
                        role='group'
                        aria-label={`第 ${index + 1} 题选项`}
                      >
                        {question.options.map((option) => {
                          const isSelected = selectedValues.includes(option.value);
                          const isCorrect = question.answer.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => toggleOption(question, option.value)}
                              disabled={revealed}
                              aria-pressed={isSelected}
                              className={cn(
                                'flex items-start gap-3 border px-3 py-3 text-left text-sm leading-6 transition-colors disabled:cursor-default',
                                revealed && isCorrect
                                  ? 'border-sage/60 bg-sage/15 text-chalk'
                                  : revealed && isSelected
                                    ? 'border-ember/55 bg-ember/10 text-ember'
                                    : isSelected
                                      ? 'border-sage/50 bg-sage/10 text-chalk'
                                      : 'border-chalk/10 text-chalk/60 hover:border-chalk/25 hover:bg-chalk/[0.04]',
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[0.52rem]',
                                  revealed && isCorrect
                                    ? 'border-sage/60 text-sage'
                                    : isSelected
                                      ? 'border-sage/50 text-sage'
                                      : 'border-chalk/20 text-chalk/45',
                                )}
                              >
                                {revealed && isCorrect ? <Check className='h-3 w-3' /> : option.value}
                              </span>
                              <span className='min-w-0 flex-1'>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        aria-label={`第 ${index + 1} 题回答`}
                        placeholder='在这里写下你的回答…'
                        disabled={revealed}
                        className='mt-4 min-h-[5.5rem] w-full resize-y border border-chalk/15 bg-classroom/60 px-3 py-3 text-sm leading-6 text-chalk/80 placeholder:text-chalk/25 focus:border-sage/50 focus:outline-none disabled:opacity-70'
                      />
                    )}

                    {revealed ? (
                      <div className='mt-4 border-t border-chalk/10 pt-3 text-xs leading-6 text-chalk/55'>
                        {question.hasAnswer && answerLabels.length > 0 ? (
                          <p>
                            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-sage/70'>
                              参考答案
                            </span>
                            <span className='ml-2 text-chalk/80'>{answerLabels.join('；')}</span>
                          </p>
                        ) : question.hasAnswer && question.answer.length > 0 ? (
                          <p>
                            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-sage/70'>
                              参考答案
                            </span>
                            <span className='ml-2 text-chalk/80'>{question.answer.join(' / ')}</span>
                          </p>
                        ) : (
                          <p className='text-chalk/35'>本题暂无参考答案。</p>
                        )}
                        {question.analysis ? (
                          <p className='mt-1.5'>
                            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ochre/80'>
                              解析
                            </span>
                            <span className='ml-2'>{question.analysis}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
          {questions.length === 0 ? (
            <p className='border border-dashed border-chalk/15 px-4 py-10 text-center text-sm text-chalk/40'>
              这个场景还没有题目，等待下一阶段补充互动内容。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
