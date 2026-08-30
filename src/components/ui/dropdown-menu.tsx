import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const DropdownMenu = Object.assign(BaseMenu.Root, { Trigger: BaseMenu.Trigger });
export function DropdownMenuContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <BaseMenu.Portal><BaseMenu.Positioner><BaseMenu.Popup className={cn('min-w-44 rounded-md border border-border bg-surface p-1 text-primary shadow-raised outline-none', className)}>{children}</BaseMenu.Popup></BaseMenu.Positioner></BaseMenu.Portal>;
}
export function DropdownMenuItem({ children, className = '', ...props }: BaseMenu.Item.Props) {
  return <BaseMenu.Item className={cn('flex min-h-10 cursor-pointer items-center rounded-sm px-3 text-body-sm text-secondary outline-none data-[highlighted]:bg-surface-raised data-[highlighted]:text-primary', className)} {...props}>{children}</BaseMenu.Item>;
}
