import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Tabs({ defaultValue, children, className = '' }: { defaultValue: string; children: ReactNode; className?: string }) {
  return <div className={cn('space-y-4', className)} data-value={defaultValue}>{children}</div>;
}

export function TabsList({ children }: { children: ReactNode }) { return <div role="tablist" className="flex gap-1 border-b border-border-subtle">{children}</div>; }
export function TabsTrigger({ value, activeValue, onSelect, children }: { value: string; activeValue?: string; onSelect?: (value: string) => void; children: ReactNode }) { return <button type="button" role="tab" aria-selected={activeValue === value} onClick={() => onSelect?.(value)} className={cn('min-h-11 border-b-2 border-transparent px-3 text-body-sm text-secondary hover:text-primary', activeValue === value && 'border-accent text-primary')}>{children}</button>; }
