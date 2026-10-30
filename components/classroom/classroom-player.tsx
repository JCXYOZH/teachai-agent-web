'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FolderKanban,
  ImagePlus,
  Loader2,
  MousePointerClick,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { InteractiveStage } from '@/components/classroom/interactive-stage';
import { PblStage } from '@/components/classroom/pbl-stage';
import { QuizStage } from '@/components/classroom/quiz-stage';
import { SlideStage } from '@/components/classroom/slide-stage';
import { getClassroomResponses } from '@/lib/api/classroom';
import { ApiError } from '@/lib/api/client';
import {
  generateClassroomIllustrations,
  generateSceneIllustration,
} from '@/lib/api/images';
import { downloadMediaBlob } from '@/lib/api/media';
import {
  generateClassroomNarration,
  generateSceneNarration,
} from '@/lib/api/narration';
import type {
  Classroom,
  ClassroomInteractiveContent,
  ClassroomIllustration,
  ClassroomPblContent,
  ClassroomQuizContent,
  ClassroomResult,
  ClassroomScene,
  ClassroomSceneContent,
  ClassroomSceneType,
  ClassroomSlideContent,
} from '@/lib/api/types';
import { useClassroomPlayback } from '@/lib/classroom/use-classroom-playback';
import {
  JobPollAbortedError,
  waitForGenerationJob,
} from '@/lib/classroom/wait-for-job';
import { cn } from '@/lib/utils/cn';

const sceneTypeLabels: Record<ClassroomSceneType, string> = {
  slide: 'Slide',
  quiz: 'Check',
  interactive: 'Lab',
  pbl: 'Project',
};

const sceneStageMeta: Record<ClassroomSceneType, string> = {
  slide: '1280 × 720',
  quiz: 'Assessment',
  interactive: 'Sandboxed · 1280 × 720',
  pbl: 'Project brief',
};

const sceneTypeIcons: Record<ClassroomSceneType, LucideIcon> = {
  slide: Presentation,
  quiz: CircleHelp,
  interactive: MousePointerClick,
  pbl: FolderKanban,
};

function SceneTypeIcon({
  type,
  className,
}: {
  type: ClassroomSceneType;
  className?: string;
}) {
  const Icon = sceneTypeIcons[type] ?? Presentation;
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

function isInteractiveContent(
  content: ClassroomSceneContent,
): content is ClassroomInteractiveContent {
  return content.type === 'interactive' && 'html' in content;
}

function isPblContent(
  content: ClassroomSceneContent,
): content is ClassroomPblContent {
  return content.type === 'pbl' && 'project' in content;
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

function IllustrationPanel({
  illustration,
  busy,
  progress,
  onGenerateScene,
  onGenerateAll,
  className,
}: {
  illustration?: ClassroomIllustration | null;
  busy: boolean;
  progress: { message: string; progress: number } | null;
  onGenerateScene: () => void;
  onGenerateAll: () => void;
  className?: string;
}) {
  const ready = Boolean(illustration?.mediaId);

  return (
    <aside
      aria-live='polite'
      className={cn(
        'border border-chalk/10 bg-classroom/35 p-5 backdrop-blur-sm',
        className,
      )}
    >
      <div className='flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/35'>
        <span>Illustration</span>
        <span className={ready ? 'text-sage' : 'text-chalk/30'}>
          {ready ? 'Art ready' : 'Key visual / 01'}
        </span>
      </div>

      <div className='mt-5 flex items-start gap-3 border border-chalk/10 bg-chalk/[0.025] p-3'>
        <span className='flex h-10 w-10 shrink-0 items-center justify-center border border-ember/30 bg-ember/[0.08] text-ember'>
          <ImagePlus className='h-4 w-4' strokeWidth={1.6} />
        </span>
        <div className='min-w-0'>
          <p className='text-xs leading-6 text-chalk/75'>
            {ready ? '本页主视觉已生成，播放时随幻灯片淡入。' : '为当前幻灯片生成一张教学主视觉。'}
          </p>
          <p className='mt-1 font-mono text-[0.44rem] uppercase tracking-[0.12em] text-chalk/28'>
            {ready
              ? `${illustration?.providerId ?? 'provider'} · ${illustration?.width ?? 0}×${illustration?.height ?? 0}`
              : 'Qwen Image · Pollinations fallback'}
          </p>
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={onGenerateScene}
          disabled={busy}
          className='inline-flex h-8 items-center gap-1.5 border border-ember/40 bg-ember/10 px-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ember transition-colors hover:bg-ember/15 disabled:cursor-default disabled:opacity-40'
        >
          {busy ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            <ImagePlus className='h-3 w-3' />
          )}
          {ready ? 'Regenerate art' : 'Generate art'}
        </button>
        <button
          type='button'
          onClick={onGenerateAll}
          disabled={busy}
          className='inline-flex h-8 items-center gap-1.5 border border-chalk/15 px-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/50 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-40'
        >
          All slides
        </button>
      </div>

      {busy ? (
        <p className='mt-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/35'>
          {progress
            ? `${progress.message} · ${progress.progress}%`
            : '等待图片任务…'}
        </p>
      ) : (
        <p className='mt-3 text-[0.66rem] leading-5 text-chalk/30'>
          每页最多 1 张，整堂最多 6 张。图片会转为 WebP 并保存在受保护资产目录。
        </p>
      )}
    </aside>
  );
}

export function ClassroomPlayer({ classroom }: { classroom: Classroom }) {
  const scenes = classroom.scenes;
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes[sceneIndex];
  const queryClient = useQueryClient();
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const narrationAbortRef = useRef<AbortController | null>(null);
  const illustrationAbortRef = useRef<AbortController | null>(null);
  const [narrationProgress, setNarrationProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);
  const [illustrationProgress, setIllustrationProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);

  const clearAudioCache = useCallback(() => {
    for (const url of audioCacheRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    audioCacheRef.current.clear();
  }, []);

  const loadAudio = useCallback(async (audioId: string) => {
    const cached = audioCacheRef.current.get(audioId);
    if (cached) {
      return cached;
    }
    try {
      const blob = await downloadMediaBlob(audioId);
      const url = URL.createObjectURL(blob);
      audioCacheRef.current.set(audioId, url);
      return url;
    } catch {
      return null;
    }
  }, []);

  const playback = useClassroomPlayback(scene?.actions ?? [], scene?.id ?? '', {
    loadAudio,
  });

  const narrationMutation = useMutation({
    mutationFn: async (sceneId?: string) => {
      narrationAbortRef.current?.abort();
      const controller = new AbortController();
      narrationAbortRef.current = controller;
      const job = sceneId
        ? await generateSceneNarration(classroom.course_id, sceneId)
        : await generateClassroomNarration(classroom.course_id);
      return waitForGenerationJob(job.id, {
        signal: controller.signal,
        onProgress: (update) =>
          setNarrationProgress({
            message: update.message,
            progress: update.progress,
          }),
      });
    },
    onSuccess: async (job) => {
      setNarrationProgress(null);
      clearAudioCache();
      toast.success(
        job.scene_count > 0
          ? `旁白已就绪 · ${job.scene_count} 个场景`
          : '旁白任务已完成',
      );
      await queryClient.invalidateQueries({
        queryKey: ['classroom', classroom.course_id],
      });
    },
    onError: (error) => {
      setNarrationProgress(null);
      if (error instanceof JobPollAbortedError) {
        return;
      }
      toast.error(
        error instanceof ApiError ? error.message : '旁白生成失败，请稍后再试',
      );
    },
  });

  const illustrationMutation = useMutation({
    mutationFn: async (sceneId?: string) => {
      illustrationAbortRef.current?.abort();
      const controller = new AbortController();
      illustrationAbortRef.current = controller;
      const targetScene = sceneId
        ? scenes.find((candidate) => candidate.id === sceneId)
        : null;
      const targetIllustration =
        targetScene && isSlideContent(targetScene.content)
          ? targetScene.content.illustration
          : null;
      const payload = targetIllustration ? { regenerate: true } : {};
      const job = sceneId
        ? await generateSceneIllustration(
            classroom.course_id,
            sceneId,
            payload,
          )
        : await generateClassroomIllustrations(classroom.course_id);
      return waitForGenerationJob(job.id, {
        signal: controller.signal,
        onProgress: (update) =>
          setIllustrationProgress({
            message: update.message,
            progress: update.progress,
          }),
      });
    },
    onSuccess: async (job) => {
      setIllustrationProgress(null);
      toast.success(
        job.scene_count > 0
          ? `配图已就绪 · ${job.scene_count} 个场景`
          : '配图任务已完成',
      );
      await queryClient.invalidateQueries({
        queryKey: ['classroom', classroom.course_id],
      });
    },
    onError: (error) => {
      setIllustrationProgress(null);
      if (error instanceof JobPollAbortedError) {
        return;
      }
      toast.error(
        error instanceof ApiError ? error.message : '配图生成失败，请稍后再试',
      );
    },
  });

  useEffect(() => clearAudioCache, [clearAudioCache]);

  useEffect(
    () => () => {
      narrationAbortRef.current?.abort();
      illustrationAbortRef.current?.abort();
    },
    [],
  );
  const responsesQuery = useQuery({
    queryKey: ['classroom-responses', classroom.course_id],
    queryFn: () => getClassroomResponses(classroom.course_id),
    retry: false,
    staleTime: 30_000,
  });

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

  if (!scene) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-20 text-center'>
        <p className='font-display text-3xl text-chalk'>这间课堂还没有场景。</p>
      </div>
    );
  }

  const progress = scenes.length > 0 ? ((sceneIndex + 1) / scenes.length) * 100 : 0;
  const stageLabel = sceneTypeLabels[scene.type];
  const sceneRecords = (responsesQuery.data?.responses ?? []).filter(
    (record) => record.scene_id === scene.id,
  );
  const quizResults: ClassroomResult[] = sceneRecords
    .filter((record) => record.kind === 'question')
    .map((record) => ({
      target_id: record.target_id,
      kind: 'question',
      score: record.score,
      max_score: record.max_score,
      correct: record.correct,
      reference_answer: [],
      analysis: null,
    }));
  const completedTasks: Record<string, boolean> = {};
  for (const record of sceneRecords) {
    if (record.kind === 'microtask' && record.correct) {
      completedTasks[record.target_id] = true;
    }
  }
  const revealTargets = scene.actions
    .filter(
      (action) => action.type === 'reveal' && typeof action.elementId === 'string',
    )
    .map((action) => action.elementId as string);
  const hiddenElementIds =
    playback.revealed === null
      ? []
      : revealTargets.filter((id) => !playback.revealed?.includes(id));
  const responseKey = responsesQuery.isFetched ? 'ready' : 'loading';
  const currentIllustration = isSlideContent(scene.content)
    ? scene.content.illustration
    : null;

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
              onClick={() => setSceneIndex((index) => Math.max(index - 1, 0))}
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
                    setSceneIndex(Number(event.target.value) - 1)
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

      <div className='space-y-5 xl:sticky xl:top-[84px] xl:self-start'>
        <NarrationPanel
          scene={scene}
          classroom={classroom}
          liveSpeech={playback.speech}
          hasAudio={playback.audioAvailable}
          busy={narrationMutation.isLoading}
          progress={narrationProgress}
          onGenerateScene={() => narrationMutation.mutate(scene.id)}
          onGenerateAll={() => narrationMutation.mutate(undefined)}
        />
        {isSlideContent(scene.content) ? (
          <IllustrationPanel
            illustration={currentIllustration}
            busy={illustrationMutation.isLoading}
            progress={illustrationProgress}
            onGenerateScene={() => illustrationMutation.mutate(scene.id)}
            onGenerateAll={() => illustrationMutation.mutate(undefined)}
          />
        ) : null}
      </div>
    </div>
  );
}
