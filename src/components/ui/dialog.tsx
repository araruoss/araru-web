import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const Dialog = DialogPrimitive;

export function DialogContent({ className, backdropClassName, children }: { className?: string; backdropClassName?: string; children: ReactNode }) {
  return <Dialog.Portal><Dialog.Backdrop className={cn('fixed inset-0 z-50 bg-surface-overlay/45 transition-opacity', backdropClassName)} /><Dialog.Popup className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface-raised p-6 text-primary shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus-ring', className)}>{children}</Dialog.Popup></Dialog.Portal>;
}
