import { describe, expect, it } from 'vitest';

import { MAX_UPLOAD_BYTES, isOversizedFile, isSupportedFile } from '@/lib/utils/asset-files';

const fileOf = (name: string, size: number) => ({ name, size }) as File;

describe('asset upload limits', () => {
  it('flags files above the 50 MB limit', () => {
    expect(MAX_UPLOAD_BYTES).toBe(50 * 1024 * 1024);
    expect(isOversizedFile(fileOf('lesson.pdf', MAX_UPLOAD_BYTES))).toBe(false);
    expect(isOversizedFile(fileOf('lesson.pdf', MAX_UPLOAD_BYTES + 1))).toBe(true);
    expect(isOversizedFile(fileOf('scan.pdf', 53.1 * 1024 * 1024))).toBe(true);
  });

  it('keeps the supported extension whitelist', () => {
    expect(isSupportedFile(fileOf('notes.markdown', 10))).toBe(true);
    expect(isSupportedFile(fileOf('setup.exe', 10))).toBe(false);
  });
});
