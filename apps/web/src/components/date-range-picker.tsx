'use client';

import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function formatRange(range: DateRange | undefined, placeholder: string): string {
  if (!range?.from) return placeholder;
  if (!range.to) return format(range.from, 'd MMM yyyy');
  return `${format(range.from, 'd MMM yyyy')} – ${format(range.to, 'd MMM yyyy')}`;
}

/** Single-popover from–to date range picker (react-day-picker range mode). */
export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Any date',
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 justify-start gap-2 font-normal',
            !value?.from && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate">{formatRange(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} autoFocus />
        {value?.from ? (
          <div className="flex justify-end border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
