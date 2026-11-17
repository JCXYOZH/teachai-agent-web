'use client';

import { AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthFormFields } from '@/components/auth/auth-form-fields';
import { AuthModeTabs } from '@/components/auth/auth-mode-tabs';
import { Button } from '@/components/ui/button';
import { useAuthForm } from '@/lib/hooks/use-auth-form';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Mode } from '@/lib/validators/auth-form';

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

function safeDestination(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/library';
}

interface AuthFormProps {
  mode: Mode;
  destination: string;
}
function AuthForm({ mode, destination }: AuthFormProps) {
  const {
    formError,
    isSubmitting,
    onSubmit,
    channel,
    contactLabel,
    register,
    errors,
    codeField,
    codeError,
    codeNotice,
    sendingCode,
    seconds,
    sentTarget,
    toggleChannel,
    onSendCode,
    clearCodeError,
  } = useAuthForm({ mode, destination });

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

      <AuthFormFields
        mode={mode}
        channel={channel}
        contactLabel={contactLabel}
        register={register}
        errors={errors}
        codeField={codeField}
        codeError={codeError}
        codeNotice={codeNotice}
        sendingCode={sendingCode}
        seconds={seconds}
        sentTarget={sentTarget}
        onSendCode={onSendCode}
        onToggleChannel={toggleChannel}
        onClearCodeError={clearCodeError}
      />

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

      <AuthModeTabs mode={mode} onChange={setMode} />

      <AuthForm key={mode} mode={mode} destination={destination} />
    </div>
  );
}
