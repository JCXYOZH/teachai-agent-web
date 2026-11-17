'use client';

import {
  CheckCircle2,
  Loader2,
  PlugZap,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';

import { ProviderEditorFields } from '@/components/providers/provider-editor-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { ProviderConfig } from '@/lib/api/types';
import { useProviderEditor } from '@/lib/hooks/use-provider-editor';
import { cn } from '@/lib/utils/cn';
import { errorMessage } from '@/lib/utils/errors';
import { formatDate } from '@/lib/utils/format';
import { providerStatus } from '@/lib/utils/provider-status';

export function ProviderEditor({ provider }: { provider: ProviderConfig }) {
  const editor = useProviderEditor(provider);
  const {
    deleteOpen,
    setDeleteOpen,
    deleteMutation,
    saveMutation,
    testMutation,
    testResult,
    handleSave,
    handleTest,
  } = editor;
  const status = providerStatus(provider);
  const protocolLabel =
    provider.protocol === 'anthropic' ? 'Anthropic Messages' : 'OpenAI compatible';

  return (
    <div className='paper-card p-6 sm:p-8'>
      <div className='flex flex-wrap items-start justify-between gap-5'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge tone={provider.protocol === 'anthropic' ? 'ember' : 'neutral'}>
              {protocolLabel}
            </Badge>
            <Badge tone={provider.is_default ? 'ember' : 'neutral'}>
              {provider.is_default ? '使用中' : status.label}
            </Badge>
          </div>
          <h3 className='mt-4 font-display text-3xl font-medium tracking-[-0.035em] text-ink'>
            {provider.label}
          </h3>
          <p className='mt-2 max-w-xl text-sm leading-6 text-ink/45'>
            {provider.description}
          </p>
        </div>
        <div className='shrink-0 text-left sm:text-right'>
          <p className='font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/30'>
            Last save
          </p>
          <p className='mt-2 font-mono text-[0.62rem] text-ink/50'>
            {provider.updated_at ? formatDate(provider.updated_at) : '尚未保存'}
          </p>
          <span className='mt-3 inline-flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/35'>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
        </div>
      </div>

      <ProviderEditorFields provider={provider} editor={editor} />

      <div className='mt-6 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:flex-wrap sm:items-center'>
        <Button onClick={handleSave} disabled={saveMutation.isLoading}>
          {saveMutation.isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Save className='h-4 w-4' />
          )}
          保存配置
        </Button>
        <Button
          variant='outline'
          onClick={handleTest}
          disabled={testMutation.isLoading}
        >
          {testMutation.isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <PlugZap className='h-4 w-4' />
          )}
          {testMutation.isLoading ? '测试中…' : '测试连接'}
        </Button>
        {provider.configured ? (
          <Button
            variant='ghost'
            className='text-ember-dark hover:bg-ember/10 sm:ml-auto'
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isLoading}
          >
            <Trash2 className='h-4 w-4' />
            删除配置
          </Button>
        ) : null}
      </div>

      {saveMutation.isError ? (
        <p role='alert' className='mt-4 border-l-2 border-ember bg-ember/[0.05] px-4 py-3 text-xs text-ember-dark'>
          {errorMessage(saveMutation.error, 'Provider 配置保存失败')}
        </p>
      ) : null}

      {testMutation.isError ? (
        <div
          role='alert'
          className='mt-4 border-l-2 border-ember bg-ember/[0.05] px-4 py-3'
        >
          <p className='flex items-center gap-2 text-xs font-medium text-ember-dark'>
            <XCircle className='h-4 w-4' />
            测试请求未完成
          </p>
          <p className='mt-1 text-[0.7rem] leading-5 text-ink/45'>
            {errorMessage(testMutation.error, '连接测试失败')}
          </p>
        </div>
      ) : testResult ? (
        <div
          role='status'
          className={cn(
            'mt-4 border-l-2 px-4 py-3',
            testResult.success
              ? 'border-sage bg-sage/10'
              : 'border-ember bg-ember/[0.05]',
          )}
        >
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            {testResult.success ? (
              <CheckCircle2 className='h-4 w-4 text-sage' />
            ) : (
              <XCircle className='h-4 w-4 text-ember' />
            )}
            <p
              className={cn(
                'text-xs font-medium',
                testResult.success ? 'text-ink/70' : 'text-ember-dark',
              )}
            >
              {testResult.success ? '连接成功' : '连接失败'}
            </p>
            <span className='font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/35'>
              {testResult.latency_ms} ms
            </span>
            <span className='font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/35'>
              model {testResult.model}
            </span>
          </div>
          <p className='mt-2 text-[0.7rem] leading-5 text-ink/45'>
            {testResult.message}
          </p>
          {testResult.models.length > 0 ? (
            <details className='mt-3'>
              <summary className='cursor-pointer font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/35'>
                发现 {testResult.models.length} 个模型
              </summary>
              <div className='mt-2 flex flex-wrap gap-1.5'>
                {testResult.models.slice(0, 12).map((name) => (
                  <span
                    key={name}
                    className='border border-ink/10 bg-paper/60 px-2 py-1 font-mono text-[0.55rem] text-ink/45'
                  >
                    {name}
                  </span>
                ))}
                {testResult.models.length > 12 ? (
                  <span className='px-2 py-1 font-mono text-[0.55rem] text-ink/30'>
                    +{testResult.models.length - 12}
                  </span>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='删除 Provider 配置？'
        description={`将移除 ${provider.label} 已保存的密钥、Base URL 与默认模型设置。`}
        footer={
          <>
            <Button
              variant='outline'
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isLoading}
            >
              取消
            </Button>
            <Button
              variant='ember'
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
              删除配置
            </Button>
          </>
        }
      >
        <div className='border-l-2 border-ember/60 bg-ember/[0.04] px-4 py-3 text-xs leading-6 text-ink/55'>
          删除后，如果存在对应的环境变量，会自动回退使用；不会影响其他 Provider 或已上传素材。
        </div>
      </Dialog>
    </div>
  );
}
