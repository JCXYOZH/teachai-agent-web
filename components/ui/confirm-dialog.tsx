'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  pending = false,
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant='outline' onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button
            variant={destructive ? 'ember' : 'primary'}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? '处理中…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className='border-l-2 border-ember/60 bg-ember/[0.04] px-4 py-3 text-xs leading-6 text-ink/55'>
        此操作会立即影响当前工作台；素材文件本身不会被物理删除。
      </div>
    </Dialog>
  );
}
