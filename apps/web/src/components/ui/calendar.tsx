'use client';

import type { ComponentProps } from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = ComponentProps<typeof DayPicker>;

/** Thin wrapper over react-day-picker; themed via the `.rdp-olshop` rules in globals.css. */
export function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn('rdp-olshop p-3', className)} {...props} />;
}
