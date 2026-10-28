import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]',
  {
    variants: {
      tone: {
        neutral: 'border-ink/15 bg-paper/50 text-ink/55',
        ember: 'border-ember/30 bg-ember/10 text-ember-dark',
        sage: 'border-sage/50 bg-sage/15 text-ink/65',
        dark: 'border-chalk/15 bg-chalk/[0.06] text-chalk/60',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
