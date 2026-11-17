'use client';

import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ProviderConfig } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { providerStatus } from '@/lib/utils/provider-status';

export function ProviderList({
  providers,
  selectedId,
  onSelect,
}: {
  providers: ProviderConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className='paper-card p-3 sm:p-4'>
      <div className='flex items-center justify-between px-2 pb-3 pt-1'>
        <p className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
          {providers.length} providers
        </p>
        <ShieldCheck className='h-3.5 w-3.5 text-sage' strokeWidth={1.6} />
      </div>
      <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-1'>
        {providers.map((provider) => {
          const status = providerStatus(provider);
          const active = provider.id === selectedId;
          return (
            <button
              key={provider.id}
              type='button'
              aria-pressed={active}
              onClick={() => onSelect(provider.id)}
              className={cn(
                'border px-4 py-3 text-left transition-colors',
                active
                  ? 'border-ink/40 bg-ink text-paper'
                  : 'border-ink/10 bg-paper/35 hover:border-ink/25 hover:bg-paper/70',
              )}
            >
              <div className='flex items-start justify-between gap-3'>
                <span className='font-display text-[1.02rem] leading-tight tracking-[-0.02em]'>
                  {provider.label}
                </span>
                {provider.is_default ? (
                  <Badge tone={active ? 'dark' : 'ember'}>使用中</Badge>
                ) : null}
              </div>
              <div className='mt-3 flex items-center gap-2'>
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.dot)} />
                <span
                  className={cn(
                    'font-mono text-[0.5rem] uppercase tracking-[0.14em]',
                    active ? 'text-chalk/55' : 'text-ink/35',
                  )}
                >
                  {status.label}
                </span>
              </div>
              <p
                className={cn(
                  'mt-2 truncate font-mono text-[0.55rem]',
                  active ? 'text-chalk/40' : 'text-ink/30',
                )}
              >
                {provider.api_key_hint ?? provider.default_model}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
