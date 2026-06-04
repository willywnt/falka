'use client';

import { useState } from 'react';
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

/**
 * Single-popover from–to date range picker. Selection is held as a draft and only
 * committed (via `onChange`) when the user clicks Apply, so the caller doesn't
 * re-query on every day click.
 */
export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Date range',
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(value);
    setOpen(next);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    setDraft(undefined);
    onChange(undefined);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 min-w-44 justify-start gap-2 font-normal',
            !value?.from && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate">{formatRange(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={draft} onSelect={setDraft} numberOfMonths={2} autoFocus />
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="ghost" size="sm" onClick={clear} disabled={!draft?.from}>
            Clear
          </Button>
          <Button size="sm" onClick={apply} disabled={!draft?.from}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
