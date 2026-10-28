'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginUser, registerUser } from '@/lib/api/auth';
import { ApiError, ApiNetworkError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

type Mode = 'login' | 'register';

const loginSchema = z.object({
  email: z.string().trim().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码').max(128, '密码过长'),
  display_name: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().trim().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少需要 8 位')
    .max(128, '密码最多 128 位')
    .regex(/[A-Za-z]/, '密码需要包含字母')
    .regex(/\d/, '密码需要包含数字'),
  display_name: z.string().trim().max(80, '称呼最多 80 个字符').optional(),
});

type FormValues = z.infer<typeof registerSchema>;

const schemas: Record<Mode, z.ZodType<FormValues>> = {
  login: loginSchema,
  register: registerSchema,
};

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
    submit: '创建备课桌',
  },
};

function messageForError(error: unknown): string {
  if (error instanceof ApiNetworkError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_CREDENTIALS: '邮箱或密码不正确，请重新输入。',
      EMAIL_ALREADY_REGISTERED: '这个邮箱已经注册，可以直接登录。',
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

interface AuthFormProps {
  mode: Mode;
  destination: string;
}

function AuthForm({ mode, destination }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemas[mode]),
    defaultValues: { email: '', password: '', display_name: '' },
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (mode === 'login') {
        await loginUser({ email: values.email, password: values.password });
        toast.success('欢迎回来');
      } else {
        await registerUser({
          email: values.email,
          password: values.password,
          display_name: values.display_name?.trim() || undefined,
        });
        toast.success('备课桌准备好了');
      }
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setFormError(messageForError(error));
    }
  });

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
        <div>
          <label htmlFor='email' className='eyebrow'>
            邮箱
          </label>
          <Input
            id='email'
            type='email'
            inputMode='email'
            autoComplete='email'
            placeholder='you@school.edu'
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id='email-error' className='mt-2 text-xs text-ember-dark'>
              {errors.email.message}
            </p>
          )}
        </div>

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
        <span>{isSubmitting ? '正在整理…' : copy[mode].submit}</span>
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
