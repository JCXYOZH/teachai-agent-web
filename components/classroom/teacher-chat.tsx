'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Send, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ChatMarkdown } from '@/components/classroom/chat-markdown';
import {
  clearCourseChat,
  getCourseChat,
  streamCourseChatMessage,
} from '@/lib/api/chat';
import { ApiError } from '@/lib/api/client';
import type { ChatMessage } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

export const CHAT_MAX_MESSAGE_CHARS = 2000;

interface TeacherChatProps {
  courseId: string;
  stageId?: string | null;
  stageTitle?: string | null;
  sceneId?: string | null;
  sceneTitle?: string | null;
  open: boolean;
  onClose: () => void;
}

function describeChatError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'CHAT_DAILY_LIMIT_REACHED':
        return '今日提问次数已用完，明天再来问老师吧。';
      case 'CHAT_CLASSROOM_REQUIRED':
        return '请先生成课堂内容，再向老师提问。';
      case 'CHAT_TIMEOUT':
        return '老师回答超时，请稍后重试。';
      case 'PROVIDER_KEY_UNREADABLE':
        return '当前模型的已保存密钥无法解密，请到设置页重新填写 API Key。';
      case 'PROVIDER_API_KEY_REQUIRED':
        return '当前默认模型缺少 API Key，请先到设置页补齐。';
      case 'CHAT_PROVIDER_ERROR':
      case 'CHAT_EMPTY_RESPONSE':
        return '老师暂时无法回答，请稍后重试。';
      case 'VALIDATION_ERROR':
        return '消息内容不合法，请检查后再发送。';
      default:
        return error.message || '发送失败，请稍后重试。';
    }
  }
  return '无法连接课堂服务，请稍后重试。';
}

function stageCaption(message: ChatMessage): string | null {
  if (message.role !== 'assistant') {
    return null;
  }
  const index = message.stage_index;
  const title = message.stage_title;
  if (index === null && !title) {
    return null;
  }
  if (index === null) {
    return title;
  }
  return title ? `第 ${index} 幕 · ${title}` : `第 ${index} 幕`;
}

function groupedCaptions(messages: ChatMessage[]): Array<string | null> {
  let lastKey: string | null = null;
  return messages.map((message) => {
    const caption = stageCaption(message);
    if (!caption) {
      return null;
    }
    const key = `${message.stage_index ?? ''}|${message.stage_title ?? ''}`;
    if (key === lastKey) {
      return null;
    }
    lastKey = key;
    return caption;
  });
}

export function TeacherChat({
  courseId,
  stageId,
  stageTitle,
  sceneId,
  sceneTitle,
  open,
  onClose,
}: TeacherChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [includeMaterials, setIncludeMaterials] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const captions = groupedCaptions(messages);

  const threadQuery = useQuery({
    queryKey: ['course-chat', courseId],
    queryFn: () => getCourseChat(courseId),
    enabled: open,
  });

  useEffect(() => {
    if (!threadQuery.data) {
      return;
    }
    setMessages(threadQuery.data.messages);
    setRemaining(threadQuery.data.remaining_today);
    setDailyLimit(threadQuery.data.daily_limit);
  }, [threadQuery.data]);

  useEffect(() => {
    if (!open) {
      setConfirmingClear(false);
      setNotice(null);
    }
  }, [open]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, open, pendingQuestion, sending, streamingAnswer]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  const handleSend = useCallback(async () => {
    const message = draft.trim();
    if (!message || sending) {
      return;
    }
    if (Array.from(message).length > CHAT_MAX_MESSAGE_CHARS) {
      setNotice(`问题已超出 ${CHAT_MAX_MESSAGE_CHARS} 字上限，请删减后再发送。`);
      return;
    }
    setDraft('');
    setPendingQuestion(message);
    setStreamingAnswer(null);
    setSending(true);
    setNotice(null);
    try {
      const result = await streamCourseChatMessage(
        courseId,
        {
          message,
          stage_id: stageId ?? null,
          scene_id: sceneId ?? null,
          include_materials: includeMaterials,
        },
        {
          onDelta: (text) =>
            setStreamingAnswer((previous) => `${previous ?? ''}${text}`),
        },
      );
      setMessages((previous) => [...previous, result.question, result.reply]);
      setRemaining(result.remaining_today);
      setDailyLimit(result.daily_limit);
    } catch (error) {
      setNotice(describeChatError(error));
      setDraft(message);
    } finally {
      setPendingQuestion(null);
      setStreamingAnswer(null);
      setSending(false);
    }
  }, [courseId, draft, includeMaterials, sceneId, sending, stageId]);

  const handleClear = useCallback(async () => {
    if (clearing) {
      return;
    }
    setClearing(true);
    setNotice(null);
    try {
      await clearCourseChat(courseId);
      setMessages([]);
      setConfirmingClear(false);
    } catch (error) {
      setNotice(describeChatError(error));
    } finally {
      setClearing(false);
    }
  }, [clearing, courseId]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const loadError =
    threadQuery.error instanceof ApiError ? describeChatError(threadQuery.error) : null;
  const draftChars = Array.from(draft).length;
  const overLimit = draftChars > CHAT_MAX_MESSAGE_CHARS;
  const sendDisabled = !draft.trim() || sending || remaining === 0 || overLimit;

  return createPortal(
    <div className='fixed inset-0 z-[85] bg-ink/55 backdrop-blur-sm'>
      <aside
        role='dialog'
        aria-modal='true'
        aria-label='课堂教师对话'
        className='fixed inset-x-0 bottom-0 z-[90] flex max-h-[85vh] flex-col border-t border-chalk/15 bg-[#07110e] text-chalk shadow-stage md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[420px] md:border-l md:border-t-0'
      >
        <div className='flex items-start justify-between gap-3 border-b border-chalk/10 px-5 py-4'>
          <div className='min-w-0'>
            <p className='font-mono text-[0.5rem] uppercase tracking-[0.2em] text-chalk/35'>
              Teacher
            </p>
            <h2 className='mt-1 font-display text-lg text-chalk'>问老师</h2>
            <p className='mt-1 truncate text-xs text-chalk/40'>
              {stageTitle
                ? `依据《${stageTitle}》的大纲与当前场景作答`
                : '依据本节课大纲与当前场景作答'}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='关闭对话'
            className='flex h-8 w-8 shrink-0 items-center justify-center border border-chalk/15 text-chalk/45 transition-colors hover:border-chalk/40 hover:text-chalk'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div
          ref={scrollRef}
          aria-live='polite'
          className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4'
        >
          {threadQuery.isLoading ? (
            <div className='flex items-center gap-2 text-xs text-chalk/40'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              正在读取对话…
            </div>
          ) : null}

          {loadError ? (
            <p role='alert' className='border border-ember/40 bg-ember/10 px-3 py-2 text-xs leading-6 text-ember'>
              {loadError}
            </p>
          ) : null}

          {!threadQuery.isLoading && !loadError && messages.length === 0 ? (
            <div className='border border-dashed border-chalk/15 px-4 py-6 text-center'>
              <p className='text-sm text-chalk/60'>还没有提问。</p>
              <p className='mt-2 text-xs leading-6 text-chalk/35'>
                可以问「这一页的核心概念是什么」，或让老师解释当前场景里的例子。
              </p>
            </div>
          ) : null}

          {messages.map((message, index) => {
            const caption = captions[index];
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
              >
                {caption ? (
                  <p className='mb-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/30'>
                    {caption}
                  </p>
                ) : null}
                {isUser ? (
                  <div className='max-w-[92%] whitespace-pre-wrap break-words border border-ember/35 bg-ember/10 px-3 py-2 text-sm leading-6 text-chalk/85'>
                    {message.content}
                  </div>
                ) : (
                  <div className='max-w-[92%] break-words border border-chalk/12 bg-chalk/[0.04] px-3 py-2 text-chalk/75'>
                    <ChatMarkdown content={message.content} />
                  </div>
                )}
                {!isUser && message.scene_title ? (
                  <p className='mt-1 text-[0.5rem] text-chalk/25'>
                    场景：{message.scene_title}
                  </p>
                ) : null}
              </div>
            );
          })}

          {pendingQuestion ? (
            <div className='flex flex-col items-end'>
              <div className='max-w-[92%] whitespace-pre-wrap break-words border border-ember/35 bg-ember/10 px-3 py-2 text-sm leading-6 text-chalk/85'>
                {pendingQuestion}
              </div>
            </div>
          ) : null}

          {streamingAnswer !== null ? (
            <div className='flex flex-col items-start'>
              <div className='max-w-[92%] break-words border border-chalk/12 bg-chalk/[0.04] px-3 py-2 text-chalk/75'>
                <ChatMarkdown content={streamingAnswer} />
                <span className='ml-0.5 inline-block h-3 w-1 animate-pulse bg-ember align-middle' />
              </div>
            </div>
          ) : null}

          {sending && streamingAnswer === null ? (
            <div className='flex flex-col items-start'>
              <div className='flex items-center gap-2 border border-chalk/12 bg-chalk/[0.04] px-3 py-2 text-xs text-chalk/50'>
                <Loader2 className='h-3.5 w-3.5 animate-spin text-ember' />
                老师正在思考…
              </div>
            </div>
          ) : null}
        </div>

        <div className='border-t border-chalk/10 px-5 py-4'>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={3}
            aria-label='向老师提问'
            placeholder='向老师提问，Enter 发送，Shift+Enter 换行'
            className='w-full resize-none border border-chalk/15 bg-classroom/40 px-3 py-2 text-sm leading-6 text-chalk placeholder:text-chalk/25 focus:border-ember/50 focus:outline-none'
          />

          {overLimit ? (
            <p className='mt-1.5 text-[0.65rem] text-ember'>
              已超出 {draftChars - CHAT_MAX_MESSAGE_CHARS} 字，请删减后再发送。
            </p>
          ) : null}

          <div className='mt-2 flex items-center justify-between gap-3'>
            <span
              className={cn(
                'font-mono text-[0.5rem] uppercase tracking-[0.12em]',
                overLimit
                  ? 'text-ember'
                  : draftChars >= CHAT_MAX_MESSAGE_CHARS - 100
                    ? 'text-ochre'
                    : 'text-chalk/30',
              )}
            >
              {draftChars} / {CHAT_MAX_MESSAGE_CHARS} 字
            </span>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setConfirmingClear(true)}
                disabled={messages.length === 0 || clearing}
                className='inline-flex h-8 items-center gap-1.5 border border-chalk/15 px-2.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/45 transition-colors hover:border-chalk/35 hover:text-chalk disabled:cursor-default disabled:opacity-30'
              >
                <Trash2 className='h-3 w-3' />
                清空对话
              </button>
              <button
                type='button'
                onClick={() => void handleSend()}
                disabled={sendDisabled}
                className='inline-flex h-8 items-center gap-1.5 border border-ember/45 bg-ember/15 px-3 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ember transition-colors hover:border-ember/70 hover:bg-ember/20 disabled:cursor-default disabled:opacity-30'
              >
                {sending ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  <Send className='h-3 w-3' />
                )}
                {sending ? '发送中' : '发送'}
              </button>
            </div>
          </div>

          {confirmingClear ? (
            <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border border-ember/30 bg-ember/[0.06] px-3 py-2'>
              <span className='text-xs text-chalk/60'>确认清空整节课的对话？</span>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setConfirmingClear(false)}
                  disabled={clearing}
                  className='h-7 border border-chalk/15 px-2 text-[0.6rem] text-chalk/50 hover:border-chalk/35 hover:text-chalk'
                >
                  取消
                </button>
                <button
                  type='button'
                  onClick={() => void handleClear()}
                  disabled={clearing}
                  className='h-7 border border-ember/45 bg-ember/15 px-2 text-[0.6rem] text-ember hover:bg-ember/25 disabled:opacity-40'
                >
                  {clearing ? '清空中…' : '确认清空'}
                </button>
              </div>
            </div>
          ) : null}

          <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
            <label className='inline-flex items-center gap-1.5 text-[0.6rem] text-chalk/40'>
              <input
                type='checkbox'
                checked={includeMaterials}
                onChange={(event) => setIncludeMaterials(event.target.checked)}
                className='h-3 w-3 accent-[#D9583D]'
              />
              附带课程素材
            </label>
            {remaining !== null ? (
              <span className='font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/30'>
                今日剩余 {remaining}
                {dailyLimit !== null ? ` / ${dailyLimit}` : ''} 次
              </span>
            ) : null}
          </div>

          {sceneTitle ? (
            <p className='mt-2 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/25'>
              当前场景：{sceneTitle}
            </p>
          ) : null}

          {notice ? (
            <p
              role='alert'
              className='mt-3 border border-ember/40 bg-ember/10 px-3 py-2 text-xs leading-6 text-ember'
            >
              {notice}
            </p>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
