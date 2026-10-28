import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-12 w-full rounded-none border-0 border-b bg-transparent px-0 font-sans text-[0.95rem] text-ink placeholder:text-ink/30 focus:border-ember focus:outline-none focus:ring-0',
        invalid ? 'border-ember' : 'border-ink/20',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
