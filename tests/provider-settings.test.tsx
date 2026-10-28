import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProviderSettings } from '@/components/providers/provider-settings';
import { ApiError } from '@/lib/api/client';
import type { ProviderConfig } from '@/lib/api/types';

const providerApi = vi.hoisted(() => ({
  listProviders: vi.fn(),
  updateProviderConfig: vi.fn(),
  deleteProviderConfig: vi.fn(),
  testProvider: vi.fn(),
}));

vi.mock('@/lib/api/providers', () => providerApi);
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function provider(overrides: Partial<ProviderConfig>): ProviderConfig {
  return {
    id: 'openai',
    label: 'OpenAI',
    description: 'OpenAI official API.',
    protocol: 'openai',
    default_base_url: 'https://api.openai.com/v1',
    alternate_base_urls: [],
    requires_api_key: true,
    supports_model_discovery: true,
    default_models: ['gpt-4o-mini', 'gpt-4o'],
    configured: false,
    api_key_configured: false,
    api_key_hint: null,
    api_key_source: null,
    base_url: 'https://api.openai.com/v1',
    default_model: 'gpt-4o-mini',
    is_default: false,
    updated_at: null,
    ...overrides,
  };
}

const openai = provider({});

const qwen = provider({
  id: 'qwen',
  label: 'Qwen / DashScope',
  description: 'Alibaba Cloud DashScope or a custom Qwen-compatible gateway.',
  default_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  alternate_base_urls: [],
  default_models: ['qwen-plus', 'qwen3.8-omni-flash'],
  configured: true,
  api_key_configured: true,
  api_key_hint: '****7890',
  api_key_source: 'user',
  base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  default_model: 'qwen-plus',
  updated_at: '2026-10-28T02:30:00Z',
});

const llama = provider({
  id: 'llama-local',
  label: 'Local llama.cpp',
  description: 'The local llama-server OpenAI-compatible endpoint.',
  default_base_url: 'http://127.0.0.1:65535/v1',
  default_models: ['Qwen3.6-35B-A3B'],
  requires_api_key: false,
  base_url: 'http://127.0.0.1:65535/v1',
  default_model: 'Qwen3.6-35B-A3B',
  is_default: true,
});

function renderWithClient(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe('ProviderSettings', () => {
  beforeEach(() => {
    providerApi.listProviders.mockReset();
    providerApi.updateProviderConfig.mockReset();
    providerApi.deleteProviderConfig.mockReset();
    providerApi.testProvider.mockReset();
    providerApi.listProviders.mockResolvedValue([openai, qwen, llama]);
  });

  it('shows provider state and selects the default provider', async () => {
    renderWithClient(<ProviderSettings />);

    expect(await screen.findByText('选择谁来讲这堂课')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Local llama.cpp/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Base URL')).toHaveValue('http://127.0.0.1:65535/v1');
    expect(screen.getAllByText('****7890').length).toBeGreaterThan(0);
  });

  it('saves a new key and model without echoing the secret', async () => {
    providerApi.updateProviderConfig.mockResolvedValue({
      ...qwen,
      api_key_hint: '****wxyz',
      default_model: 'qwen3.8-omni-flash',
      updated_at: '2026-10-28T03:00:00Z',
    });
    const user = userEvent.setup();
    renderWithClient(<ProviderSettings />);

    await user.click(
      await screen.findByRole('button', { name: /Qwen \/ DashScope/ }),
    );
    await user.type(await screen.findByLabelText('API Key'), 'sk-new-secret-wxyz');
    const modelInput = screen.getByLabelText('默认模型');
    await user.clear(modelInput);
    await user.type(modelInput, 'qwen3.8-omni-flash');
    await user.click(screen.getByRole('button', { name: /^保存配置$/ }));

    await waitFor(() => {
      expect(providerApi.updateProviderConfig).toHaveBeenCalledWith('qwen', {
        base_url: qwen.base_url,
        default_model: 'qwen3.8-omni-flash',
        is_default: false,
        api_key: 'sk-new-secret-wxyz',
      });
    });
    expect(screen.queryByDisplayValue('sk-new-secret-wxyz')).not.toBeInTheDocument();
  });

  it('tests unsaved base URL and model overrides', async () => {
    providerApi.testProvider.mockResolvedValue({
      provider_id: 'qwen',
      success: true,
      message: 'Chat completion succeeded with qwen3.8-omni-flash. 183 models reported.',
      latency_ms: 864,
      model: 'qwen3.8-omni-flash',
      models: ['qwen3.8-omni-flash', 'qwen-plus'],
    });
    const user = userEvent.setup();
    renderWithClient(<ProviderSettings />);

    await user.click(
      await screen.findByRole('button', { name: /Qwen \/ DashScope/ }),
    );
    const baseUrlInput = screen.getByLabelText('Base URL');
    await user.clear(baseUrlInput);
    await user.type(
      baseUrlInput,
      'https://ws-example.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    );
    const modelInput = screen.getByLabelText('默认模型');
    await user.clear(modelInput);
    await user.type(modelInput, 'qwen3.8-omni-flash');
    await user.click(screen.getByRole('button', { name: /测试连接/ }));

    await waitFor(() => {
      expect(providerApi.testProvider).toHaveBeenCalledWith('qwen', {
        base_url:
          'https://ws-example.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
        default_model: 'qwen3.8-omni-flash',
      });
    });
    expect(await screen.findByText('连接成功')).toBeInTheDocument();
    expect(screen.getByText('864 ms')).toBeInTheDocument();
  });

  it('shows the API error when the connection test cannot start', async () => {
    providerApi.testProvider.mockRejectedValue(
      new ApiError(422, 'PROVIDER_API_KEY_REQUIRED', 'This provider requires an API key'),
    );
    const user = userEvent.setup();
    renderWithClient(<ProviderSettings />);

    await user.click(await screen.findByRole('button', { name: /OpenAI/ }));
    await user.click(screen.getByRole('button', { name: /测试连接/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This provider requires an API key',
    );
  });
});
