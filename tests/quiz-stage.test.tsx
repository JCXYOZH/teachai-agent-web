import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuizStage } from '@/components/classroom/quiz-stage';
import { submitClassroomResponses } from '@/lib/api/classroom';
import type { ClassroomQuizContent } from '@/lib/api/types';

vi.mock('@/lib/api/classroom', () => ({
  submitClassroomResponses: vi.fn(),
}));

const content: ClassroomQuizContent = {
  type: 'quiz',
  questions: [
    {
      id: 'q1',
      type: 'single',
      question: '1 + 1 等于几？',
      options: [
        { label: '2', value: 'A' },
        { label: '3', value: 'B' },
      ],
      answer: ['A'],
      analysis: '基本加法。',
      hasAnswer: true,
      points: 1,
    },
    {
      id: 'q2',
      type: 'multiple',
      question: '选出所有偶数。',
      options: [
        { label: '2', value: 'A' },
        { label: '3', value: 'B' },
        { label: '4', value: 'C' },
      ],
      answer: ['A', 'C'],
      analysis: null,
      hasAnswer: true,
      points: 1,
    },
    {
      id: 'q3',
      type: 'short_answer',
      question: '说说什么是极限。',
      options: [],
      answer: ['无限接近某个确定的值'],
      analysis: '抓住趋近与目标值。',
      hasAnswer: true,
      points: 1,
    },
  ],
};

describe('QuizStage', () => {
  beforeEach(() => {
    vi.mocked(submitClassroomResponses).mockResolvedValue({
      scene_id: 'scene-1',
      stage_id: 'stage-1',
      results: [
        {
          target_id: 'q1',
          kind: 'question',
          score: 1,
          max_score: 1,
          correct: true,
          reference_answer: ['A'],
          analysis: '基本加法。',
        },
        {
          target_id: 'q2',
          kind: 'question',
          score: 0,
          max_score: 1,
          correct: false,
          reference_answer: ['A', 'C'],
          analysis: null,
        },
        {
          target_id: 'q3',
          kind: 'question',
          score: null,
          max_score: 0,
          correct: null,
          reference_answer: ['无限接近某个确定的值'],
          analysis: '抓住趋近与目标值。',
        },
      ],
      score: 1,
      max_score: 2,
    });
  });

  it('submits answers and renders per-question grading', async () => {
    const user = userEvent.setup();
    render(<QuizStage content={content} courseId='course-1' sceneId='scene-1' />);

    const firstGroup = screen.getByRole('group', { name: '第 1 题选项' });
    await user.click(within(firstGroup).getByRole('button', { name: /^A 2$/ }));

    const secondGroup = screen.getByRole('group', { name: '第 2 题选项' });
    await user.click(within(secondGroup).getByRole('button', { name: /^A 2$/ }));
    await user.click(within(secondGroup).getByRole('button', { name: /^B 3$/ }));

    await user.type(screen.getByLabelText('第 3 题回答'), '无限接近一个确定的值');
    await user.click(screen.getByRole('button', { name: '提交作答' }));

    await waitFor(() => {
      expect(submitClassroomResponses).toHaveBeenCalledWith('course-1', 'scene-1', [
        { kind: 'question', target_id: 'q1', answer: ['A'] },
        { kind: 'question', target_id: 'q2', answer: ['A', 'B'] },
        { kind: 'question', target_id: 'q3', answer: '无限接近一个确定的值' },
      ]);
    });

    expect(await screen.findByText('得分 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('回答正确')).toBeInTheDocument();
    expect(screen.getByText('再想想')).toBeInTheDocument();
    expect(screen.getByText('已记录')).toBeInTheDocument();
    expect(screen.getByText('A. 2；C. 4')).toBeInTheDocument();
    expect(screen.getByText('基本加法。')).toBeInTheDocument();
    expect(screen.getByText('无限接近某个确定的值')).toBeInTheDocument();
  });

  it('requires an answer before submitting', async () => {
    const user = userEvent.setup();
    render(<QuizStage content={content} courseId='course-1' sceneId='scene-1' />);

    await user.click(screen.getByRole('button', { name: '提交作答' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('请先作答');
    expect(submitClassroomResponses).not.toHaveBeenCalled();
  });

  it('restores saved results on revisit', () => {
    render(
      <QuizStage
        content={content}
        courseId='course-1'
        sceneId='scene-1'
        initialResults={[
          {
            target_id: 'q1',
            kind: 'question',
            score: 1,
            max_score: 1,
            correct: true,
            reference_answer: [],
            analysis: null,
          },
        ]}
      />,
    );

    expect(screen.getByText('得分 1 / 1')).toBeInTheDocument();
    expect(screen.getByText('回答正确')).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: '第 1 题选项' })).getByRole(
        'button',
        { name: '2' },
      ),
    ).toBeDisabled();
  });
});
