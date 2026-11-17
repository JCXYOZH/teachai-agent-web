'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ProviderEditor } from '@/components/providers/provider-editor';
import { ProviderList } from '@/components/providers/provider-list';
import { Button } from '@/components/ui/button';
import { listProviders } from '@/lib/api/providers';
import { errorMessage } from '@/lib/utils/errors';

export function ProviderSettings() {
  const providersQuery = useQuery({
    queryKey: ['providers'],
    queryFn: listProviders,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const selected = useMemo(() => {
    if (providers.length === 0) {
      return null;
    }
    return (
      providers.find((provider) => provider.id === selectedId) ??
      providers.find((provider) => provider.is_default) ??
      providers.find((provider) => provider.id === 'llama-local') ??
      providers[0]
    );
  }, [providers, selectedId]);

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='eyebrow'>Providers / 模型接入</p>
          <h2 className='mt-3 font-display text-display-md font-normal text-ink'>
            选择谁来讲这堂课
          </h2>
          <p className='mt-3 max-w-md text-[0.72rem] leading-5 text-ink/40'>
            生成默认使用本地 Qwen3.6-35B-A3B。只有在这里勾选「使用当前模型」并保存后，
            大纲与课堂生成才会改用该配置；不勾选则只保存配置信息。
          </p>
        </div>
        <p className='max-w-sm text-right text-[0.68rem] leading-5 text-ink/35'>
          每份配置只属于当前账号。密钥加密保存，接口仅回传末四位掩码。
        </p>
      </div>

      {providersQuery.isLoading ? (
        <div className='paper-card flex items-center gap-3 p-8 text-sm text-ink/45'>
          <Loader2 className='h-4 w-4 animate-spin text-ember' />
          正在读取 Provider 配置…
        </div>
      ) : providersQuery.isError ? (
        <div className='paper-card p-6 sm:p-8'>
          <p role='alert' className='text-sm text-ember-dark'>
            {errorMessage(providersQuery.error, 'Provider 配置暂时无法读取')}
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={() => providersQuery.refetch()}
          >
            <RotateCcw className='h-3.5 w-3.5' />
            重新读取
          </Button>
        </div>
      ) : selected ? (
        <div className='grid gap-5 lg:grid-cols-[minmax(235px,0.68fr)_minmax(0,1.32fr)]'>
          <ProviderList
            providers={providers}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />

          <ProviderEditor
            key={`${selected.id}:${selected.updated_at ?? 'unsaved'}`}
            provider={selected}
          />
        </div>
      ) : null}
    </section>
  );
}
