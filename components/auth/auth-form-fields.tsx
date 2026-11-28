'use client';

import { Mail, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuthFormState } from '@/lib/hooks/use-auth-form';
import { cooldownLabel } from '@/lib/utils/auth-errors';
import type { Mode } from '@/lib/validators/auth-form';

export function AuthFormFields({
  mode,
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
  onSendCode,
  onToggleChannel,
  onClearCodeError,
}: {
  mode: Mode;
  channel: AuthFormState['channel'];
  contactLabel: AuthFormState['contactLabel'];
  register: AuthFormState['register'];
  errors: AuthFormState['errors'];
  codeField: AuthFormState['codeField'];
  codeError: AuthFormState['codeError'];
  codeNotice: AuthFormState['codeNotice'];
  sendingCode: AuthFormState['sendingCode'];
  seconds: AuthFormState['seconds'];
  sentTarget: AuthFormState['sentTarget'];
  onSendCode: AuthFormState['onSendCode'];
  onToggleChannel: AuthFormState['toggleChannel'];
  onClearCodeError: AuthFormState['clearCodeError'];
}) {
  return (
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
              onClick={onToggleChannel}
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
            placeholder='例如：林老师 / 张学生'
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
                  onClearCodeError();
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
                  ? cooldownLabel(seconds)
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
  );
}
