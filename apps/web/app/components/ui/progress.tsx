'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Progress = forwardRef<
  ElementRef<typeof ProgressPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
    value?: number;
  }
>(function Progress({ className, indicatorClassName, value = 0, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cx('relative h-2.5 w-full overflow-hidden rounded-full bg-[#F3E8E9]', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cx('h-full rounded-full bg-[#A10E4D] transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
