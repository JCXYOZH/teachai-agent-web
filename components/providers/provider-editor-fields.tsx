'use client';

import { Globe2, KeyRound, RotateCcw, Volume2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { ProviderConfig } from '@/lib/api/types';
import type { ProviderEditorState } from '@/lib/hooks/use-provider-editor';
import { cn } from '@/lib/utils/cn';

export function ProviderEditorFields({
  provider,
  editor,
}: {
  provider: ProviderConfig;
  editor: ProviderEditorState;
}) {
  const {
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    isDefault,
    setIsDefault,
    clearApiKey,
    setClearApiKey,
    ttsBaseUrl,
    setTtsBaseUrl,
    ttsModel,
    setTtsModel,
    ttsVoice,
    setTtsVoice,
    clearTts,
    setClearTts,
    suggestions,
  } = editor;

  const keyPlaceholder =
    provider.api_key_configured && provider.api_key_readable === false
      ? '已保存的密钥无法解密，请填写新的 API Key'
      : provider.api_key_configured
        ? `已保存 ${provider.api_key_hint ?? '****'}，留空保持不变`
        : provider.requires_api_key
          ? 'sk-...'
          : '本地端点可选';

  return (
    <div className='mt-7 space-y-6 border-t border-ink/10 pt-6'>
      <div>
        <div className='flex items-center justify-between gap-3'>
          <label htmlFor='provider-api-key' className='text-xs text-ink/60'>
            API Key
          </label>
          {provider.api_key_source === 'environment' ? (
            <Badge tone='sage'>环境变量</Badge>
          ) : provider.api_key_configured && provider.api_key_readable === false ? (
            <Badge tone='ember'>密钥失效</Badge>
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
        <p
          className={cn(
            'mt-2 text-[0.68rem] leading-5',
            provider.api_key_configured && provider.api_key_readable === false
              ? 'text-ember-dark'
              : 'text-ink/35',
          )}
        >
          {provider.api_key_configured && provider.api_key_readable === false
            ? '已保存的密钥无法解密（服务端加密密钥已变更）。请在上方的 API Key 输入框重新填写并保存。'
            : provider.api_key_source === 'environment'
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
            <span className='block text-xs text-ink/65'>使用当前模型</span>
            <span className='mt-1 block text-[0.68rem] leading-5 text-ink/35'>
              勾选并保存后，大纲与课堂生成会改用这家配置（同时只能有一家生效）。
              不勾选则仅保存配置信息，生成仍使用本地 Qwen3.6-35B-A3B。
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
  );
}
