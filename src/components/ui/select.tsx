import { cn } from '../../lib/utils';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('min-h-11 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-primary outline-none focus:border-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring/15', className)} {...props} />;
}
