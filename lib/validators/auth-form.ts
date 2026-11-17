import { z } from 'zod';

export type Mode = 'login' | 'register';
export type Channel = 'phone' | 'email';

const CHINA_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

function compactContact(value: string): string {
  return value.trim().replace(/[\s\-()]/g, '').replace(/^\+?86/, '');
}

export function isMobileNumber(value: string): boolean {
  return CHINA_MOBILE_PATTERN.test(compactContact(value));
}

export function isEmailAddress(value: string): boolean {
  return z.string().email().safeParse(value.trim()).success;
}

export function normalizeContact(channel: Channel, value: string): string {
  return channel === 'phone' ? compactContact(value) : value.trim().toLowerCase();
}

const passwordPolicy = z
  .string()
  .min(8, '密码至少需要 8 位')
  .max(128, '密码最多 128 位')
  .regex(/[A-Za-z]/, '密码需要包含字母')
  .regex(/\d/, '密码需要包含数字');

export function buildSchema(mode: Mode) {
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

export type FormValues = z.infer<ReturnType<typeof buildSchema>>;
