'use client';

import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { QuizStage } from '@/components/classroom/quiz-stage';
import { SlideStage } from '@/components/classroom/slide-stage';
import type {
  Classroom,
  ClassroomQuizContent,
  ClassroomScene,
  ClassroomSceneContent,
  ClassroomSceneType,
  ClassroomSlideContent,
} from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const sceneTypeLabels: Record<ClassroomSceneType, string> = {
  slide: 'Slide',
  quiz: 'Check',
  interactive: 'Interactive',
  pbl: 'Project',
};

function SceneTypeIcon({
  type,
  className,
}: {
  type: ClassroomSceneType;
  className?: string;
}) {
  const Icon: LucideIcon = type === 'quiz' ? CircleHelp : Presentation;
  return <Icon className={className} strokeWidth={1.6} />;
}

function isSlideContent(
  content: ClassroomSceneContent,
): content is ClassroomSlideContent {
  return content.type === 'slide' && 'canvas' in content;
}

function isQuizContent(
  content: ClassroomSceneContent,
): content is ClassroomQuizContent {
  return content.type === 'quiz' && 'questions' in content;
}

function SceneRail({
  scenes,
  activeIndex,
  onSelect,
  className,
}: {
  scenes: ClassroomScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <aside
      aria-label='课堂场景列表'
      className={cn(
        'flex-col border border-chalk/10 bg-classroom/45 p-3 backdrop-blur-sm',
        className,
      )}
    >
      <div className='flex items-center justify-between px-2 pb-3 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/35'>
        <span>Scenes</span>
        <span>{String(scenes.length).padStart(2, '0')}</span>
      </div>
      <div className='min-h-0 flex-1 space-y-1 overflow-y-auto pr-1'>
        {scenes.map((scene, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={scene.id}
              type='button'
              onClick={() => onSelect(index)}
              aria-pressed={active}
              className={cn(
                'group relative flex w-full items-start gap-2.5 px-2.5 py-2.5 text-left transition-colors',
                active ? 'bg-chalk/[0.07]' : 'hover:bg-chalk/[0.04]',
              )}
            >
              <span
                className={cn(
                  'absolute bottom-2 left-0 top-2 w-[2px] bg-ember transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'mt-0.5 font-mono text-[0.5rem] tracking-[0.1em]',
                  active ? 'text-ember/80' : 'text-chalk/25',
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    'block truncate text-xs leading-5',
                    active ? 'text-chalk' : 'text-chalk/55',
                  )}
                >
                  {scene.title}
                </span>
                <span className='mt-0.5 flex items-center gap-1.5 font-mono text-[0.46rem] uppercase tracking-[0.1em] text-chalk/25'>
                  <SceneTypeIcon
                    type={scene.type}
                    className='h-2.5 w-2.5'
                  />
                  {sceneTypeLabels[scene.type]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MobileSceneRail({
  scenes,
  activeIndex,
  onSelect,
}: {
  scenes: ClassroomScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className='-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden'>
      {scenes.map((scene, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={scene.id}
            type='button'
            onClick={() => onSelect(index)}
            aria-pressed={active}
            className={cn(
              'flex shrink-0 items-center gap-2 border px-2.5 py-2 text-left transition-colors',
              active
                ? 'border-ember/45 bg-ember/[0.08] text-chalk'
                : 'border-chalk/10 text-chalk/45',
            )}
          >
            <span className='font-mono text-[0.48rem] text-chalk/30'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className='max-w-[8.5rem] truncate text-[0.7rem]'>
              {scene.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NarrationPanel({
  scene,
  classroom,
  className,
}: {
  scene: ClassroomScene;
  classroom: Classroom;
  className?: string;
}) {
  const speech = scene.actions.find(
    (action) => action.type === 'speech' && typeof action.text === 'string',
  );
  const speechText = speech?.text?.trim();

  return (
    <aside
      aria-live='polite'
      className={cn(
        'border border-chalk/10 bg-classroom/35 p-5 backdrop-blur-sm',
        className,
      )}
    >
      <div className='flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/35'>
        <span>Narration</span>
        <span>Voice / 01</span>
      </div>

      <p className='mt-5 font-display text-[1.18rem] italic leading-8 text-chalk/80 sm:text-[1.28rem]'>
        {speechText || '本场景还没有旁白。'}
      </p>

      <dl className='mt-6 space-y-2.5 border-t border-chalk/10 pt-4 text-xs'>
        <div className='flex items-center justify-between gap-4'>
          <dt className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/25'>
            场景
          </dt>
          <dd className='text-chalk/55'>
            {String(scene.order).padStart(2, '0')} / {String(classroom.scene_count).padStart(2, '0')}
          </dd>
        </div>
        <div className='flex items-center justify-between gap-4'>
          <dt className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/25'>
            类型
          </dt>
          <dd className='flex items-center gap-1.5 text-chalk/55'>
            <SceneTypeIcon type={scene.type} className='h-3 w-3 text-sage' />
            {sceneTypeLabels[scene.type]}
          </dd>
        </div>
        <div className='flex items-center justify-between gap-4'>
          <dt className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/25'>
            动作
          </dt>
          <dd className='text-chalk/55'>{scene.actions.length}</dd>
        </div>
        <div className='flex items-center justify-between gap-4'>
          <dt className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-chalk/25'>
            版本
          </dt>
          <dd className='font-mono text-[0.52rem] text-chalk/45'>
            v{classroom.version} · DSL {classroom.dsl_version}
          </dd>
        </div>
      </dl>

      {classroom.description ? (
        <p className='mt-5 border-l border-ember/50 pl-3 text-[0.7rem] leading-6 text-chalk/35'>
          {classroom.description}
        </p>
      ) : null}

      {classroom.model_name ? (
        <p className='mt-4 font-mono text-[0.44rem] uppercase tracking-[0.14em] text-chalk/20'>
          {classroom.provider_id ?? 'provider'} · {classroom.model_name}
        </p>
      ) : null}
    </aside>
  );
}

export function ClassroomPlayer({ classroom }: { classroom: Classroom }) {
  const scenes = classroom.scenes;
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    setSceneIndex(0);
  }, [classroom.id]);

  useEffect(() => {
    if (sceneIndex > scenes.length - 1) {
      setSceneIndex(Math.max(0, scenes.length - 1));
    }
  }, [sceneIndex, scenes.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'ArrowRight') {
        setSceneIndex((index) => Math.min(index + 1, scenes.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setSceneIndex((index) => Math.max(index - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scenes.length]);

  const scene = scenes[sceneIndex];
  if (!scene) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-20 text-center'>
        <p className='font-display text-3xl text-chalk'>这间课堂还没有场景。</p>
      </div>
    );
  }

  const progress = scenes.length > 0 ? ((sceneIndex + 1) / scenes.length) * 100 : 0;
  const stageLabel = scene.type === 'quiz' ? 'Check' : 'Slide';

  return (
    <div className='mx-auto grid max-w-[1720px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_310px]'>
      <SceneRail
        scenes={scenes}
        activeIndex={sceneIndex}
        onSelect={setSceneIndex}
        className='sticky top-[84px] hidden max-h-[calc(100vh-104px)] lg:flex'
      />

      <section className='min-w-0'>
        <MobileSceneRail
          scenes={scenes}
          activeIndex={sceneIndex}
          onSelect={setSceneIndex}
        />

        <div className='relative border border-chalk/12 bg-[#07110e] p-2 shadow-stage sm:p-3'>
          <div className='flex items-center justify-between gap-3 border-b border-chalk/10 px-1 pb-3 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-chalk/35'>
            <span>
              Scene {String(scene.order).padStart(2, '0')} /{' '}
              {String(scenes.length).padStart(2, '0')}
            </span>
            <span className='flex items-center gap-1.5 text-chalk/45'>
              <SceneTypeIcon type={scene.type} className='h-3 w-3 text-sage' />
              {stageLabel}
            </span>
            <span className='hidden sm:inline'>{scene.type === 'quiz' ? 'Assessment' : '1280 × 720'}</span>
          </div>

          <div key={scene.id} className='mt-3 animate-rise'>
            {isSlideContent(scene.content) ? (
              <SlideStage canvas={scene.content.canvas} />
            ) : isQuizContent(scene.content) ? (
              <QuizStage key={scene.id} content={scene.content} />
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
                    互动与项目式场景会在后续阶段接入。
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className='mt-3 flex items-center gap-3 border-t border-chalk/10 pt-3'>
            <button
              type='button'
              onClick={() => setSceneIndex((index) => Math.max(index - 1, 0))}
              disabled={sceneIndex === 0}
              className='inline-flex h-9 shrink-0 items-center gap-1.5 border border-chalk/15 px-2.5 text-xs text-chalk/55 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-25 sm:px-3'
              aria-label='上一场景'
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>上一场景</span>
            </button>

            <div className='min-w-0 flex-1'>
              <div className='h-1 w-full overflow-hidden bg-chalk/10'>
                <div
                  className='h-full bg-ember transition-all duration-300'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='mt-2 text-center font-mono text-[0.46rem] uppercase tracking-[0.14em] text-chalk/25'>
                {sceneIndex + 1} / {scenes.length} · Arrow keys
              </p>
            </div>

            <button
              type='button'
              onClick={() =>
                setSceneIndex((index) => Math.min(index + 1, scenes.length - 1))
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
      </section>

      <NarrationPanel
        scene={scene}
        classroom={classroom}
        className='xl:sticky xl:top-[84px] xl:self-start'
      />
    </div>
  );
}
