import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAT_MAX_MESSAGE_CHARS, TeacherChat } from '@/components/classroom/teacher-chat';
import { ApiError } from '@/lib/api/client';
import type { ChatMessage, ChatReply, ChatThread } from '@/lib/api/types';

const chatApi = vi.hoisted(() => ({
  getCourseChat: vi.fn(),
  sendCourseChatMessage: vi.fn(),
  streamCourseChatMessage: vi.fn(),
  clearCourseChat: vi.fn(),
}));

vi.mock('@/lib/api/chat', () => chatApi);

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'message-1',
    role: 'user',
    content: 'QUESTION',
    stage_id: 'stage-1',
    stage_title: '极限与连续',
    stage_index: 2,
    scene_id: 'scene-2',
    scene_title: '检查理解',
    provider_id: null,
    model_name: null,
    created_at: '2026-11-09T02:00:00Z',
    ...overrides,
  };
}

function thread(messages: ChatMessage[], remaining = 198): ChatThread {
  return {
    course_id: 'course-1',
    session_id: messages.length ? 'session-1' : null,
    messages,
    daily_limit: 200,
    daily_used: 200 - remaining,
    remaining_today: remaining,
  };
}

function renderChat(
  overrides: Partial<ComponentProps<typeof TeacherChat>> = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TeacherChat
        courseId='course-1'
        stageId='stage-1'
        stageTitle='极限与连续'
        sceneId='scene-2'
        sceneTitle='检查理解'
        open
        onClose={() => {}}
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chatApi.getCourseChat.mockReset();
  chatApi.streamCourseChatMessage.mockReset();
  chatApi.clearCourseChat.mockReset();
});

describe('TeacherChat', () => {
  it('renders the stored conversation with the server scene label', async () => {
    chatApi.getCourseChat.mockResolvedValue(
      thread([
        message({ id: 'm1', role: 'user', content: '什么是极限？' }),
        message({
          id: 'm2',
          role: 'assistant',
          content: '极限描述的是趋近过程。',
          provider_id: 'llama-local',
          model_name: 'Qwen3.6-35B-A3B',
        }),
      ]),
    );

    renderChat();

    expect(await screen.findByText('极限描述的是趋近过程。')).toBeInTheDocument();
    expect(screen.getByText('第 2 幕 · 极限与连续')).toBeInTheDocument();
    expect(screen.getByText('今日剩余 198 / 200 次')).toBeInTheDocument();
  });

  it('sends the current scene context and appends the reply', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));
    const reply: ChatReply = {
      course_id: 'course-1',
      session_id: 'session-1',
      question: message({ id: 'q1', role: 'user', content: '为什么取趋近？' }),
      reply: message({
        id: 'a1',
        role: 'assistant',
        content: '因为极限关注的是靠近目标时的趋势。',
        provider_id: 'llama-local',
        model_name: 'Qwen3.6-35B-A3B',
      }),
      daily_limit: 200,
      daily_used: 1,
      remaining_today: 199,
    };
    chatApi.streamCourseChatMessage.mockResolvedValue(reply);

    renderChat();
    await screen.findByText('还没有提问。');

    const input = screen.getByLabelText('向老师提问');
    await userEvent.type(input, '为什么取趋近？');
    await userEvent.click(screen.getByRole('button', { name: /发送/ }));

    await waitFor(() => {
      expect(chatApi.streamCourseChatMessage).toHaveBeenCalledWith('course-1', {
        message: '为什么取趋近？',
        stage_id: 'stage-1',
        scene_id: 'scene-2',
        include_materials: false,
      },
      expect.objectContaining({ onDelta: expect.any(Function) }),
      );
    });
    expect(
      await screen.findByText('因为极限关注的是靠近目标时的趋势。'),
    ).toBeInTheDocument();
    expect(screen.getByText('今日剩余 199 / 200 次')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('clears the draft immediately and shows the thinking state', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));
    let resolveSend: (value: ChatReply) => void = () => {};
    chatApi.streamCourseChatMessage.mockReturnValue(
      new Promise<ChatReply>((resolve) => {
        resolveSend = resolve;
      }),
    );

    renderChat();
    await screen.findByText('还没有提问。');

    const input = screen.getByLabelText('向老师提问');
    await userEvent.type(input, '先清空我');
    await userEvent.click(screen.getByRole('button', { name: /发送/ }));

    expect(input).toHaveValue('');
    expect(screen.getByText('老师正在思考…')).toBeInTheDocument();
    expect(screen.getAllByText('先清空我').length).toBeGreaterThan(0);

    await act(async () => {
      resolveSend({
        course_id: 'course-1',
        session_id: 'session-1',
        question: message({ id: 'q1', role: 'user', content: '先清空我' }),
        reply: message({ id: 'a1', role: 'assistant', content: 'THINKING-DONE' }),
        daily_limit: 200,
        daily_used: 1,
        remaining_today: 199,
      });
    });

    expect(await screen.findByText('THINKING-DONE')).toBeInTheDocument();
    expect(screen.queryByText('老师正在思考…')).not.toBeInTheDocument();
    expect(screen.getAllByText('先清空我')).toHaveLength(1);
  });

  it('renders streamed deltas before the reply completes', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));
    let finish: (value: ChatReply) => void = () => {};
    let emit: (text: string) => void = () => {};
    chatApi.streamCourseChatMessage.mockImplementation(
      (
        _courseId: string,
        _payload: unknown,
        handlers: { onDelta?: (text: string) => void },
      ) =>
        new Promise<ChatReply>((resolve) => {
          finish = resolve;
          emit = (text) => handlers.onDelta?.(text);
        }),
    );

    renderChat();
    const input = await screen.findByRole('textbox');
    await userEvent.type(input, 'STREAM-PREVIEW{enter}');
    await waitFor(() => {
      expect(chatApi.streamCourseChatMessage).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      emit('PARTIAL-ANSWER');
    });
    expect(await screen.findByText('PARTIAL-ANSWER')).toBeInTheDocument();

    await act(async () => {
      finish({
        course_id: 'course-1',
        session_id: 'session-1',
        question: message({ id: 'q1', role: 'user', content: 'STREAM-PREVIEW' }),
        reply: message({ id: 'a1', role: 'assistant', content: 'FINAL-ANSWER' }),
        daily_limit: 200,
        daily_used: 1,
        remaining_today: 199,
      });
    });

    expect(await screen.findByText('FINAL-ANSWER')).toBeInTheDocument();
    expect(screen.queryByText('PARTIAL-ANSWER')).not.toBeInTheDocument();
  });

  it('renders assistant markdown instead of raw markup', async () => {
    chatApi.getCourseChat.mockResolvedValue(
      thread([
        message({
          id: 'm1',
          role: 'assistant',
          content: '**核心**：极限\n\n- 第一点\n- 第二点\n\n`f(x)` 的极限',
        }),
      ]),
    );

    renderChat();

    const strong = await screen.findByText('核心');
    expect(strong.tagName).toBe('STRONG');
    expect(screen.getByText('第一点').tagName).toBe('LI');
    expect(screen.getByText('f(x)').tagName).toBe('CODE');
    expect(screen.queryByText('**核心**：极限')).not.toBeInTheDocument();
  });

  it('shows the stage caption once per stage group', async () => {
    chatApi.getCourseChat.mockResolvedValue(
      thread([
        message({ id: 'u1', role: 'user', content: '问题一' }),
        message({ id: 'a1', role: 'assistant', content: '回答一' }),
        message({ id: 'u2', role: 'user', content: '问题二' }),
        message({ id: 'a2', role: 'assistant', content: '回答二' }),
        message({
          id: 'a3',
          role: 'assistant',
          content: '回答三',
          stage_index: 3,
          stage_title: '导数',
        }),
      ]),
    );

    renderChat();

    await screen.findByText('回答一');
    expect(screen.getAllByText('第 2 幕 · 极限与连续')).toHaveLength(1);
    expect(screen.getAllByText('第 3 幕 · 导数')).toHaveLength(1);
  });

  it('sends on Enter and keeps newlines for Shift+Enter', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));
    chatApi.streamCourseChatMessage.mockResolvedValue({
      course_id: 'course-1',
      session_id: 'session-1',
      question: message({ id: 'q1', role: 'user', content: '第一行' }),
      reply: message({ id: 'a1', role: 'assistant', content: 'ENTERED' }),
      daily_limit: 200,
      daily_used: 1,
      remaining_today: 199,
    });

    renderChat();
    await screen.findByText('还没有提问。');

    const input = screen.getByLabelText('向老师提问');
    await userEvent.type(input, '第一行{enter}');

    await waitFor(() => {
      expect(chatApi.streamCourseChatMessage).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('ENTERED')).toBeInTheDocument();
  });

  it('surfaces the daily limit error and keeps the draft', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));
    chatApi.streamCourseChatMessage.mockRejectedValue(
      new ApiError(429, 'CHAT_DAILY_LIMIT_REACHED', 'Daily teacher question limit reached'),
    );

    renderChat();
    await screen.findByText('还没有提问。');

    const input = screen.getByLabelText('向老师提问');
    await userEvent.type(input, '还能问吗？');
    await userEvent.click(screen.getByRole('button', { name: /发送/ }));

    expect(
      await screen.findByText('今日提问次数已用完，明天再来问老师吧。'),
    ).toBeInTheDocument();
    expect(input).toHaveValue('还能问吗？');
  });

  it('clears the whole conversation after confirmation', async () => {
    chatApi.getCourseChat.mockResolvedValue(
      thread([message({ id: 'm1', content: 'OLD-MESSAGE' })]),
    );
    chatApi.clearCourseChat.mockResolvedValue(undefined);

    renderChat();
    await screen.findByText('OLD-MESSAGE');

    await userEvent.click(screen.getByRole('button', { name: /清空对话/ }));
    await userEvent.click(screen.getByRole('button', { name: '确认清空' }));

    await waitFor(() => {
      expect(chatApi.clearCourseChat).toHaveBeenCalledWith('course-1');
    });
    expect(await screen.findByText('还没有提问。')).toBeInTheDocument();
    expect(screen.queryByText('OLD-MESSAGE')).not.toBeInTheDocument();
  });

  it('counts characters and blocks sending past the limit', async () => {
    chatApi.getCourseChat.mockResolvedValue(thread([]));

    renderChat();
    await screen.findByText('还没有提问。');

    const input = screen.getByLabelText('向老师提问');

    fireEvent.change(input, { target: { value: 'a'.repeat(CHAT_MAX_MESSAGE_CHARS + 1) } });

    expect(
      screen.getByText(`${CHAT_MAX_MESSAGE_CHARS + 1} / ${CHAT_MAX_MESSAGE_CHARS} 字`),
    ).toBeInTheDocument();
    expect(screen.getByText(/已超出 1 字/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /发送/ })).toBeDisabled();

    fireEvent.change(input, { target: { value: 'a'.repeat(20) } });

    expect(screen.getByText(`20 / ${CHAT_MAX_MESSAGE_CHARS} 字`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /发送/ })).not.toBeDisabled();
  });

  it('does not load anything while closed', () => {
    renderChat({ open: false });

    expect(chatApi.getCourseChat).not.toHaveBeenCalled();
  });
});
