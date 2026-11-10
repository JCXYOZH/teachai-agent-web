'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowUpRight, Loader2, Mail, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  loginUser,
  registerUser,
  sendRegistrationCode,
} from '@/lib/api/auth';
import { ApiError, ApiNetworkError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

type Mode = 'login' | 'register';
type Channel = 'phone' | 'email';

const CHINA_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

function compactContact(value: string): string {
  return value.trim().replace(/[\s\-()]/g, '').replace(/^\+?86/, '');
}

function isMobileNumber(value: string): boolean {
  return CHINA_MOBILE_PATTERN.test(compactContact(value));
}

function isEmailAddress(value: string): boolean {
  return z.string().email().safeParse(value.trim()).success;
}

function normalizeContact(channel: Channel, value: string): string {
  return channel === 'phone' ? compactContact(value) : value.trim().toLowerCase();
}

const passwordPolicy = z
  .string()
  .min(8, '密码至少需要 8 位')
  .max(128, '密码最多 128 位')
  .regex(/[A-Za-z]/, '密码需要包含字母')
  .regex(/\d/, '密码需要包含数字');

function buildSchema(mode: Mode) {
  return z
    .object({
      identifier: z.string().trim().optional(),
      channel: z.enum(['phone', 'email']),
      contact: z.string().trim().optional(),
      password: z.string(),
      display_name: z.string().trim().max(80, '称呼最多 80 个字符').optional(),
      code: z.string().trim().optional(),
    })
    .superRefine((values, ctx) => {
      if (mode === 'login') {
        const identifier = (values.identifier ?? '').trim();
        if (!identifier || (!isMobileNumber(identifier) && !isEmailAddress(identifier))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['identifier'],
            message: '请输入手机号或邮箱',
          });
        }
        if (!values.password) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: '请输入密码',
          });
        } else if (values.password.length > 128) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: '密码过长',
          });
        }
        return;
      }

      const contact = (values.contact ?? '').trim();
      if (!contact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contact'],
          message: values.channel === 'phone' ? '请输入手机号' : '请输入邮箱',
        });
      } else if (values.channel === 'phone' && !isMobileNumber(contact)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contact'],
          message: '请输入 11 位手机号',
        });
      } else if (values.channel === 'email' && !isEmailAddress(contact)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contact'],
          message: '邮箱格式不正确',
        });
      }

      const passwordResult = passwordPolicy.safeParse(values.password);
      if (!passwordResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: passwordResult.error.issues[0]?.message ?? '密码不符合要求',
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const copy = {
  login: {
    eyebrow: 'SIGN IN / 教师工作台',
    title: '回到你的备课桌',
    description: '继续整理大纲、素材与下一堂课。',
    submit: '进入备课桌',
  },
  register: {
    eyebrow: 'NEW ACCOUNT / 新账户',
    title: '从一张新讲义开始',
    description: '建立你的课程空间，先从一个想法写起。',
    submit: '验证并创建账号',
  },
};

function messageForError(error: unknown): string {
  if (error instanceof ApiNetworkError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: '手机号/邮箱或密码不正确，请重新输入。',
      EMAIL_ALREADY_REGISTERED: '这个邮箱已经注册，可以直接登录。',
      PHONE_ALREADY_REGISTERED: '这个手机号已经注册，可以直接登录。',
      EMAIL_VERIFICATION_NOT_FOUND: '请先点击“发送验证码”，再提交注册。',
      PHONE_VERIFICATION_NOT_FOUND: '请先点击“发送验证码”，再提交注册。',
      VERIFICATION_CODE_EXPIRED: '验证码已过期，请重新发送。',
      INVALID_VERIFICATION_CODE: '验证码不正确，请检查后重试。',
      VERIFICATION_ATTEMPTS_EXCEEDED: '尝试次数过多，请重新发送验证码。',
      VERIFICATION_RESEND_TOO_SOON: '发送太频繁，请稍后再试。',
      EMAIL_DELIVERY_UNAVAILABLE: '验证邮件暂时无法发送，请稍后再试。',
      SMS_DELIVERY_UNAVAILABLE: '验证短信暂时无法发送，请稍后再试。',
      REGISTRATION_ALREADY_PENDING: '验证码刚刚已发送，请稍候再试。',
      VALIDATION_ERROR: '请检查填写内容后重试。',
      CSRF_INVALID: '会话校验失败，请刷新页面后重试。',
      INVALID_REFRESH_TOKEN: '会话已过期，请重新登录。',
    };
    return messages[error.code] ?? error.message;
  }
  return '暂时无法完成请求，请稍后再试。';
}

function safeDestination(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/library';
}

function retryAfterSeconds(details: unknown): number {
  if (details && typeof details === 'object' && 'retry_after' in details) {
    const value = (details as { retry_after?: unknown }).retry_after;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.ceil(value);
    }
  }
  return 60;
}

interface AuthFormProps {
  mode: Mode;
  destination: string;
}

function AuthForm({ mode, destination }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sentTarget, setSentTarget] = useState<string | null>(null);
  const resolver = useMemo(() => zodResolver(buildSchema(mode)), [mode]);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      identifier: '',
      channel: 'phone',
      contact: '',
      password: '',
      display_name: '',
      code: '',
    },
    mode: 'onSubmit',
  });
  const channel: Channel = watch('channel');
  const contactValue = watch('contact') ?? '';
  const codeField = register('code');

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    if (!sentTarget) {
      return;
    }
    if (normalizeContact(channel, contactValue) !== sentTarget) {
      setSentTarget(null);
      setSeconds(0);
      setCodeNotice(null);
      setCodeError(null);
    }
  }, [channel, contactValue, sentTarget]);

  const toggleChannel = () => {
    const nextChannel: Channel = channel === 'phone' ? 'email' : 'phone';
    const current = getValues('contact') ?? '';
    const keepContact =
      nextChannel === 'phone' ? isMobileNumber(current) : isEmailAddress(current);
    setValue('channel', nextChannel, { shouldValidate: false });
    if (!keepContact) {
      setValue('contact', '', { shouldValidate: false });
    }
    setFormError(null);
    setCodeError(null);
    setCodeNotice(null);
  };

  const onSendCode = async () => {
    setFormError(null);
    setCodeError(null);
    setCodeNotice(null);
    if (!(await trigger('contact'))) {
      return;
    }
    const contact = getValues('contact')?.trim() ?? '';
    if (!contact) {
      return;
    }
    const activeChannel: Channel = getValues('channel');
    setSendingCode(true);
    try {
      const response = await sendRegistrationCode(
        normalizeContact(activeChannel, contact),
        activeChannel,
      );
      setSentTarget(normalizeContact(activeChannel, contact));
      setSeconds(response.resend_after);
      setCodeNotice(
        `验证码已发送至 ${response.target}，${Math.max(
          1,
          Math.round(response.expires_in / 60),
        )} 分钟内有效。`,
      );
      toast.success(
        activeChannel === 'phone' ? '验证码已发送，请查收短信' : '验证码已发送，请查收邮箱',
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VERIFICATION_RESEND_TOO_SOON') {
        setSentTarget(normalizeContact(activeChannel, contact));
        setSeconds(retryAfterSeconds(error.details));
      }
      if (
        error instanceof ApiError &&
        (error.code === 'EMAIL_ALREADY_REGISTERED' ||
          error.code === 'PHONE_ALREADY_REGISTERED' ||
          error.code === 'EMAIL_DELIVERY_UNAVAILABLE' ||
          error.code === 'SMS_DELIVERY_UNAVAILABLE')
      ) {
        setFormError(messageForError(error));
      } else {
        setCodeError(messageForError(error));
      }
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setCodeError(null);
    try {
      if (mode === 'login') {
        await loginUser({
          identifier: (values.identifier ?? '').trim(),
          password: values.password,
        });
        toast.success('欢迎回来');
      } else {
        const code = values.code?.trim() ?? '';
        const activeChannel: Channel = values.channel;
        if (!/^\d{6}$/.test(code)) {
          setCodeError(
            activeChannel === 'phone'
              ? '请输入短信中的 6 位验证码。'
              : '请输入邮件中的 6 位验证码。',
          );
          return;
        }
        const contact = normalizeContact(activeChannel, values.contact ?? '');
        await registerUser({
          ...(activeChannel === 'phone' ? { phone: contact } : { email: contact }),
          password: values.password,
          display_name: values.display_name?.trim() || undefined,
          code,
        });
        toast.success(activeChannel === 'phone' ? '手机号已验证，欢迎加入' : '邮箱已验证，欢迎加入');
      }
      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (
        mode === 'register' &&
        error instanceof ApiError &&
        [
          'EMAIL_VERIFICATION_NOT_FOUND',
          'PHONE_VERIFICATION_NOT_FOUND',
          'VERIFICATION_CODE_EXPIRED',
          'INVALID_VERIFICATION_CODE',
          'VERIFICATION_ATTEMPTS_EXCEEDED',
        ].includes(error.code)
      ) {
        setCodeError(messageForError(error));
        return;
      }
      setFormError(messageForError(error));
    }
  });

  const contactLabel = channel === 'phone' ? '手机号' : '邮箱';

  return (
    <form className='mt-8' onSubmit={onSubmit} noValidate>
      {formError && (
        <div
          role='alert'
          className='mb-6 flex items-start gap-3 border-l-2 border-ember bg-ember/[0.06] px-4 py-3 text-sm leading-6 text-ember-dark'
        >
          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
          <span>{formError}</span>
        </div>
      )}

      <div className='space-y-7'>
        {mode === 'login' ? (
          <div>
            <label htmlFor='identifier' className='eyebrow'>
              手机号或邮箱
            </label>
            <Input
              id='identifier'
              type='text'
              inputMode='text'
              autoComplete='username'
              placeholder='13800138000 或 you@school.edu'
              invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
              {...register('identifier')}
            />
            {errors.identifier && (
              <p id='identifier-error' className='mt-2 text-xs text-ember-dark'>
                {errors.identifier.message}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor='contact' className='eyebrow'>
              {contactLabel}
            </label>
            <Input
              id='contact'
              type={channel === 'phone' ? 'tel' : 'email'}
              inputMode={channel === 'phone' ? 'tel' : 'email'}
              autoComplete={channel === 'phone' ? 'tel' : 'email'}
              placeholder={channel === 'phone' ? '13800138000' : 'you@school.edu'}
              invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? 'contact-error' : undefined}
              {...register('contact')}
            />
            {errors.contact && (
              <p id='contact-error' className='mt-2 text-xs text-ember-dark'>
                {errors.contact.message}
              </p>
            )}
            <p className='mt-2 text-xs text-ink/40'>
              {channel === 'phone' ? '想用邮箱注册？' : '想用手机号注册？'}
              <button
                type='button'
                onClick={toggleChannel}
                className='ml-1 text-ink/60 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink'
              >
                {channel === 'phone' ? '使用邮箱注册' : '使用手机号注册'}
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label htmlFor='display_name' className='eyebrow'>
              你的称呼 <span className='normal-case tracking-normal text-ink/30'>可选</span>
            </label>
            <Input
              id='display_name'
              type='text'
              autoComplete='name'
              placeholder='例如：林老师'
              invalid={Boolean(errors.display_name)}
              aria-describedby={errors.display_name ? 'display-name-error' : undefined}
              {...register('display_name')}
            />
            {errors.display_name && (
              <p id='display-name-error' className='mt-2 text-xs text-ember-dark'>
                {errors.display_name.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor='password' className='eyebrow'>
            密码
          </label>
          <Input
            id='password'
            type='password'
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder='••••••••'
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id='password-error' className='mt-2 text-xs text-ember-dark'>
              {errors.password.message}
            </p>
          ) : (
            mode === 'register' && (
              <p className='mt-2 text-xs text-ink/40'>至少 8 位，包含字母与数字。</p>
            )
          )}
        </div>

        {mode === 'register' && (
          <div className='border border-ink/10 bg-ink/[0.02] px-4 py-4'>
            <label htmlFor='verification-code' className='eyebrow'>
              {channel === 'phone' ? '短信验证码' : '邮箱验证码'}
            </label>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
              <div className='min-w-0 flex-1'>
                <Input
                  id='verification-code'
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  maxLength={6}
                  placeholder='000000'
                  invalid={Boolean(codeError)}
                  aria-describedby={
                    codeError ? 'code-error' : codeNotice ? 'code-notice' : undefined
                  }
                  className='text-center font-mono text-lg tracking-[0.45em]'
                  {...codeField}
                  onChange={(event) => {
                    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
                    void codeField.onChange(event);
                    setCodeError(null);
                  }}
                />
              </div>
              <Button
                type='button'
                variant='outline'
                size='md'
                className='w-full shrink-0 sm:mb-px sm:w-auto'
                onClick={onSendCode}
                disabled={sendingCode || seconds > 0}
                aria-busy={sendingCode}
              >
                {sendingCode
                  ? '发送中…'
                  : seconds > 0
                    ? `${seconds} 秒后重发`
                    : sentTarget
                      ? '重新发送'
                      : '发送验证码'}
              </Button>
            </div>
            {codeError && (
              <p id='code-error' role='alert' className='mt-3 text-xs text-ember-dark'>
                {codeError}
              </p>
            )}
            {codeNotice && !codeError && (
              <p
                id='code-notice'
                role='status'
                className='mt-3 flex items-start gap-2 text-xs leading-5 text-ink/50'
              >
                {channel === 'phone' ? (
                  <MessageSquare className='mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-dark' />
                ) : (
                  <Mail className='mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-dark' />
                )}
                <span>{codeNotice}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <Button
        type='submit'
        variant='ember'
        size='lg'
        block
        className='mt-9 justify-between px-5'
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        <span>
          {isSubmitting
            ? mode === 'login'
              ? '正在进入…'
              : '正在创建…'
            : copy[mode].submit}
        </span>
        {isSubmitting ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <ArrowUpRight className='h-4 w-4' />
        )}
      </Button>

      <p className='mt-5 text-center text-[0.7rem] leading-5 text-ink/35'>
        你的课程与素材只在当前账户内可见。
      </p>
    </form>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login');
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const destination = safeDestination(searchParams.get('next'));

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(destination);
    }
  }, [destination, router, status]);

  return (
    <div className='w-full max-w-[29rem] animate-rise'>
      <p className='eyebrow'>{copy[mode].eyebrow}</p>
      <h2 className='mt-4 font-display text-display-md font-medium text-ink'>{copy[mode].title}</h2>
      <p className='mt-3 max-w-sm text-sm leading-6 text-ink/50'>{copy[mode].description}</p>

      <div role='tablist' aria-label='登录或注册' className='mt-8 flex gap-8 border-b border-ink/15'>
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'login'}
          onClick={() => setMode('login')}
          className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
            mode === 'login'
              ? 'border-ember text-ink'
              : 'border-transparent text-ink/40 hover:text-ink/70'
          }`}
        >
          登录
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'register'}
          onClick={() => setMode('register')}
          className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
            mode === 'register'
              ? 'border-ember text-ink'
              : 'border-transparent text-ink/40 hover:text-ink/70'
          }`}
        >
          创建账号
        </button>
      </div>

      <AuthForm key={mode} mode={mode} destination={destination} />
    </div>
  );
}
