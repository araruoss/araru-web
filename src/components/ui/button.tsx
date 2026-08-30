import { Button as BaseButton, type ButtonProps as BaseButtonProps } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva('araru-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px', {
  variants: {
    variant: {
      primary: 'bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active',
      secondary: 'border border-border bg-surface text-primary hover:bg-surface-raised',
      ghost: 'text-secondary hover:bg-surface-raised hover:text-primary',
      danger: 'bg-danger text-inverse hover:brightness-95',
      icon: 'text-secondary hover:bg-surface-raised hover:text-primary'
    },
    size: {
      sm: 'min-h-9 rounded-md px-3 text-label',
      md: 'min-h-11 rounded-md px-4 text-body-sm',
      lg: 'min-h-12 rounded-lg px-5 text-body',
      icon: 'h-11 w-11 rounded-md'
    }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
});

export interface ButtonProps extends BaseButtonProps, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, ...props }, ref) {
  return <BaseButton ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { buttonVariants };
