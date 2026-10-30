'use client';

import {
  Check,
  CheckCircle2,
  ListChecks,
  RotateCcw,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { submitClassroomResponses } from '@/lib/api/classroom';
import type {
  ClassroomAnswerItem,
  ClassroomQuestion,
  ClassroomQuizContent,
  ClassroomResult,
} from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const questionTypeLabels: Record<ClassroomQuestion['type'], string> = {
  single: '单选题',
  multiple: '多选题',
  short_answer: '简答题',
};

interface QuizStageProps {
  content: ClassroomQuizContent;
  courseId: string;
  sceneId: string;
  initialResults?: ClassroomResult[];
}

function verdictOf(result: ClassroomResult): string {
  if (result.correct === true) {
    return '回答正确';
  }
  if (result.correct === false) {
    return '再想想';
  }
  return '已记录';
}

export function QuizStage({
  content,
  courseId,
  sceneId,
  initialResults,
}: QuizStageProps) {
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ClassroomResult>>(() => {
    const seed: Record<string, ClassroomResult> = {};
    for (const item of initialResults ?? []) {
      seed[item.target_id] = item;
    }
    return seed;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradedCount = Object.keys(results).length;
  const score = Object.values(results).reduce(
    (total, result) => total + (result.score ?? 0),
    0,
  );
  const maxScore = Object.values(results).reduce(
    (total, result) => total + result.max_score,
    0,
  );

  const toggleOption = (question: ClassroomQuestion, value: string) => {
    if (results[question.id]) {
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

  const buildAnswers = (): ClassroomAnswerItem[] => {
    const items: ClassroomAnswerItem[] = [];
    for (const question of questions) {
      if (results[question.id]) {
        continue;
      }
      if (question.type === 'short_answer') {
        const text = (shortAnswers[question.id] ?? '').trim();
        if (text) {
          items.push({ kind: 'question', target_id: question.id, answer: text });
        }
        continue;
      }
      const values = selected[question.id] ?? [];
      if (values.length > 0) {
        items.push({
          kind: 'question',
          target_id: question.id,
          answer: values,
        });
      }
    }
    return items;
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    const items = buildAnswers();
    if (items.length === 0) {
      setError('请先作答至少一道题再提交。');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitClassroomResponses(courseId, sceneId, items);
      setResults((current) => {
        const merged = { ...current };
        for (const result of response.results) {
          merged[result.target_id] = result;
        }
        return merged;
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message || '提交失败，请稍后重试。');
      } else {
        setError('提交失败，请检查网络后重试。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetAnswers = () => {
    setSelected({});
    setShortAnswers({});
    setResults({});
    setError(null);
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
          <div className='flex flex-wrap items-center gap-2'>
            {gradedCount > 0 ? (
              <span className='inline-flex h-9 items-center gap-2 border border-sage/35 bg-sage/10 px-3 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-sage'>
                得分 {score} / {maxScore}
              </span>
            ) : null}
            {gradedCount > 0 ? (
              <button
                type='button'
                onClick={resetAnswers}
                className='inline-flex h-9 items-center gap-2 border border-chalk/15 px-3 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-chalk/60 transition-colors hover:border-sage/40 hover:text-chalk'
              >
                <RotateCcw className='h-3.5 w-3.5' />
                重新作答
              </button>
            ) : null}
            <button
              type='button'
              onClick={handleSubmit}
              disabled={submitting || questions.length === 0}
              className='inline-flex h-9 items-center gap-2 bg-ember px-3.5 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-chalk transition-colors hover:bg-ember-dark disabled:cursor-default disabled:opacity-40'
            >
              <Send className='h-3.5 w-3.5' />
              {submitting ? '提交中' : '提交作答'}
            </button>
          </div>
        </header>

        {error ? (
          <p
            role='alert'
            className='mt-4 flex items-center gap-2 border border-ember/40 bg-ember/10 px-3 py-2 text-[0.75rem] leading-6 text-ember'
          >
            <TriangleAlert className='h-3.5 w-3.5 shrink-0' />
            {error}
          </p>
        ) : null}

        <div className='mt-5 space-y-4'>
          {questions.map((question, index) => {
            const selectedValues = selected[question.id] ?? [];
            const result = results[question.id];
            const graded = Boolean(result);
            const answerLabels = question.options
              .filter((option) => question.answer.includes(option.value))
              .map((option) => `${option.value}. ${option.label}`);
            const analysis = result?.analysis ?? question.analysis;
            return (
              <article
                key={question.id}
                className={cn(
                  'border p-4 transition-colors sm:p-5',
                  result?.correct === true
                    ? 'border-sage/40 bg-sage/[0.06]'
                    : result?.correct === false
                      ? 'border-ember/35 bg-ember/[0.05]'
                      : 'border-chalk/10 bg-chalk/[0.025]',
                )}
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
                      {result ? (
                        <>
                          <span className='h-1 w-1 rounded-full bg-chalk/20' />
                          <span
                            className={cn(
                              'inline-flex items-center gap-1',
                              result.correct === true
                                ? 'text-sage'
                                : result.correct === false
                                  ? 'text-ember'
                                  : 'text-ochre',
                            )}
                          >
                            {result.correct === true ? (
                              <CheckCircle2 className='h-3 w-3' />
                            ) : null}
                            {verdictOf(result)}
                          </span>
                        </>
                      ) : null}
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
                          const isCorrectOption =
                            graded && question.answer.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => toggleOption(question, option.value)}
                              disabled={graded}
                              aria-pressed={isSelected}
                              className={cn(
                                'flex items-start gap-3 border px-3 py-3 text-left text-sm leading-6 transition-colors disabled:cursor-default',
                                isCorrectOption
                                  ? 'border-sage/60 bg-sage/15 text-chalk'
                                  : graded && isSelected
                                    ? 'border-ember/55 bg-ember/10 text-ember'
                                    : isSelected
                                      ? 'border-sage/50 bg-sage/10 text-chalk'
                                      : 'border-chalk/10 text-chalk/60 hover:border-chalk/25 hover:bg-chalk/[0.04]',
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[0.52rem]',
                                  isCorrectOption
                                    ? 'border-sage/60 text-sage'
                                    : isSelected
                                      ? 'border-sage/50 text-sage'
                                      : 'border-chalk/20 text-chalk/45',
                                )}
                              >
                                {isCorrectOption ? (
                                  <Check className='h-3 w-3' />
                                ) : (
                                  option.value
                                )}
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
                        value={shortAnswers[question.id] ?? ''}
                        onChange={(event) =>
                          setShortAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                        disabled={graded}
                        className='mt-4 min-h-[5.5rem] w-full resize-y border border-chalk/15 bg-classroom/60 px-3 py-3 text-sm leading-6 text-chalk/80 placeholder:text-chalk/25 focus:border-sage/50 focus:outline-none disabled:opacity-70'
                      />
                    )}

                    {result ? (
                      <div className='mt-4 border-t border-chalk/10 pt-3 text-xs leading-6 text-chalk/55'>
                        {answerLabels.length > 0 || result.reference_answer.length > 0 ? (
                          <p>
                            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-sage/70'>
                              参考答案
                            </span>
                            <span className='ml-2 text-chalk/80'>
                              {answerLabels.length > 0
                                ? answerLabels.join('；')
                                : result.reference_answer.join(' / ')}
                            </span>
                          </p>
                        ) : (
                          <p className='text-chalk/35'>本题暂无参考答案。</p>
                        )}
                        {analysis ? (
                          <p className='mt-1.5'>
                            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ochre/80'>
                              解析
                            </span>
                            <span className='ml-2'>{analysis}</span>
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
