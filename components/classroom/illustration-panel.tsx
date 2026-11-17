'use client';

import { ImagePlus, Loader2 } from 'lucide-react';

import type { ClassroomIllustration } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const ILLUSTRATION_PROVIDERS = [
  { value: '', label: 'Auto · Qwen → fallback' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'pollinations', label: 'Pollinations (free)' },
  { value: 'huggingface', label: 'HuggingFace' },
  { value: 'cloudflare', label: 'Cloudflare' },
];

export function IllustrationPanel({
  illustration,
  busy,
  progress,
  provider,
  onProviderChange,
  onGenerateScene,
  onGenerateAll,
  className,
}: {
  illustration?: ClassroomIllustration | null;
  busy: boolean;
  progress: { message: string; progress: number } | null;
  provider: string;
  onProviderChange: (value: string) => void;
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
          {ready && illustration?.quality ? (
            <p
              className={cn(
                'mt-1 font-mono text-[0.44rem] uppercase tracking-[0.12em]',
                illustration.quality.status === 'low'
                  ? 'text-ember/80'
                  : 'text-sage/70',
              )}
            >
              Quality {illustration.quality.score}/100
            </p>
          ) : null}
          {ready && illustration?.quality?.status === 'low' ? (
            <div className='mt-2'>
              <p className='text-[0.7rem] leading-5 text-ember/75'>
                本页配图质量偏低，建议重新生成。
              </p>
              {(illustration?.quality?.vlm?.issues?.length ?? 0) > 0 ? (
                <ul className='mt-1 list-disc space-y-0.5 pl-4 text-[0.68rem] leading-5 text-ember/60'>
                  {(illustration?.quality?.vlm?.issues ?? []).slice(0, 3).map((issue, index) => (
                    <li key={`${index}-${issue}`}>{issue}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <label className='mt-4 flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/40'>
        Provider
        <select
          aria-label='Illustration provider'
          value={provider}
          disabled={busy}
          onChange={(event) => onProviderChange(event.target.value)}
          className='h-7 flex-1 border border-chalk/15 bg-classroom px-2 text-[0.55rem] text-chalk/70 focus:border-ember/40 focus:outline-none'
        >
          {ILLUSTRATION_PROVIDERS.map((option) => (
            <option key={option.value || 'auto'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {provider === 'huggingface' || provider === 'cloudflare' ? (
        <p className='mt-1 font-mono text-[0.44rem] uppercase tracking-[0.12em] text-chalk/30'>
          需服务端已配置对应 Token，否则任务会失败
        </p>
      ) : null}

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
