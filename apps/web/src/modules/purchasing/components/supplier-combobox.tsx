'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { SupplierOption } from '../types';

type SupplierComboboxProps = {
  id?: string;
  options: SupplierOption[];
  /** Current free-text / picked supplier name. */
  value: string;
  /** Selected saved-supplier id; '' when the name is free text. */
  supplierId: string;
  onChange: (next: { supplierId: string; supplierName: string }) => void;
  placeholder?: string;
};

/**
 * Typeahead for the supplier name: type to filter saved suppliers and pick one, OR keep typing
 * a name that isn't saved (used as free text — `supplierId` stays ''). A lightweight combobox
 * over the shared `Input`; the list keeps input focus via mousedown-preventDefault so a click
 * registers without blurring, and an outside blur closes it. No extra primitive needed.
 */
export function SupplierCombobox({
  id,
  options,
  value,
  supplierId,
  onChange,
  placeholder,
}: SupplierComboboxProps) {
  const [open, setOpen] = useState(false);

  const trimmed = value.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      trimmed ? options.filter((option) => option.name.toLowerCase().includes(trimmed)) : options,
    [options, trimmed],
  );
  // Typed text that matches no saved supplier → it'll be used as a new free-text name.
  const isNewName =
    value.trim().length > 0 && !options.some((option) => option.name.toLowerCase() === trimmed);

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          // Typing makes it free text until a row is picked.
          onChange({ supplierId: '', supplierName: event.target.value });
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      />

      {open && (filtered.length > 0 || isNewName) ? (
        <ul
          className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-md"
          // Keep focus in the input so a click picks a row before onBlur closes the list.
          onMouseDown={(event) => event.preventDefault()}
        >
          {filtered.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ supplierId: option.id, supplierName: option.name });
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  supplierId === option.id && 'bg-accent/60',
                )}
              >
                <span className="truncate">{option.name}</span>
                {supplierId === option.id ? <Check className="size-4 shrink-0" /> : null}
              </button>
            </li>
          ))}
          {isNewName ? (
            <li className="text-muted-foreground border-t px-2 py-1.5 text-xs first:border-t-0">
              Pakai “{value.trim()}” sebagai pemasok baru
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
