'use client';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { Asset, AssetDetail } from '@/lib/api/types';
import { assetStatusLabel, formatBytes, formatFileKind } from '@/lib/utils/format';

export function AssetDetailDialog({
  open,
  asset,
  loading,
  error,
  onClose,
  onDownload,
}: {
  open: boolean;
  asset: AssetDetail | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onDownload: (asset: Asset) => void;
}) {
  return (
  <Dialog
    open={open}
    onClose={() => onClose()}
    title={asset?.filename ?? '素材详情'}
    description={
      asset
        ? `${formatFileKind(asset.extension)} · ${formatBytes(asset.size_bytes)} · ${asset.folder_name ?? '未归档'}`
        : '正在读取解析结果…'
    }
    size='lg'
    footer={
      asset ? (
        <>
          <Button variant='outline' onClick={() => onClose()}>
            关闭
          </Button>
          <Button variant='primary' onClick={() => onDownload(asset)}>
            <Download className='h-3.5 w-3.5' />
            下载原文件
          </Button>
        </>
      ) : null
    }
  >
    {loading ? (
      <div className='flex min-h-[12rem] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-ember' />
      </div>
    ) : error ? (
      <p className='py-8 text-center text-sm text-ember'>素材详情加载失败。</p>
    ) : asset ? (
      <div className='space-y-5'>
        <div className='grid grid-cols-2 gap-3 border border-ink/10 bg-paper/40 p-4 sm:grid-cols-4'>
          <div>
            <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Chars</p>
            <p className='mt-1 text-sm text-ink/65'>{asset.char_count.toLocaleString()}</p>
          </div>
          <div>
            <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Pages</p>
            <p className='mt-1 text-sm text-ink/65'>{asset.page_count ?? '—'}</p>
          </div>
          <div>
            <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Course</p>
            <p className='mt-1 truncate text-sm text-ink/65'>{asset.course_title ?? '—'}</p>
          </div>
          <div>
            <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Status</p>
            <p className='mt-1 text-sm text-ink/65'>{assetStatusLabel(asset.extraction_status)}</p>
          </div>
        </div>
        {asset.truncated ? (
          <p className='border-l-2 border-ochre/60 bg-ochre/[0.07] px-3 py-2 text-xs text-ink/45'>
            解析文本超过上限，已截断展示与索引。
          </p>
        ) : null}
        {asset.extraction_error ? (
          <p className='border-l-2 border-ember/60 bg-ember/[0.05] px-3 py-2 text-xs text-ember'>
            {asset.extraction_error}
          </p>
        ) : null}
        <div>
          <p className='rule-label'>Extracted text / 解析文本</p>
          <pre className='mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap border border-ink/10 bg-white/35 p-4 font-sans text-xs leading-6 text-ink/55'>
            {asset.text_preview || '这份文件没有可提取的文本。'}
          </pre>
        </div>
        {asset.sections.length > 0 ? (
          <div>
            <p className='rule-label'>Source locators / 来源定位</p>
            <div className='mt-3 space-y-2'>
              {asset.sections.slice(0, 12).map((section, index) => (
                <div key={`${section.locator.kind}-${index}`} className='border border-ink/10 bg-paper/35 p-3'>
                  <p className='font-mono text-[0.48rem] uppercase tracking-[0.12em] text-ember/75'>
                    {section.locator.label ?? section.locator.kind}
                  </p>
                  <p className='mt-2 line-clamp-3 text-xs leading-5 text-ink/45'>{section.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    ) : null}
  </Dialog>
  );
}
