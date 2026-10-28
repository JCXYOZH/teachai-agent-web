import { describe, expect, it } from 'vitest';

import {
  assetStatusLabel,
  formatBytes,
  formatFileKind,
} from '@/lib/utils/format';

describe('library formatting helpers', () => {
  it('formats byte sizes without losing the unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(12 * 1024 * 1024)).toBe('12 MB');
    expect(formatBytes(-1)).toBe('—');
  });

  it('formats document kinds and statuses', () => {
    expect(formatFileKind('.pptx')).toBe('PPTX');
    expect(formatFileKind('')).toBe('FILE');
    expect(assetStatusLabel('ready')).toBe('已解析');
    expect(assetStatusLabel('empty')).toBe('无文本');
    expect(assetStatusLabel('failed')).toBe('解析失败');
  });
});
