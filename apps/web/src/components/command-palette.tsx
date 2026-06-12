'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Plus, Search } from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import { CREATE_ACTIONS, sidebarNavSections } from '@/components/layout/nav-config';
import { PANDU_SUGGESTIONS, routePanduQuery } from '@/components/pandu/pandu-router';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/*
 * The command palette — one deterministic surface for "pergi ke mana saja,
 * buat apa saja, tanya Pandu" (Ctrl+K / ⌘K, or the navbar search button).
 * Honest by construction: every result is a real route; free-text falls
 * through the same keyword router Pandu uses, never a generated answer.
 */

type PaletteEntry = {
  id: string;
  title: string;
  /** Small right-aligned context label (group name / "Pandu · Pratinjau"). */
  hint: string;
  icon: ComponentType<{ className?: string }>;
  href: Route;
  haystack: string;
};

function toHaystack(...parts: Array<string | readonly string[] | undefined>): string {
  return parts.flat().filter(Boolean).join(' ').toLowerCase();
}

const CREATE_ENTRIES: readonly PaletteEntry[] = CREATE_ACTIONS.map((action) => ({
  id: `create:${action.title}`,
  title: action.title,
  hint: 'Buat',
  icon: action.icon,
  href: action.href,
  haystack: toHaystack(action.title, 'buat', action.keywords),
}));

const NAV_ENTRIES: readonly PaletteEntry[] = sidebarNavSections.flatMap((section) =>
  section.items.map((item) => ({
    id: `nav:${item.href}`,
    title: item.title,
    hint: section.label ?? 'Menu',
    icon: item.icon,
    href: item.href,
    haystack: toHaystack(item.title, section.label, item.keywords),
  })),
);

const SUGGESTION_ENTRIES: readonly PaletteEntry[] = PANDU_SUGGESTIONS.map((suggestion) => ({
  id: `suggestion:${suggestion.href}`,
  title: suggestion.label,
  hint: 'Coba ini',
  icon: BrandMark,
  href: suggestion.href,
  haystack: '',
}));

/** Every query token must appear somewhere in the entry's haystack. */
function matches(entry: PaletteEntry, tokens: readonly string[]): boolean {
  return tokens.every((token) => entry.haystack.includes(token));
}

function buildEntries(query: string): readonly PaletteEntry[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return [...CREATE_ENTRIES, ...NAV_ENTRIES];
  }

  const tokens = trimmed.split(/\s+/);
  const hits = [
    ...CREATE_ENTRIES.filter((entry) => matches(entry, tokens)),
    ...NAV_ENTRIES.filter((entry) => matches(entry, tokens)),
  ];

  // Free text falls through Pandu's honest keyword router (navigate-only).
  const destination = routePanduQuery(query);
  if (destination && !hits.some((entry) => entry.href === destination.href)) {
    hits.push({
      id: `pandu:${destination.href}`,
      title: destination.label,
      hint: 'Pandu · Pratinjau',
      icon: BrandMark,
      href: destination.href,
      haystack: '',
    });
  }

  return hits.length > 0 ? hits : SUGGESTION_ENTRIES;
}

type CommandPaletteContextValue = { open: () => void };

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

function PaletteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const entries = useMemo(() => buildEntries(query), [query]);
  const noDirectHit = entries === SUGGESTION_ENTRIES;

  // Reset the draft whenever the palette opens fresh.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, entries]);

  function run(entry: PaletteEntry) {
    onOpenChange(false);
    router.push(entry.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, entries.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = entries[activeIndex];
      if (entry) run(entry);
    }
  }

  // Group rows under eyebrow headings while keeping ONE flat keyboard order.
  let lastHint: string | null = null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-20 max-h-[min(560px,calc(100dvh-6rem))] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Cari &amp; perintah</DialogTitle>
        <DialogDescription className="sr-only">
          Cari menu, buat sesuatu, atau tanya Pandu — pilih dengan panah, buka dengan Enter.
        </DialogDescription>

        <div className="flex items-center gap-2.5 border-b py-2 pr-12 pl-4">
          <Search aria-hidden className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari menu, buat sesuatu, atau tanya Pandu…"
            aria-label="Cari menu atau perintah"
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            aria-activedescendant={
              entries[activeIndex] ? `palette-option-${entries[activeIndex].id}` : undefined
            }
            className="placeholder:text-muted-foreground h-10 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div
          id="command-palette-list"
          role="listbox"
          aria-label="Hasil"
          className="max-h-[min(420px,60svh)] overflow-y-auto p-2"
        >
          {noDirectHit ? (
            <p className="text-muted-foreground px-3 pt-2 pb-1 text-sm">
              Pandu belum paham yang itu — coba salah satu ini:
            </p>
          ) : null}
          {entries.map((entry, index) => {
            const Icon = entry.icon;
            const isActive = index === activeIndex;
            const showHeading = entry.hint !== lastHint && !query.trim() && !noDirectHit;
            lastHint = entry.hint;

            return (
              <div key={entry.id}>
                {showHeading ? (
                  <p className="eyebrow text-muted-foreground px-3 pt-3 pb-1.5 first:pt-1">
                    {entry.hint}
                  </p>
                ) : null}
                <button
                  type="button"
                  id={`palette-option-${entry.id}`}
                  role="option"
                  aria-selected={isActive}
                  ref={isActive ? activeRef : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => run(entry)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md',
                      entry.id.startsWith('create:')
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {entry.id.startsWith('create:') ? (
                      <Plus className="size-3.5" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{entry.hint}</span>
                  {isActive ? (
                    <CornerDownLeft
                      aria-hidden
                      className="text-muted-foreground size-3.5 shrink-0"
                    />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-muted-foreground flex items-center justify-between gap-3 border-t px-4 py-2 text-[11px]">
          <span>
            <kbd className="bg-muted rounded px-1 py-0.5 font-sans">↑↓</kbd> pilih ·{' '}
            <kbd className="bg-muted rounded px-1 py-0.5 font-sans">Enter</kbd> buka
          </span>
          <span>Pandu menjawab lewat navigasi — Pratinjau</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(() => ({ open: () => setOpen(true) }), []);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <PaletteDialog open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

/**
 * The navbar trigger — looks like the search box every seller already knows;
 * teaches the shortcut on md+ the way Linear-style palettes do.
 */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        'border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">Cari atau tanya Pandu…</span>
      <kbd className="bg-muted text-muted-foreground hidden rounded px-1.5 py-0.5 font-sans text-[10px] md:inline-block">
        Ctrl K
      </kbd>
    </button>
  );
}
