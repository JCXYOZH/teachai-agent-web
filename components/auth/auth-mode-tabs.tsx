'use client';

import type { Mode } from '@/lib/validators/auth-form';

export function AuthModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div role='tablist' aria-label='登录或注册' className='mt-8 flex gap-8 border-b border-ink/15'>
      <button
        type='button'
        role='tab'
        aria-selected={mode === 'login'}
        onClick={() => onChange('login')}
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
        onClick={() => onChange('register')}
        className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
          mode === 'register'
            ? 'border-ember text-ink'
            : 'border-transparent text-ink/40 hover:text-ink/70'
        }`}
      >
        创建账号
      </button>
    </div>
  );
}
