'use client';

import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils/cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className='fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-6'
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative max-h-[92vh] w-full overflow-y-auto border border-ink/15 bg-paper shadow-stage',
          'animate-rise rounded-t-[12px] p-6 sm:rounded-none sm:p-7',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <div className='pointer-events-none absolute inset-0 bg-paper-grid bg-grid-32 opacity-20' />
        <div className='relative flex items-start justify-between gap-6'>
          <div>
            <p className='eyebrow'>TeachAI / Workspace</p>
            <h2
              id={titleId}
              className='mt-3 font-display text-2xl font-medium tracking-[-0.03em] text-ink sm:text-[1.75rem]'
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className='mt-2 max-w-lg text-sm leading-6 text-ink/45'>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='flex h-9 w-9 shrink-0 items-center justify-center border border-ink/10 text-ink/40 transition-colors hover:border-ink/25 hover:text-ink'
            aria-label='关闭'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='relative mt-7'>{children}</div>
        {footer ? (
          <div className='relative mt-7 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end'>
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
