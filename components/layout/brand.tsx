import { cn } from '@/lib/utils/cn';

interface BrandProps {
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}

export function Brand({ inverted = false, compact = false, className }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-ember text-white'>
        <span className='font-display text-[1.65rem] italic leading-none'>t</span>
        <span
          className={cn(
            'absolute right-0 top-0 h-2 w-2',
            inverted ? 'bg-classroom' : 'bg-paper',
          )}
        />
      </span>
      {!compact && (
        <span className='flex flex-col'>
          <span
            className={cn(
              'font-display text-[1.28rem] font-semibold leading-none tracking-[-0.035em]',
              inverted ? 'text-chalk' : 'text-ink',
            )}
          >
            TeachAI
          </span>
          <span
            className={cn(
              'mt-1 font-mono text-[0.52rem] uppercase tracking-[0.22em]',
              inverted ? 'text-chalk/40' : 'text-ink/40',
            )}
          >
            Lesson studio
          </span>
        </span>
      )}
    </div>
  );
}
