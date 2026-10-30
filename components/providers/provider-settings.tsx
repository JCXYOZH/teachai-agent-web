'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Globe2,
  KeyRound,
  Loader2,
  PlugZap,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import {
  deleteProviderConfig,
  listProviders,
  testProvider,
  updateProviderConfig,
} from '@/lib/api/providers';
import type {
  ProviderConfig,
  ProviderConfigUpdate,
  ProviderTestRequest,
  ProviderTestResponse,
} from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function providerStatus(provider: ProviderConfig): { label: string; dot: string } {
  if (provider.api_key_source === 'environment') {
    return { label: '环境变量', dot: 'bg-ochre' };
  }
  if (provider.configured) {
    return { label: '已保存配置', dot: 'bg-sage' };
  }
  if (provider.api_key_configured) {
    return { label: '可用', dot: 'bg-sage' };
  }
  if (!provider.requires_api_key) {
    return { label: '本地端点', dot: 'bg-sage' };
  }
  return { label: '未配置', dot: 'bg-ink/20' };
}

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
                const active = provider.id === selected.id;
                return (
                  <button
                    key={provider.id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setSelectedId(provider.id)}
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
                        <Badge tone={active ? 'dark' : 'ember'}>默认</Badge>
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

          <ProviderEditor
            key={`${selected.id}:${selected.updated_at ?? 'unsaved'}`}
            provider={selected}
          />
        </div>
      ) : null}
    </section>
  );
}

function ProviderEditor({ provider }: { provider: ProviderConfig }) {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(provider.base_url);
  const [model, setModel] = useState(provider.default_model);
  const [isDefault, setIsDefault] = useState(provider.is_default);
  const [clearApiKey, setClearApiKey] = useState(false);
  const [ttsBaseUrl, setTtsBaseUrl] = useState(provider.tts_base_url ?? '');
  const [ttsModel, setTtsModel] = useState(provider.tts_model ?? '');
  const [ttsVoice, setTtsVoice] = useState(provider.tts_voice ?? '');
  const [clearTts, setClearTts] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [testResult, setTestResult] = useState<ProviderTestResponse | null>(null);

  const suggestions = useMemo(() => {
    const values = [
      ...provider.default_models,
      ...(testResult?.model ? [testResult.model] : []),
      ...(testResult?.models ?? []),
    ];
    return Array.from(new Set(values.filter(Boolean))).slice(0, 40);
  }, [provider.default_models, testResult]);

  const applyUpdatedProvider = (updated: ProviderConfig) => {
    queryClient.setQueryData<ProviderConfig[]>(['providers'], (current) =>
      current?.map((item) => {
        if (item.id === updated.id) {
          return updated;
        }
        if (updated.is_default && item.is_default) {
          return { ...item, is_default: false };
        }
        return item;
      }) ?? [updated],
    );
    void queryClient.invalidateQueries({ queryKey: ['providers'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: ProviderConfigUpdate) =>
      updateProviderConfig(provider.id, payload),
    onSuccess: (updated) => {
      applyUpdatedProvider(updated);
      setApiKey('');
      setClearApiKey(false);
      setBaseUrl(updated.base_url);
      setModel(updated.default_model);
      setIsDefault(updated.is_default);
      setTtsBaseUrl(updated.tts_base_url ?? '');
      setTtsModel(updated.tts_model ?? '');
      setTtsVoice(updated.tts_voice ?? '');
      setClearTts(false);
      setTestResult(null);
      toast.success(`${updated.label} 配置已保存`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Provider 配置保存失败'));
    },
  });

  const testMutation = useMutation({
    mutationFn: (payload: ProviderTestRequest) => testProvider(provider.id, payload),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        toast.success(`连接成功 · ${result.model}`);
      } else {
        toast.error('连接测试未通过');
      }
    },
    onError: (error) => {
      setTestResult(null);
      toast.error(errorMessage(error, '连接测试失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProviderConfig(provider.id),
    onSuccess: () => {
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider 配置已删除，已回退到环境变量或默认值');
    },
    onError: (error) => {
      toast.error(errorMessage(error, '删除 Provider 配置失败'));
    },
  });

  const handleSave = () => {
    const payload: ProviderConfigUpdate = {
      base_url: baseUrl.trim() || null,
      default_model: model.trim() || null,
      is_default: isDefault,
    };
    if (apiKey.trim()) {
      payload.api_key = apiKey.trim();
    } else if (clearApiKey) {
      payload.clear_api_key = true;
    }
    if (provider.supports_tts) {
      if (clearTts) {
        payload.clear_tts = true;
      } else {
        payload.tts_base_url = ttsBaseUrl.trim() || null;
        payload.tts_model = ttsModel.trim() || null;
        payload.tts_voice = ttsVoice.trim() || null;
      }
    }
    saveMutation.mutate(payload);
  };

  const handleTest = () => {
    const payload: ProviderTestRequest = {};
    if (apiKey.trim()) {
      payload.api_key = apiKey.trim();
    }
    if (baseUrl.trim()) {
      payload.base_url = baseUrl.trim();
    }
    if (model.trim()) {
      payload.default_model = model.trim();
    }
    setTestResult(null);
    testMutation.mutate(payload);
  };

  const status = providerStatus(provider);
  const protocolLabel =
    provider.protocol === 'anthropic' ? 'Anthropic Messages' : 'OpenAI compatible';
  const keyPlaceholder = provider.api_key_configured
    ? `已保存 ${provider.api_key_hint ?? '****'}，留空保持不变`
    : provider.requires_api_key
      ? 'sk-...'
      : '本地端点可选';

  return (
    <div className='paper-card p-6 sm:p-8'>
      <div className='flex flex-wrap items-start justify-between gap-5'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge tone={provider.protocol === 'anthropic' ? 'ember' : 'neutral'}>
              {protocolLabel}
            </Badge>
            <Badge tone={provider.is_default ? 'ember' : 'neutral'}>
              {provider.is_default ? 'Default' : status.label}
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

      <div className='mt-7 space-y-6 border-t border-ink/10 pt-6'>
        <div>
          <div className='flex items-center justify-between gap-3'>
            <label htmlFor='provider-api-key' className='text-xs text-ink/60'>
              API Key
            </label>
            {provider.api_key_source === 'environment' ? (
              <Badge tone='sage'>环境变量</Badge>
            ) : provider.api_key_configured ? (
              <Badge tone='sage'>已保存</Badge>
            ) : (
              <Badge>未配置</Badge>
            )}
          </div>
          <div className='relative mt-2'>
            <Input
              id='provider-api-key'
              type='password'
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                if (event.target.value) {
                  setClearApiKey(false);
                }
              }}
              placeholder={keyPlaceholder}
              autoComplete='new-password'
              spellCheck={false}
              disabled={clearApiKey}
              className='pr-11 font-mono text-[0.82rem]'
            />
            <KeyRound className='pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/25' />
          </div>
          <p className='mt-2 text-[0.68rem] leading-5 text-ink/35'>
            {provider.api_key_source === 'environment'
              ? '当前密钥来自环境变量；在此保存的密钥会优先使用。'
              : provider.api_key_configured
                ? `已保存 ${provider.api_key_hint ?? '****'}，不会回填真实密钥。`
                : provider.requires_api_key
                  ? '可通过环境变量提供，或在此保存到当前账号。'
                  : '本地 llama-server 使用 --api-key 启动时再填写。'}
          </p>
          {provider.api_key_source === 'user' ? (
            <label className='mt-3 flex cursor-pointer items-center gap-2 text-[0.68rem] text-ink/45'>
              <input
                type='checkbox'
                checked={clearApiKey}
                onChange={(event) => {
                  setClearApiKey(event.target.checked);
                  if (event.target.checked) {
                    setApiKey('');
                  }
                }}
                className='h-3.5 w-3.5 accent-ember'
              />
              删除已保存的 API Key
            </label>
          ) : null}
        </div>

        <div>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <label htmlFor='provider-base-url' className='text-xs text-ink/60'>
              Base URL
            </label>
            <button
              type='button'
              onClick={() => setBaseUrl(provider.default_base_url)}
              className='inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/35 transition-colors hover:text-ember-dark'
            >
              <RotateCcw className='h-3 w-3' />
              恢复默认
            </button>
          </div>
          <div className='mt-2 flex flex-col gap-2 sm:flex-row sm:items-end'>
            <Input
              id='provider-base-url'
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              inputMode='url'
              spellCheck={false}
              className='font-mono text-[0.78rem]'
            />
            <span className='hidden shrink-0 pb-3 text-ink/20 sm:block'>
              <Globe2 className='h-4 w-4' />
            </span>
          </div>
          <p className='mt-2 break-all font-mono text-[0.58rem] text-ink/30'>
            默认 {provider.default_base_url}
          </p>
          {provider.alternate_base_urls.length > 0 ? (
            <p className='mt-1 break-all font-mono text-[0.55rem] text-ink/25'>
              备用 {provider.alternate_base_urls.join(' · ')}
            </p>
          ) : null}
        </div>

        <div className='grid gap-5 sm:grid-cols-2'>
          <div>
            <label htmlFor='provider-model' className='text-xs text-ink/60'>
              默认模型
            </label>
            <Input
              id='provider-model'
              list='provider-model-options'
              value={model}
              onChange={(event) => setModel(event.target.value)}
              spellCheck={false}
              className='mt-2 font-mono text-[0.82rem]'
            />
            <datalist id='provider-model-options'>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <p className='mt-2 text-[0.64rem] leading-5 text-ink/30'>
              可输入模型 ID，或从建议与最近一次测试结果中选择。
            </p>
          </div>
          <label className='flex cursor-pointer items-start gap-3 border border-ink/10 bg-paper/30 p-4'>
            <input
              type='checkbox'
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              className='mt-1 h-4 w-4 accent-ember'
            />
            <span>
              <span className='block text-xs text-ink/65'>设为默认 Provider</span>
              <span className='mt-1 block text-[0.68rem] leading-5 text-ink/35'>
                大纲生成与后续课堂内容会优先使用它。
              </span>
            </span>
          </label>
        </div>

        {provider.supports_tts ? (
          <div className='border-t border-ink/10 pt-5'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='flex items-center gap-2 text-xs text-ink/65'>
                <Volume2 className='h-3.5 w-3.5 text-ember' strokeWidth={1.6} />
                旁白语音（TTS）
              </p>
              <span className='font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/30'>
                {provider.tts_effective_model ?? 'not configured'} ·{' '}
                {provider.tts_effective_voice ?? 'default voice'}
              </span>
            </div>
            <div className='mt-3 grid gap-4 sm:grid-cols-3'>
              <div>
                <label htmlFor='provider-tts-model' className='text-xs text-ink/60'>
                  TTS 模型
                </label>
                <Input
                  id='provider-tts-model'
                  list='provider-tts-model-options'
                  value={ttsModel}
                  onChange={(event) => setTtsModel(event.target.value)}
                  placeholder={provider.tts_effective_model ?? provider.tts_models[0] ?? ''}
                  spellCheck={false}
                  disabled={clearTts}
                  className='mt-2 font-mono text-[0.82rem]'
                />
                <datalist id='provider-tts-model-options'>
                  {provider.tts_models.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor='provider-tts-voice' className='text-xs text-ink/60'>
                  音色
                </label>
                <Input
                  id='provider-tts-voice'
                  list='provider-tts-voice-options'
                  value={ttsVoice}
                  onChange={(event) => setTtsVoice(event.target.value)}
                  placeholder={provider.tts_effective_voice ?? provider.tts_voices[0] ?? ''}
                  spellCheck={false}
                  disabled={clearTts}
                  className='mt-2 font-mono text-[0.82rem]'
                />
                <datalist id='provider-tts-voice-options'>
                  {provider.tts_voices.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor='provider-tts-base-url' className='text-xs text-ink/60'>
                  TTS Base URL
                </label>
                <Input
                  id='provider-tts-base-url'
                  value={ttsBaseUrl}
                  onChange={(event) => setTtsBaseUrl(event.target.value)}
                  placeholder={provider.tts_effective_base_url ?? provider.base_url}
                  inputMode='url'
                  spellCheck={false}
                  disabled={clearTts}
                  className='mt-2 font-mono text-[0.72rem]'
                />
              </div>
            </div>
            <p className='mt-2 text-[0.66rem] leading-5 text-ink/35'>
              留空则使用默认值。旁白按场景合成并缓存到资产目录，重复文本不会重复计费。
            </p>
            {provider.tts_model || provider.tts_base_url || provider.tts_voice ? (
              <label className='mt-3 flex cursor-pointer items-center gap-2 text-[0.68rem] text-ink/45'>
                <input
                  type='checkbox'
                  checked={clearTts}
                  onChange={(event) => setClearTts(event.target.checked)}
                  className='h-3.5 w-3.5 accent-ember'
                />
                清除 TTS 覆盖（恢复默认模型与音色）
              </label>
            ) : null}
          </div>
        ) : null}

        {provider.id === 'qwen' ? (
          <div className='border-l-2 border-ochre/70 bg-ochre/[0.06] px-4 py-3 text-[0.7rem] leading-6 text-ink/50'>
            DashScope 官方地址与自建 MaaS 兼容地址均可填写。模型{' '}
            <code className='font-mono text-[0.68rem] text-ink/65'>
              qwen3.8-omni-flash
            </code>{' '}
            仅支持文本输出；连接测试会真实发起一次文本 chat completion。
          </div>
        ) : provider.id === 'llama-local' ? (
          <div className='border-l-2 border-sage/70 bg-sage/10 px-4 py-3 text-[0.7rem] leading-6 text-ink/50'>
            本地端点不走公网；连接测试会直接请求 llama-server 的模型列表与 chat completion。
          </div>
        ) : null}
      </div>

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
