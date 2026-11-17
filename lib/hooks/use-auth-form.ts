'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  loginUser,
  registerUser,
  sendRegistrationCode,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { messageForError, retryAfterSeconds } from '@/lib/utils/auth-errors';
import {
  buildSchema,
  isEmailAddress,
  isMobileNumber,
  normalizeContact,
  type Channel,
  type FormValues,
  type Mode,
} from '@/lib/validators/auth-form';

export function useAuthForm({
  mode,
  destination,
}: {
  mode: Mode;
  destination: string;
}) {
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
      if (
        error instanceof ApiError &&
        (error.code === 'VERIFICATION_RESEND_TOO_SOON' ||
          error.code === 'SMS_SEND_RATE_LIMITED')
      ) {
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

  const clearCodeError = () => setCodeError(null);

  return {
    formError,
    codeError,
    clearCodeError,
    codeNotice,
    sendingCode,
    seconds,
    sentTarget,
    register,
    errors,
    isSubmitting,
    codeField,
    channel,
    contactLabel,
    toggleChannel,
    onSendCode,
    onSubmit,
  };
}

export type AuthFormState = ReturnType<typeof useAuthForm>;
