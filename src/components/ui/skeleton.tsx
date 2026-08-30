import { cn } from '../../lib/utils';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-surface-raised', className)} />;
}

export function WorkCardSkeleton() {
  return <div className="space-y-3"><Skeleton className="aspect-[2/3] w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>;
}
