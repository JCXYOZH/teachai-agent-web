import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExportPanel } from '@/components/classroom/export-panel';
import { createClassroomExport, listClassroomExports } from '@/lib/api/exports';
import type { ClassroomExport } from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/auth-store';

const pptxExport: ClassroomExport = {
  format: 'pptx',
  media_id: 'media-pptx',
  filename: '监督学习入门.pptx',
  mime_type:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  size_bytes: 2048,
  scene_count: 3,
  include_images: true,
  include_audio: true,
  warnings: [],
  content_url: '/api/v1/media/media-pptx/content',
  created_at: '2026-11-02T08:00:00+00:00',
  updated_at: '2026-11-02T08:00:00+00:00',
};

const htmlExport: ClassroomExport = {
  format: 'html',
  media_id: 'media-html',
  filename: '监督学习入门.html',
  mime_type: 'text/html; charset=utf-8',
  size_bytes: 1536,
  scene_count: 3,
  include_images: true,
  include_audio: false,
  warnings: ['Narration audio was omitted because the export would exceed the size limit'],
  content_url: '/api/v1/media/media-html/content',
  created_at: '2026-11-02T08:00:00+00:00',
  updated_at: '2026-11-02T08:00:00+00:00',
};

function renderPanel(overrides: Partial<React.ComponentProps<typeof ExportPanel>> = {}) {
  const onCreate = vi.fn();
  const onDownload = vi.fn();
  render(
    <ExportPanel
      exports={[]}
      busy={false}
      progress={null}
      downloadingFormat={null}
      onCreate={onCreate}
      onDownload={onDownload}
      {...overrides}
    />,
  );
  return { onCreate, onDownload };
}

describe('ExportPanel', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('builds a pptx export with images and narration by default', async () => {
    const { onCreate } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Build export' }));

    expect(onCreate).toHaveBeenCalledWith({
      format: 'pptx',
      include_images: true,
      include_audio: true,
    });
  });

  it('switches to html and drops narration when toggled off', async () => {
    const { onCreate } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'HTML' }));
    await userEvent.click(screen.getByRole('button', { name: '含旁白' }));
    await userEvent.click(screen.getByRole('button', { name: 'Build export' }));

    expect(screen.getByRole('button', { name: '含旁白' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(onCreate).toHaveBeenCalledWith({
      format: 'html',
      include_images: true,
      include_audio: false,
    });
  });

  it('lists ready exports and downloads the clicked format', async () => {
    const { onDownload } = renderPanel({ exports: [pptxExport, htmlExport] });

    expect(screen.getByText('监督学习入门.pptx')).toBeInTheDocument();
    expect(screen.getByText(/PPTX · 2\.0 KB · 3 scenes/)).toBeInTheDocument();
    expect(screen.getByText(/Narration audio was omitted/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: '下载 HTML 导出文件' }),
    );

    expect(onDownload).toHaveBeenCalledWith(htmlExport);
  });

  it('disables the build button and reports progress while exporting', () => {
    renderPanel({
      busy: true,
      progress: { message: 'Rendering slides', progress: 60 },
    });

    expect(screen.getByRole('button', { name: /Exporting/ })).toBeDisabled();
    expect(screen.getByText('Rendering slides · 60%')).toBeInTheDocument();
  });
});

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 202,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  } as unknown as Response;
}

describe('classroom export api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().clearSession();
  });

  it('posts the requested format to the export endpoint', async () => {
    useAuthStore.setState({ accessToken: 'export-token' });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 'job-1', kind: 'export', status: 'queued' }));
    vi.stubGlobal('fetch', fetchMock);

    await createClassroomExport('course-1', {
      format: 'html',
      include_images: false,
      include_audio: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/courses/course-1/classroom/export'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          format: 'html',
          include_images: false,
          include_audio: true,
        }),
      }),
    );
  });

  it('reads the export listing for a course', async () => {
    useAuthStore.setState({ accessToken: 'export-token' });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ stage_id: 'stage-1', exports: [pptxExport] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const listing = await listClassroomExports('course-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/courses/course-1/classroom/exports'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(listing.exports[0].media_id).toBe('media-pptx');
  });
});