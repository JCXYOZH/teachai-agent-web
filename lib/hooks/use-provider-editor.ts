'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  deleteProviderConfig,
  testProvider,
  updateProviderConfig,
} from '@/lib/api/providers';
import type {
  ProviderConfig,
  ProviderConfigUpdate,
  ProviderTestRequest,
  ProviderTestResponse,
} from '@/lib/api/types';
import { errorMessage } from '@/lib/utils/errors';

export function useProviderEditor(provider: ProviderConfig) {
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
      toast.success('Provider 配置已删除；若它正在生效，生成会回退到本地 Qwen3.6-35B-A3B');
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

  return {
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
    deleteOpen,
    setDeleteOpen,
    testResult,
    suggestions,
    saveMutation,
    testMutation,
    deleteMutation,
    handleSave,
    handleTest,
  };
}

export type ProviderEditorState = ReturnType<typeof useProviderEditor>;
