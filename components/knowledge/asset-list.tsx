'use client';

import { Download, Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Asset } from '@/lib/api/types';
import { fileIcon } from '@/lib/utils/asset-files';
import { cn } from '@/lib/utils/cn';
import {
  assetStatusLabel,
  formatBytes,
  formatDate,
  formatFileKind,
} from '@/lib/utils/format';

export function AssetList({
  assets,
  total,
  isSearchActive,
  isLoading,
  isError,
  onRetry,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}: {
  assets: Asset[];
  total: number;
  isSearchActive: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPreview: (id: string) => void;
  onDownload: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  return (
    <>
      <div className='flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5'>
      <p className='rule-label flex-1'>
        {isSearchActive ? 'Search results / 检索结果' : 'All sources / 全部素材'}
      </p>
      <span className='ml-4 font-mono text-[0.48rem] uppercase tracking-[0.12em] text-ink/25'>
        {String(total).padStart(2, '0')} items
      </span>
    </div>

    {isError ? (
      <div className='px-5 py-10 text-center'>
        <p className='text-sm text-ink/50'>素材加载失败，请检查后端服务。</p>
        <Button variant='outline' size='sm' className='mt-4' onClick={() => onRetry()}>
          重新加载
        </Button>
      </div>
    ) : isLoading ? (
      <div className='space-y-px p-4 sm:p-5'>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className='h-20 animate-pulse border border-ink/5 bg-paper/55' />
        ))}
      </div>
    ) : assets.length > 0 ? (
      <div>
        <div className='hidden grid-cols-[minmax(0,1fr)_7rem_8rem_7.5rem] gap-4 border-b border-ink/10 px-5 py-3 font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25 md:grid'>
          <span>Name</span>
          <span>Status</span>
          <span>Filed / 归位</span>
          <span className='text-right'>Actions</span>
        </div>
        <div className='divide-y divide-ink/10'>
          {assets.map((asset) => {
            const Icon = fileIcon(asset.extension);
            return (
              <article
                key={asset.id}
                className='group grid gap-3 px-4 py-4 transition-colors hover:bg-paper/45 sm:px-5 md:grid-cols-[minmax(0,1fr)_7rem_8rem_7.5rem] md:items-center md:gap-4'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <span className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-ink/10 bg-paper/65 text-ink/40'>
                    <Icon className='h-4 w-4' strokeWidth={1.5} />
                  </span>
                  <div className='min-w-0'>
                    <button
                      type='button'
                      onClick={() => onPreview(asset.id)}
                      className='block max-w-full truncate text-left text-sm text-ink/80 transition-colors hover:text-ember'
                    >
                      {asset.filename}
                    </button>
                    {asset.excerpt ? (
                      <p className='mt-1 line-clamp-2 text-[0.68rem] leading-5 text-ink/35'>{asset.excerpt}</p>
                    ) : (
                      <p className='mt-1 truncate font-mono text-[0.52rem] uppercase tracking-[0.1em] text-ink/25'>
                        {formatFileKind(asset.extension)} · {formatBytes(asset.size_bytes)}
                        {asset.page_count ? ` · ${asset.page_count} 页` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2 md:block'>
                  <span
                    className={cn(
                      'inline-flex border px-2 py-1 font-mono text-[0.48rem] uppercase tracking-[0.12em]',
                      asset.extraction_status === 'ready'
                        ? 'border-sage/40 bg-sage/10 text-ink/55'
                        : 'border-ochre/30 bg-ochre/10 text-ink/45',
                    )}
                  >
                    {assetStatusLabel(asset.extraction_status)}
                  </span>
                </div>

                <div className='min-w-0 text-[0.68rem] leading-5 text-ink/40'>
                  <p className='truncate'>{asset.folder_name ?? '未归档'}</p>
                  <p className='truncate text-ink/25'>{asset.course_title ?? formatDate(asset.updated_at)}</p>
                </div>

                <div className='flex items-center gap-0.5 md:justify-end'>
                  <button
                    type='button'
                    onClick={() => onPreview(asset.id)}
                    className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                    aria-label={`预览 ${asset.filename}`}
                  >
                    <Eye className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onDownload(asset)}
                    className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                    aria-label={`下载 ${asset.filename}`}
                  >
                    <Download className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onEdit(asset)}
                    className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                    aria-label={`整理 ${asset.filename}`}
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onDelete(asset)}
                    className='flex h-8 w-8 items-center justify-center text-ink/25 transition-colors hover:bg-ember/[0.06] hover:text-ember'
                    aria-label={`删除 ${asset.filename}`}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {total > assets.length ? (
          <p className='border-t border-ink/10 px-5 py-3 text-[0.65rem] text-ink/30'>
            当前展示最近 {assets.length} 份素材，共 {total} 份。
          </p>
        ) : null}
      </div>
    ) : (
      <div className='notebook-rule flex min-h-[16rem] flex-col items-center justify-center border-t border-ink/10 px-5 text-center'>
        <p className='font-display text-xl text-ink/55'>
          {isSearchActive ? '没有找到匹配的文件' : '第一份材料，会放在这里'}
        </p>
        <p className='mt-2 max-w-sm text-xs leading-6 text-ink/35'>
          {isSearchActive
            ? '尝试更短的关键词，或切换文件夹与课程范围。'
            : '上传后会自动提取文本与页码。原文件存放在服务端受控目录，解析文本写入数据库，课程引用会保留来源位置。'}
        </p>
      </div>
    )}
    </>
  );
}
