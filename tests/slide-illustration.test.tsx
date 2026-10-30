import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SlideStage } from '@/components/classroom/slide-stage';
import { downloadMediaBlob } from '@/lib/api/media';
import { generateSceneIllustration } from '@/lib/api/images';
import type {
  ClassroomIllustration,
  ClassroomSlideCanvas,
} from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/auth-store';

vi.mock('@/lib/api/media', () => ({
  downloadMediaBlob: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({
    fill,
    unoptimized,
    sizes,
    priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const canvas: ClassroomSlideCanvas = {
  id: 'scene-1',
  viewportSize: 1280,
  viewportRatio: 0.5625,
  elements: [
    {
      id: 'scene-1-title',
      type: 'text',
      textType: 'title',
      content: '<p>认识神经网络</p>',
      left: 90,
      top: 112,
      width: 1100,
      height: 150,
    },
    {
      id: 'scene-1-bullet-1',
      type: 'text',
      textType: 'content',
      content: '<p>输入、权重与激活函数</p>',
      left: 90,
      top: 300,
      width: 1100,
      height: 80,
    },
  ],
};

const illustration: ClassroomIllustration = {
  mediaId: 'media-image-1',
  format: 'webp',
  mimeType: 'image/webp',
  width: 1600,
  height: 900,
  providerId: 'qwen',
  model: 'qwen-image-3.0',
  sha256: 'a'.repeat(64),
  updatedAt: '2026-10-30T12:00:00+00:00',
  alt: '神经网络的深墨绿教学插画',
};

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 202,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  } as unknown as Response;
}

describe('SlideStage illustration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().clearSession();
  });

  it('loads the protected image once and renders the accessible mobile artwork', async () => {
    const createObjectUrl = vi.fn(() => 'blob:illustration-preview');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.mocked(downloadMediaBlob).mockResolvedValue(
      new Blob(['image'], { type: 'image/webp' }),
    );

    render(<SlideStage canvas={canvas} illustration={illustration} />);

    expect(
      await screen.findByAltText('神经网络的深墨绿教学插画'),
    ).toHaveAttribute('src', 'blob:illustration-preview');
    expect(downloadMediaBlob).toHaveBeenCalledWith('media-image-1');
    expect(downloadMediaBlob).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });
});

describe('generateSceneIllustration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().clearSession();
  });

  it('posts the regeneration flag to the scene illustration endpoint', async () => {
    useAuthStore.setState({ accessToken: 'image-access-token' });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'job-1',
        kind: 'image',
        status: 'queued',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await generateSceneIllustration('course-1', 'scene-1', {
      regenerate: true,
      instructions: '保留左侧文字安全区',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/courses/course-1/classroom/scenes/scene-1/illustration',
      ),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          regenerate: true,
          instructions: '保留左侧文字安全区',
        }),
      }),
    );
  });
});
