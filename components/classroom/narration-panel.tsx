'use client';

import { AudioLines, Loader2, Volume2 } from 'lucide-react';

import { SceneTypeIcon } from '@/components/classroom/scene-type-icon';
import type { Classroom, ClassroomScene } from '@/lib/api/types';
import { sceneTypeLabels } from '@/lib/utils/classroom-scene';
import { cn } from '@/lib/utils/cn';

export function NarrationPanel({
  scene,
  classroom,
  liveSpeech,
  hasAudio,
  busy,
  progress,
  onGenerateScene,
  onGenerateAll,
  className,
}: {
  scene: ClassroomScene;
  classroom: Classroom;
  liveSpeech?: string | null;
  hasAudio: boolean;
  busy: boolean;
  progress: { message: string; progress: number } | null;
  onGenerateScene: () => void;
  onGenerateAll: () => void;
  className?: string;
}) {
  const speech = scene.actions.find(
    (action) => action.type === 'speech' && typeof action.text === 'string',
  );
  const speechText = (liveSpeech ?? speech?.text)?.trim();

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
        <span className={cn(liveSpeech ? 'text-ember' : hasAudio ? 'text-sage' : null)}>
          {liveSpeech ? 'Playing' : hasAudio ? 'Audio ready' : 'Voice / 01'}
        </span>
      </div>

      <p className='mt-5 font-display text-[1.18rem] italic leading-8 text-chalk/80 sm:text-[1.28rem]'>
        {speechText || '本场景还没有旁白。'}
      </p>

      <div className='mt-5 flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={onGenerateScene}
          disabled={busy}
          className='inline-flex h-8 items-center gap-1.5 border border-ember/40 bg-ember/10 px-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ember transition-colors hover:bg-ember/15 disabled:cursor-default disabled:opacity-40'
        >
          {busy ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            <Volume2 className='h-3 w-3' />
          )}
          {hasAudio ? 'Regenerate scene' : 'Generate voice'}
        </button>
        <button
          type='button'
          onClick={onGenerateAll}
          disabled={busy}
          className='inline-flex h-8 items-center gap-1.5 border border-chalk/15 px-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/50 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-40'
        >
          <AudioLines className='h-3 w-3' />
          All scenes
        </button>
      </div>
      {busy ? (
        <p className='mt-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/35'>
          {progress
            ? `${progress.message} · ${progress.progress}%`
            : '排队中…'}
        </p>
      ) : (
        <p className='mt-3 text-[0.66rem] leading-5 text-chalk/30'>
          {hasAudio
            ? '本页旁白已合成，播放时会跟随音频时长推进。'
            : '尚未合成音频，将按文本长度计时朗读。'}
        </p>
      )}

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
