import { Input as BaseInput, type InputProps as BaseInputProps } from '@base-ui/react/input';
import { cn } from '../../lib/utils';

export interface InputProps extends BaseInputProps {}

export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn('min-h-11 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-primary outline-none transition focus:border-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring/15 placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60', className)} {...props} />;
}
