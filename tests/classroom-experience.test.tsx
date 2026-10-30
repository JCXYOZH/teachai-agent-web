import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClassroomExperience } from '@/components/classroom/classroom-experience';
import { ApiError } from '@/lib/api/client';
import type {
  Classroom,
  ClassroomSlideCanvas,
  Course,
  CourseOutlineSummary,
  GenerationJob,
} from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/auth-store';

const classroomApi = vi.hoisted(() => ({
  getClassroom: vi.fn(),
  generateClassroom: vi.fn(),
  getClassroomResponses: vi.fn(),
  submitClassroomResponses: vi.fn(),
}));

const generationApi = vi.hoisted(() => ({
  getGenerationJob: vi.fn(),
}));

const outlineApi = vi.hoisted(() => ({
  getCourseOutline: vi.fn(),
  generateCourseOutline: vi.fn(),
}));

const libraryApi = vi.hoisted(() => ({
  getCourse: vi.fn(),
}));

vi.mock('@/lib/api/classroom', () => classroomApi);
vi.mock('@/lib/api/generation', () => generationApi);
vi.mock('@/lib/api/outlines', () => outlineApi);
vi.mock('@/lib/api/library', () => libraryApi);
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const course: Course = {
  id: 'course-1',
  title: '函数的极限',
  description: '面向大学新生的微积分入门课程',
  folder_id: null,
  folder_name: null,
  status: 'draft',
  asset_count: 2,
  created_at: '2026-10-28T09:00:00Z',
  updated_at: '2026-10-28T10:00:00Z',
};

const slideCanvas: ClassroomSlideCanvas = {
  id: 'scene-1',
  viewportSize: 1280,
  viewportRatio: 0.5625,
  theme: {
    backgroundColor: '#0B1714',
    fontColor: '#EDF4E9',
    fontName: 'Microsoft YaHei',
    themeColors: ['#D9583D', '#A9BDA8'],
  },
  background: { type: 'solid', color: '#0B1714' },
  elements: [
    {
      id: 'scene-1-title',
      left: 90,
      top: 112,
      width: 1100,
      height: 150,
      type: 'text',
      content:
        '<p style="margin:0;font-size:54px;color:#F1ECDD;">从变化率出发</p>',
      defaultColor: '#F1ECDD',
      lineHeight: 1.4,
    },
    {
      id: 'scene-1-body',
      left: 90,
      top: 300,
      width: 1100,
      height: 300,
      type: 'text',
      content:
        '<p style="margin:0;font-size:28px;color:#D9E3D2;">• 平均变化率</p>',
      defaultColor: '#D9E3D2',
    },
  ],
};

const classroom: Classroom = {
  id: 'classroom-1',
  course_id: course.id,
  outline_id: 'outline-1',
  version: 1,
  name: '极限课堂',
  description: '用直观例子理解极限。',
  style: 'Deep ink classroom with warm chalk accents.',
  language_directive: '用简体中文教学。',
  dsl_version: '0.12.0',
  provider_id: 'llama-local',
  model_name: 'Qwen3.6-35B-A3B',
  scene_count: 2,
  scenes: [
    {
      id: 'scene-1',
      stage_id: 'stage-1',
      type: 'slide',
      title: '从变化率出发',
      order: 1,
      content: { type: 'slide', schemaVersion: 1, canvas: slideCanvas },
      actions: [
        {
          id: 'scene-1-speech',
          type: 'speech',
          text: '我们先比较一段时间内的平均速度，再让时间间隔逐渐缩短。',
          speed: 1,
        },
      ],
      created_at: '2026-10-28T10:00:00Z',
      updated_at: '2026-10-28T10:00:00Z',
    },
    {
      id: 'scene-2',
      stage_id: 'stage-1',
      type: 'quiz',
      title: '检查理解',
      order: 2,
      content: {
        type: 'quiz',
        questions: [
          {
            id: 'scene-2-q1',
            type: 'single',
            question: '当间隔趋于零时，平均变化率趋向什么？',
            options: [
              { label: '瞬时变化率', value: 'A' },
              { label: '平均速度', value: 'B' },
            ],
            answer: ['A'],
            analysis: '间隔趋零时得到瞬时变化率。',
            hasAnswer: true,
            points: 1,
          },
        ],
      },
      actions: [
        {
          id: 'scene-2-speech',
          type: 'speech',
          text: '请选择一个最符合定义的答案。',
          speed: 1,
        },
      ],
      created_at: '2026-10-28T10:00:00Z',
      updated_at: '2026-10-28T10:00:00Z',
    },
  ],
  created_at: '2026-10-28T10:00:00Z',
  updated_at: '2026-10-28T10:00:00Z',
};

const outline: CourseOutlineSummary = {
  id: 'outline-1',
  course_id: course.id,
  version: 1,
  source: 'generated',
  course_title: course.title,
  scene_count: 8,
  created_at: '2026-10-28T09:30:00Z',
};

const job: GenerationJob = {
  id: 'job-1',
  course_id: course.id,
  kind: 'classroom',
  outline_id: outline.id,
  stage_id: 'stage-1',
  provider_id: 'llama-local',
  model_name: 'Qwen3.6-35B-A3B',
  status: 'completed',
  progress: 100,
  message: 'Classroom ready',
  error_code: null,
  error_message: null,
  scene_count: 2,
  created_at: '2026-10-28T10:00:00Z',
  started_at: '2026-10-28T10:00:00Z',
  completed_at: '2026-10-28T10:01:00Z',
};

function renderExperience() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClassroomExperience courseId={course.id} />
    </QueryClientProvider>,
  );
}

describe('ClassroomExperience', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'test-token',
      user: null,
    });
    libraryApi.getCourse.mockResolvedValue(course);
    classroomApi.getClassroom.mockResolvedValue(classroom);
    classroomApi.generateClassroom.mockResolvedValue(job);
    classroomApi.getClassroomResponses.mockResolvedValue({
      stage_id: 'stage-1',
      responses: [],
    });
    classroomApi.submitClassroomResponses.mockResolvedValue({
      scene_id: 'scene-2',
      stage_id: 'stage-1',
      results: [],
      score: 0,
      max_score: 0,
    });
    generationApi.getGenerationJob.mockResolvedValue(job);
    outlineApi.getCourseOutline.mockResolvedValue(outline);
    outlineApi.generateCourseOutline.mockResolvedValue(job);
  });

  it('waits for session restore before calling the API', async () => {
    useAuthStore.setState({
      status: 'restoring',
      accessToken: null,
      user: null,
    });

    renderExperience();

    expect(screen.getByLabelText('正在加载课堂')).toBeInTheDocument();
    expect(libraryApi.getCourse).not.toHaveBeenCalled();
    expect(classroomApi.getClassroom).not.toHaveBeenCalled();
  });

  it('renders the slide canvas, narration, and scene rail', async () => {
    renderExperience();

    expect(await screen.findByTestId('slide-stage')).toBeInTheDocument();
    expect(screen.getByText('函数的极限')).toBeInTheDocument();
    expect(screen.getAllByText('从变化率出发').length).toBeGreaterThan(0);
    expect(screen.getAllByText('• 平均变化率').length).toBeGreaterThan(0);
    expect(
      screen.getByText('我们先比较一段时间内的平均速度，再让时间间隔逐渐缩短。'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 / 2 · Arrow keys')).toBeInTheDocument();
    expect(screen.getByTestId('slide-stage')).toBeInTheDocument();
  });

  it('submits a quiz answer and shows the graded result', async () => {
    const user = userEvent.setup();
    classroomApi.submitClassroomResponses.mockResolvedValueOnce({
      scene_id: 'scene-2',
      stage_id: 'stage-1',
      results: [
        {
          target_id: 'scene-2-q1',
          kind: 'question',
          score: 1,
          max_score: 1,
          correct: true,
          reference_answer: ['A'],
          analysis: '间隔趋零时得到瞬时变化率。',
        },
      ],
      score: 1,
      max_score: 1,
    });
    renderExperience();

    await screen.findByRole('button', { name: '下一场景' });
    await user.click(screen.getByRole('button', { name: '下一场景' }));

    expect(
      await screen.findByText('当间隔趋于零时，平均变化率趋向什么？'),
    ).toBeInTheDocument();
    expect(screen.getByText('请选择一个最符合定义的答案。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /瞬时变化率/ }));
    await user.click(screen.getByRole('button', { name: '提交作答' }));

    await waitFor(() => {
      expect(classroomApi.submitClassroomResponses).toHaveBeenCalledWith(
        course.id,
        'scene-2',
        [
          {
            kind: 'question',
            target_id: 'scene-2-q1',
            answer: ['A'],
          },
        ],
      );
    });

    expect(await screen.findByText('得分 1 / 1')).toBeInTheDocument();
    expect(screen.getByText('回答正确')).toBeInTheDocument();
    expect(screen.getByText('参考答案')).toBeInTheDocument();
    expect(screen.getByText('A. 瞬时变化率')).toBeInTheDocument();
    expect(screen.getByText('间隔趋零时得到瞬时变化率。')).toBeInTheDocument();
  });

  it('creates a missing outline before generating the classroom', async () => {
    const user = userEvent.setup();
    classroomApi.getClassroom
      .mockRejectedValueOnce(
        new ApiError(404, 'CLASSROOM_NOT_FOUND', 'Classroom not found'),
      )
      .mockResolvedValue(classroom);
    outlineApi.getCourseOutline.mockRejectedValueOnce(
      new ApiError(404, 'OUTLINE_NOT_FOUND', 'Outline not found'),
    );

    renderExperience();

    const generateButton = await screen.findByRole('button', {
      name: '生成课堂',
    });
    await user.click(generateButton);

    await waitFor(() => {
      expect(outlineApi.generateCourseOutline).toHaveBeenCalledWith(
        course.id,
        expect.objectContaining({ scene_count: 8 }),
      );
    });
    expect(classroomApi.generateClassroom).toHaveBeenCalledWith(course.id, {
      instructions: undefined,
    });
    expect((await screen.findAllByText('• 平均变化率')).length).toBeGreaterThan(0);
  });

  it('shows a helpful error when outline generation fails', async () => {
    const user = userEvent.setup();
    classroomApi.getClassroom.mockRejectedValueOnce(
      new ApiError(404, 'CLASSROOM_NOT_FOUND', 'Classroom not found'),
    );
    outlineApi.getCourseOutline.mockRejectedValueOnce(
      new ApiError(404, 'OUTLINE_NOT_FOUND', 'Outline not found'),
    );
    outlineApi.generateCourseOutline.mockRejectedValueOnce(
      new ApiError(502, 'OUTLINE_INVALID_RESPONSE', 'Outline invalid'),
    );

    renderExperience();

    await user.click(await screen.findByRole('button', { name: '生成课堂' }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('大纲生成结果不稳定，请补充更明确的教学要求后重试。');
    expect(classroomApi.generateClassroom).not.toHaveBeenCalled();
  });

  it('resumes an in-progress generation job instead of failing', async () => {
    const user = userEvent.setup();
    classroomApi.getClassroom
      .mockRejectedValueOnce(
        new ApiError(404, 'CLASSROOM_NOT_FOUND', 'Classroom not found'),
      )
      .mockResolvedValue(classroom);
    classroomApi.generateClassroom.mockRejectedValueOnce(
      new ApiError(409, 'GENERATION_IN_PROGRESS', 'Generation already running', {
        job_id: 'job-running',
      }),
    );
    generationApi.getGenerationJob.mockResolvedValueOnce({
      ...job,
      id: 'job-running',
    });

    renderExperience();

    await user.click(await screen.findByRole('button', { name: '生成课堂' }));

    await waitFor(() => {
      expect(generationApi.getGenerationJob).toHaveBeenCalledWith('job-running');
    });
    expect((await screen.findAllByText('• 平均变化率')).length).toBeGreaterThan(0);
  });
});
