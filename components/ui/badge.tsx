import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-zinc-900 text-white': variant === 'default',
          'bg-zinc-100 text-zinc-700': variant === 'secondary',
          'bg-red-100 text-red-700': variant === 'destructive',
          'border border-zinc-200 text-zinc-700': variant === 'outline',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
}
