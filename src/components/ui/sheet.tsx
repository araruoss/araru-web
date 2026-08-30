import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive;

export function SheetContent({ side = 'right', className, children }: { side?: 'left' | 'right' | 'bottom'; className?: string; children: ReactNode }) {
  const placement = side === 'bottom' ? 'inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-lg' : `inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full w-[min(88vw,420px)]`;
  return <Sheet.Portal><Sheet.Backdrop className="fixed inset-0 z-50 bg-surface-overlay/45" /><Sheet.Popup className={cn('fixed z-50 overflow-y-auto border border-border bg-surface-raised p-5 text-primary shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus-ring', placement, className)}>{children}</Sheet.Popup></Sheet.Portal>;
}
