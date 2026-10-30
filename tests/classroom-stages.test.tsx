import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InteractiveStage } from '@/components/classroom/interactive-stage';
import { PblStage } from '@/components/classroom/pbl-stage';
import { submitClassroomResponses } from '@/lib/api/classroom';
import type { ClassroomInteractiveContent, ClassroomPblContent } from '@/lib/api/types';

vi.mock('@/lib/api/classroom', () => ({
  submitClassroomResponses: vi.fn(),
}));

const interactive: ClassroomInteractiveContent = {
  type: 'interactive',
  widgetType: 'simulation',
  prompt: '调节滑块观察曲线。',
  html: '<html><body><input type="range" /></body></html>',
  frame: { viewportWidth: 1280, viewportHeight: 720 },
};

const pbl: ClassroomPblContent = {
  type: 'pbl',
  project: {
    title: '校园能耗报告',
    description: '统计一周能耗并给出建议。',
    learningObjective: '学会用数据说话。',
    finalDeliverable: '一页报告',
    milestones: [
      {
        id: 'scene-m1',
        title: '采集数据',
        description: '连续记录七天。',
        deliverable: '原始表格',
        microtasks: [
          {
            id: 'scene-m1-t1',
            title: '记录每天用电',
            description: '抄表并填表。',
            completionCriteria: '七天数据齐全',
            hints: ['用表格记录'],
            status: 'todo',
          },
          {
            id: 'scene-m1-t2',
            title: '绘制折线图',
            description: null,
            completionCriteria: null,
            hints: [],
            status: 'todo',
          },
        ],
      },
    ],
  },
};

describe('InteractiveStage', () => {
  it('mounts the widget in a script-only sandbox', () => {
    render(<InteractiveStage content={interactive} />);

    const frame = screen.getByTitle('互动组件：调节滑块观察曲线。');
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    expect(frame.getAttribute('srcdoc')).toContain('Content-Security-Policy');
    expect(screen.getByText(/模拟实验/)).toBeInTheDocument();
  });

  it('remounts the widget when reset is pressed', async () => {
    const user = userEvent.setup();
    render(<InteractiveStage content={interactive} />);

    const before = screen.getByTitle('互动组件：调节滑块观察曲线。');
    await user.click(screen.getByRole('button', { name: /重置组件/ }));
    const after = screen.getByTitle('互动组件：调节滑块观察曲线。');

    expect(after).not.toBe(before);
  });
});

describe('PblStage', () => {
  beforeEach(() => {
    vi.mocked(submitClassroomResponses).mockResolvedValue({
      scene_id: 'scene-p',
      stage_id: 'stage-1',
      results: [
        {
          target_id: 'scene-m1-t1',
          kind: 'microtask',
          score: null,
          max_score: 0,
          correct: true,
          reference_answer: [],
          analysis: null,
        },
      ],
      score: 0,
      max_score: 0,
    });
  });

  it('persists microtask completion and updates progress', async () => {
    const user = userEvent.setup();
    render(<PblStage content={pbl} courseId='course-1' sceneId='scene-p' />);

    expect(screen.getByText('校园能耗报告')).toBeInTheDocument();
    expect(screen.getByText('0 / 2 · 0%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /记录每天用电/ }));

    expect(submitClassroomResponses).toHaveBeenCalledWith('course-1', 'scene-p', [
      { kind: 'microtask', target_id: 'scene-m1-t1', answer: { completed: true } },
    ]);
    expect(await screen.findByText('1 / 2 · 50%')).toBeInTheDocument();
  });

  it('restores progress from saved responses', () => {
    render(
      <PblStage
        content={pbl}
        courseId='course-1'
        sceneId='scene-p'
        initialCompleted={{ 'scene-m1-t1': true }}
      />,
    );

    expect(screen.getByText('1 / 2 · 50%')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /记录每天用电/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('rolls back the toggle when saving fails', async () => {
    const user = userEvent.setup();
    vi.mocked(submitClassroomResponses).mockRejectedValueOnce(new Error('offline'));
    render(<PblStage content={pbl} courseId='course-1' sceneId='scene-p' />);

    await user.click(screen.getByRole('button', { name: /记录每天用电/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('进度保存失败');
    expect(screen.getByText('0 / 2 · 0%')).toBeInTheDocument();
  });

  it('shows criteria and hints for each task', () => {
    render(<PblStage content={pbl} courseId='course-1' sceneId='scene-p' />);

    expect(screen.getByText('完成标准：七天数据齐全')).toBeInTheDocument();
    expect(screen.getByText('提示：用表格记录')).toBeInTheDocument();
    expect(screen.getByText('产出 · 原始表格')).toBeInTheDocument();
  });
});
