import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] font-sans text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-paper hover:bg-ink-soft',
        ember: 'bg-ember text-white shadow-button hover:bg-ember-dark',
        outline: 'border border-ink/20 bg-transparent text-ink hover:border-ink/40 hover:bg-ink/[0.04]',
        ghost: 'text-ink/65 hover:bg-ink/[0.05] hover:text-ink',
        light: 'bg-chalk text-classroom hover:bg-white',
      },
      size: {
        sm: 'h-9 px-3.5 text-[0.8rem]',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-[0.95rem]',
        icon: 'h-10 w-10',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  ),
);

Button.displayName = 'Button';

export { buttonVariants };
