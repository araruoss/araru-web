import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '../../lib/utils';

export function Switch({ className, ...props }: BaseSwitch.Root.Props) {
  return <BaseSwitch.Root className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-border p-0.5 outline-none transition data-[checked]:bg-accent focus-visible:ring-2 focus-visible:ring-focus-ring/25', className)} {...props}><BaseSwitch.Thumb className="block h-5 w-5 rounded-full bg-surface shadow-subtle transition-transform data-[checked]:translate-x-5" /></BaseSwitch.Root>;
}
