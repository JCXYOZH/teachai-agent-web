import type { ProviderConfig } from '@/lib/api/types';

export function providerStatus(provider: ProviderConfig): { label: string; dot: string } {
  if (provider.api_key_configured && provider.api_key_readable === false) {
    return { label: '密钥失效', dot: 'bg-ember' };
  }
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
