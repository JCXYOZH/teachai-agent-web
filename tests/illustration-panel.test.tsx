import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IllustrationPanel } from '@/components/classroom/classroom-player';
import type { ClassroomIllustration } from '@/lib/api/types';

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
  alt: '教学插画',
};

function renderPanel(
  value: ClassroomIllustration | null,
  options: { provider?: string; onProviderChange?: (value: string) => void } = {},
) {
  return render(
    <IllustrationPanel
      illustration={value}
      busy={false}
      progress={null}
      provider={options.provider ?? ''}
      onProviderChange={options.onProviderChange ?? vi.fn()}
      onGenerateScene={vi.fn()}
      onGenerateAll={vi.fn()}
    />,
  );
}

describe('IllustrationPanel quality', () => {
  it('shows the score without a warning when the artwork passes', () => {
    renderPanel({ ...illustration, quality: { score: 91, status: 'ok' } });

    expect(screen.getByText('Quality 91/100')).toBeInTheDocument();
    expect(screen.queryByText('本页配图质量偏低，建议重新生成。')).not.toBeInTheDocument();
  });

  it('flags a low-quality artwork and keeps the regenerate action', () => {
    renderPanel({
      ...illustration,
      quality: { score: 34, status: 'low', reasons: ['near_solid'] },
    });

    expect(screen.getByText('Quality 34/100')).toBeInTheDocument();
    expect(screen.getByText('本页配图质量偏低，建议重新生成。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Regenerate art/ })).toBeEnabled();
  });

  it('lists vision-model issues for a low-quality artwork', () => {
    renderPanel({
      ...illustration,
      quality: {
        score: 32,
        status: 'low',
        vlm: {
          score: 32,
          issues: ['readable text', 'cropped layout', 'off topic', 'fourth issue'],
          model: 'qwen-vl-max-latest',
        },
      },
    });

    expect(screen.getByText('readable text')).toBeInTheDocument();
    expect(screen.getByText('cropped layout')).toBeInTheDocument();
    expect(screen.getByText('off topic')).toBeInTheDocument();
    expect(screen.queryByText('fourth issue')).not.toBeInTheDocument();
  });

  it('lets the user pick an illustration provider', async () => {
    const onProviderChange = vi.fn();
    renderPanel(null, { onProviderChange });

    await userEvent.selectOptions(
      screen.getByLabelText('Illustration provider'),
      'pollinations',
    );

    expect(onProviderChange).toHaveBeenCalledWith('pollinations');
  });

  it('warns that token-gated providers need server configuration', () => {
    renderPanel(null, { provider: 'cloudflare' });

    expect(
      screen.getByText('需服务端已配置对应 Token，否则任务会失败'),
    ).toBeInTheDocument();
  });

  it('renders nothing extra for older assets without a score', () => {
    renderPanel(illustration);

    expect(screen.queryByText(/Quality \d+\/100/)).not.toBeInTheDocument();
    expect(screen.getByText('Art ready')).toBeInTheDocument();
  });
});
