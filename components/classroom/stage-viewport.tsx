'use client';

import {
  ChevronLeft,
  ChevronRight,
  MessageCircleQuestion,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { InteractiveStage } from '@/components/classroom/interactive-stage';
import { PblStage } from '@/components/classroom/pbl-stage';
import { QuizStage } from '@/components/classroom/quiz-stage';
import { SceneTypeIcon } from '@/components/classroom/scene-type-icon';
import { SlideStage } from '@/components/classroom/slide-stage';
import type {
  Classroom,
  ClassroomResult,
  ClassroomScene,
} from '@/lib/api/types';
import type { ClassroomPlayback } from '@/lib/classroom/use-classroom-playback';
import {
  isInteractiveContent,
  isPblContent,
  isQuizContent,
  isSlideContent,
  sceneStageMeta,
  sceneTypeLabels,
} from '@/lib/utils/classroom-scene';
import { cn } from '@/lib/utils/cn';

export function StageViewport({
  scene,
  scenes,
  sceneIndex,
  classroom,
  playback,
  hiddenElementIds,
  quizResults,
  completedTasks,
  responseKey,
  onSelectIndex,
  onAskTeacher,
}: {
  scene: ClassroomScene;
  scenes: ClassroomScene[];
  sceneIndex: number;
  classroom: Classroom;
  playback: ClassroomPlayback;
  hiddenElementIds: string[];
  quizResults: ClassroomResult[];
  completedTasks: Record<string, boolean>;
  responseKey: string;
  onSelectIndex: Dispatch<SetStateAction<number>>;
  onAskTeacher: () => void;
}) {
  const progress =
    scenes.length > 0 ? ((sceneIndex + 1) / scenes.length) * 100 : 0;
  const stageLabel = sceneTypeLabels[scene.type];

  return (
    <div className='relative border border-chalk/12 bg-[#07110e] p-2 shadow-stage sm:p-3'>
      <div className='flex items-center justify-between gap-3 border-b border-chalk/10 px-1 pb-3 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-chalk/35'>
        <span>
          Scene {String(scene.order).padStart(2, '0')} /{' '}
          {String(scenes.length).padStart(2, '0')}
        </span>
        <div className='flex items-center gap-2'>
          <span className='flex items-center gap-1.5 text-chalk/45'>
            <SceneTypeIcon type={scene.type} className='h-3 w-3 text-sage' />
            {stageLabel}
          </span>
          <button
            type='button'
            onClick={() => onAskTeacher()}
            className='inline-flex h-6 items-center gap-1 border border-ember/35 bg-ember/10 px-2 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ember transition-colors hover:border-ember/60 hover:bg-ember/15'
          >
            <MessageCircleQuestion className='h-3 w-3' />
            问老师
          </button>
        </div>
        <span
          className={cn(
            'hidden sm:inline',
            playback.audioAvailable ? 'text-sage/70' : null,
          )}
        >
          {playback.audioAvailable ? 'Audio · ' : 'Text · '}
          {sceneStageMeta[scene.type]}
        </span>
      </div>

      {scene.actions.length > 0 ? (
        <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={playback.toggle}
              className='inline-flex h-8 items-center gap-1.5 border border-chalk/15 px-2.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/60 transition-colors hover:border-ember/45 hover:text-chalk'
            >
              {playback.playing ? (
                <Pause className='h-3 w-3' />
              ) : (
                <Play className='h-3 w-3' />
              )}
              {playback.audioLoading
                ? '加载旁白…'
                : playback.playing
                  ? '暂停'
                  : playback.step >= playback.total
                    ? '重播动作'
                    : '播放动作'}
            </button>
            <button
              type='button'
              onClick={playback.reset}
              disabled={playback.revealed === null}
              className='inline-flex h-8 items-center gap-1.5 border border-chalk/10 px-2.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/40 transition-colors hover:border-chalk/25 hover:text-chalk disabled:cursor-default disabled:opacity-30'
            >
              <RotateCcw className='h-3 w-3' />
              重置
            </button>
          </div>
          <div className='flex items-center gap-1' aria-hidden='true'>
            {scene.actions.map((action, actionIndex) => (
              <span
                key={action.id}
                className={cn(
                  'h-1 w-4 transition-colors',
                  actionIndex < playback.step ? 'bg-ember' : 'bg-chalk/15',
                )}
              />
            ))}
          </div>
          <span className='font-mono text-[0.44rem] uppercase tracking-[0.14em] text-chalk/25'>
            Action {Math.min(playback.step + 1, playback.total)} / {playback.total}
          </span>
        </div>
      ) : null}

      <div key={scene.id} className='mt-3 animate-rise'>
        {isSlideContent(scene.content) ? (
          <SlideStage
            canvas={scene.content.canvas}
            illustration={scene.content.illustration}
            hiddenElementIds={hiddenElementIds}
            highlightedElementId={playback.highlighted}
          />
        ) : isQuizContent(scene.content) ? (
          <QuizStage
            key={`${scene.id}-${responseKey}`}
            content={scene.content}
            courseId={classroom.course_id}
            sceneId={scene.id}
            initialResults={quizResults}
          />
        ) : isInteractiveContent(scene.content) ? (
          <InteractiveStage
            key={scene.id}
            content={scene.content}
            highlighted={playback.highlighted === `${scene.id}-stage`}
          />
        ) : isPblContent(scene.content) ? (
          <PblStage
            key={`${scene.id}-${responseKey}`}
            content={scene.content}
            courseId={classroom.course_id}
            sceneId={scene.id}
            initialCompleted={completedTasks}
          />
        ) : (
          <div className='flex min-h-[24rem] items-center justify-center border border-dashed border-chalk/15 bg-[#0B1714] p-8 text-center'>
            <div>
              <p className='font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/30'>
                {sceneTypeLabels[scene.type]}
              </p>
              <p className='mt-3 font-display text-2xl text-chalk/70'>
                这个场景还没有渲染器
              </p>
              <p className='mt-2 text-xs leading-6 text-chalk/35'>
                该场景类型暂不支持渲染，请重新生成课堂。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className='mt-3 flex items-center gap-3 border-t border-chalk/10 pt-3'>
        <button
          type='button'
          onClick={() => onSelectIndex((index) => Math.max(index - 1, 0))}
          disabled={sceneIndex === 0}
          className='inline-flex h-9 shrink-0 items-center gap-1.5 border border-chalk/15 px-2.5 text-xs text-chalk/55 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-25 sm:px-3'
          aria-label='上一场景'
        >
          <ChevronLeft className='h-4 w-4' />
          <span className='hidden sm:inline'>上一场景</span>
        </button>

        <div className='min-w-0 flex-1'>
          <div className='group relative flex h-4 items-center'>
            <div className='pointer-events-none h-1 w-full overflow-hidden bg-chalk/10'>
              <div
                className='h-full bg-ember transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className='pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-ember transition-transform duration-200 group-hover:scale-125'
              style={{
                left: `calc(${progress}% - ${progress > 96 ? 6 : 0}px)`,
              }}
              aria-hidden='true'
            />
            <input
              type='range'
              min={1}
              max={Math.max(scenes.length, 1)}
              step={1}
              value={sceneIndex + 1}
              onChange={(event) =>
                onSelectIndex(Number(event.target.value) - 1)
              }
              aria-label='拖动切换场景'
              title='拖动切换场景'
              className='absolute inset-0 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0'
            />
          </div>
          <p className='mt-2 text-center font-mono text-[0.46rem] uppercase tracking-[0.14em] text-chalk/25'>
            {sceneIndex + 1} / {scenes.length} · Drag or Arrow keys
          </p>
        </div>

        <button
          type='button'
          onClick={() =>
            onSelectIndex((index) => Math.min(index + 1, scenes.length - 1))
          }
          disabled={sceneIndex >= scenes.length - 1}
          className='inline-flex h-9 shrink-0 items-center gap-1.5 border border-chalk/15 px-2.5 text-xs text-chalk/55 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-25 sm:px-3'
          aria-label='下一场景'
        >
          <span className='hidden sm:inline'>下一场景</span>
          <ChevronRight className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
