import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const Tooltip = BaseTooltip;
export function TooltipContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <BaseTooltip.Portal><BaseTooltip.Positioner><BaseTooltip.Popup className={cn('rounded-md bg-surface-overlay px-2.5 py-1.5 text-caption text-background shadow-subtle', className)}>{children}</BaseTooltip.Popup></BaseTooltip.Positioner></BaseTooltip.Portal>;
}
