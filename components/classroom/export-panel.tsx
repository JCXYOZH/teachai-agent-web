'use client';

import { Download, FileText, Loader2, Presentation, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import type {
  ClassroomExport,
  ClassroomExportFormat,
  ClassroomExportPayload,
} from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { formatBytes } from '@/lib/utils/format';

const formatLabels: Record<ClassroomExportFormat, string> = {
  pptx: 'PPTX',
  html: 'HTML',
};

const formatIcons: Record<ClassroomExportFormat, LucideIcon> = {
  pptx: Presentation,
  html: FileText,
};

const formatHints: Record<ClassroomExportFormat, string> = {
  pptx: 'PowerPoint 可编辑版：配图入页、旁白进备注',
  html: '单文件网页：离线可播放，配图与旁白内联',
};

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 border px-2.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] transition-colors',
        active
          ? 'border-sage/40 bg-sage/10 text-sage-light'
          : 'border-chalk/15 text-chalk/40 hover:border-chalk/30 hover:text-chalk/70',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5', active ? 'bg-sage' : 'bg-chalk/25')}
        aria-hidden='true'
      />
      {label}
    </button>
  );
}

export interface ExportPanelProps {
  exports: ClassroomExport[];
  busy: boolean;
  progress: { message: string; progress: number } | null;
  downloadingFormat: ClassroomExportFormat | null;
  onCreate: (payload: ClassroomExportPayload) => void;
  onDownload: (item: ClassroomExport) => void;
  className?: string;
}

export function ExportPanel({
  exports,
  busy,
  progress,
  downloadingFormat,
  onCreate,
  onDownload,
  className,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ClassroomExportFormat>('pptx');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const readyFormats = exports.map((item) => item.format);

  return (
    <aside
      aria-live='polite'
      aria-label='课堂导出'
      className={cn(
        'border border-chalk/10 bg-classroom/35 p-5 backdrop-blur-sm',
        className,
      )}
    >
      <div className='flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/35'>
        <span>Export</span>
        <span className={exports.length ? 'text-sage' : 'text-chalk/30'}>
          {exports.length ? 'Offline pack ready' : 'No export yet'}
        </span>
      </div>

      <p className='mt-4 text-xs leading-6 text-chalk/60'>
        把整堂课导出为可离线分发的文件，场景、答案与旁白一起带走。
      </p>

      <div className='mt-4 grid grid-cols-2 gap-2' role='group' aria-label='导出格式'>
        {(Object.keys(formatLabels) as ClassroomExportFormat[]).map((key) => {
          const Icon = formatIcons[key];
          const active = format === key;
          return (
            <button
              key={key}
              type='button'
              onClick={() => setFormat(key)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-1.5 border font-mono text-[0.5rem] uppercase tracking-[0.12em] transition-colors',
                active
                  ? 'border-ember/45 bg-ember/10 text-ember'
                  : 'border-chalk/15 text-chalk/45 hover:border-chalk/25 hover:text-chalk',
              )}
            >
              <Icon className='h-3.5 w-3.5' strokeWidth={1.6} />
              {formatLabels[key]}
              {readyFormats.includes(key) ? (
                <span className='h-1 w-1 bg-sage' aria-hidden='true' />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className='mt-2 text-[0.66rem] leading-5 text-chalk/30'>
        {formatHints[format]}
      </p>

      <div className='mt-3 flex flex-wrap gap-2'>
        <ToggleButton
          active={includeImages}
          label='含配图'
          onClick={() => setIncludeImages((value) => !value)}
        />
        <ToggleButton
          active={includeAudio}
          label='含旁白'
          onClick={() => setIncludeAudio((value) => !value)}
        />
      </div>

      <button
        type='button'
        onClick={() =>
          onCreate({
            format,
            include_images: includeImages,
            include_audio: includeAudio,
          })
        }
        disabled={busy}
        className='mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 border border-ember/40 bg-ember/10 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ember transition-colors hover:bg-ember/15 disabled:cursor-default disabled:opacity-40'
      >
        {busy ? (
          <Loader2 className='h-3.5 w-3.5 animate-spin' />
        ) : (
          <Download className='h-3.5 w-3.5' />
        )}
        {busy
          ? 'Exporting'
          : readyFormats.includes(format)
            ? 'Rebuild export'
            : 'Build export'}
      </button>

      {busy ? (
        <p className='mt-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/35'>
          {progress
            ? `${progress.message} · ${progress.progress}%`
            : '等待导出任务…'}
        </p>
      ) : (
        <p className='mt-3 text-[0.66rem] leading-5 text-chalk/30'>
          同格式重复导出会覆盖上一个文件，单文件上限 40 MB。
        </p>
      )}

      {exports.length ? (
        <ul className='mt-4 space-y-2'>
          {exports.map((item) => (
            <li
              key={item.format}
              className='flex items-center gap-2 border border-chalk/10 bg-chalk/[0.025] p-2.5'
            >
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-[0.72rem] leading-5 text-chalk/75'>
                  {item.filename}
                </span>
                <span className='mt-0.5 block font-mono text-[0.44rem] uppercase tracking-[0.12em] text-chalk/30'>
                  {formatLabels[item.format]} · {formatBytes(item.size_bytes)} ·{' '}
                  {item.scene_count} scenes
                </span>
                {item.warnings.length ? (
                  <span className='mt-1 block text-[0.6rem] leading-4 text-ember/70'>
                    {item.warnings[0]}
                  </span>
                ) : null}
              </span>
              <button
                type='button'
                onClick={() => onDownload(item)}
                disabled={downloadingFormat === item.format}
                aria-label={`下载 ${formatLabels[item.format]} 导出文件`}
                className='inline-flex h-8 w-8 shrink-0 items-center justify-center border border-chalk/15 text-chalk/50 transition-colors hover:border-chalk/30 hover:text-chalk disabled:cursor-default disabled:opacity-40'
              >
                {downloadingFormat === item.format ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Download className='h-3.5 w-3.5' />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}