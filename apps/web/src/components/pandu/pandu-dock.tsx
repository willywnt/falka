'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  ChevronsRight,
  Clock,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import { isShellSuppressedRoute } from '@/components/layout/nav-config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePanduStore } from '@/store/pandu-store';
import { cn } from '@/lib/utils';

import { usePanduNudges, type PanduNudge } from './pandu-nudges';
import { PANDU_SUGGESTIONS, routePanduQuery } from './pandu-router';
import { usePanduContext } from './use-pandu-context';

function NudgeRow({ nudge, onDismiss }: { nudge: PanduNudge; onDismiss: (id: string) => void }) {
  const Icon = nudge.tone === 'urgent' ? TriangleAlert : Info;

  return (
    <li className="bg-card flex items-start gap-2.5 rounded-lg border p-3">
      <Icon
        aria-hidden
        className={cn(
          'mt-0.5 size-4 shrink-0',
          nudge.tone === 'urgent' ? 'text-highlight-strong' : 'text-muted-foreground',
        )}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm text-pretty">{nudge.text}</p>
        <Button size="sm" variant="outline" className="h-7" asChild>
          <Link href={nudge.href}>
            {nudge.actionLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground -mt-1 -mr-1 size-7"
        onClick={() => onDismiss(nudge.id)}
      >
        <X className="size-3.5" />
        <span className="sr-only">Abaikan catatan ini</span>
      </Button>
    </li>
  );
}

/* A press is a drag once the pointer travels this far; below it, it's a click. */
const DRAG_THRESHOLD_PX = 6;

/** Keep the pill reachable: never under the very bottom, never off the top. */
function clampOffset(offset: number): number {
  const max = typeof window === 'undefined' ? offset : window.innerHeight - 96;
  return Math.min(Math.max(offset, 12), Math.max(12, max));
}

/**
 * The Pandu dock — the assistant's persistent home (Suar Dermaga pattern):
 * a compact falcon-eye pill opening a sea-glass card with proactive notes
 * (real data, rule-ranked) and an honest navigate-only question bar. The
 * pill is draggable along the right edge and can tuck into a slim edge tab
 * (both persisted) so it never has to sit on top of someone's work.
 */
export function PanduDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { nudges, hasUrgent, isLoading, isError, dismissNudge } = usePanduNudges();
  const { sectionLabel, chips } = usePanduContext();
  const urgentNudges = nudges.filter((nudge) => nudge.group === 'urgent');
  const calmNudges = nudges.filter((nudge) => nudge.group !== 'urgent');

  const dockCollapsed = usePanduStore((state) => state.dockCollapsed);
  const setDockCollapsed = usePanduStore((state) => state.setDockCollapsed);
  const dockBottomOffset = usePanduStore((state) => state.dockBottomOffset);
  const setDockBottomOffset = usePanduStore((state) => state.setDockBottomOffset);
  const askHistory = usePanduStore((state) => state.askHistory);
  const recordAsk = usePanduStore((state) => state.recordAsk);
  const clearAskHistory = usePanduStore((state) => state.clearAskHistory);

  // Live offset while a drag is in flight (committed to the store on release).
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  // Dock placement depends on localStorage-persisted state — render it only
  // after mount so SSR and the first client paint agree.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close (and clear the draft) whenever the user navigates.
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setNoMatch(false);
  }, [pathname]);

  if (isShellSuppressedRoute(pathname)) {
    return null;
  }

  const offset = dragOffset ?? (mounted ? dockBottomOffset : null);
  const offsetStyle = offset != null ? { bottom: clampOffset(offset) } : undefined;
  // The card grows upward to 75svh — anchor it low even when the pill rides high.
  const cardOffsetStyle =
    offset != null
      ? { bottom: Math.min(clampOffset(offset), Math.max(12, window.innerHeight * 0.2)) }
      : undefined;
  const defaultBottomClass = offset == null ? 'bottom-20 md:bottom-4' : '';
  const collapsed = mounted && dockCollapsed;

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: window.innerHeight - rect.bottom,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    setDragOffset(clampOffset(drag.startOffset + dy));
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragState.current = null;
    if (drag.moved) {
      // The click that trails this pointerup belongs to the drag, not a press.
      suppressClickRef.current = true;
      setDockBottomOffset(clampOffset(drag.startOffset + (drag.startY - event.clientY)));
    }
    setDragOffset(null);
  }

  function handlePillClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen(true);
  }

  function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    const destination = routePanduQuery(query);
    if (destination) {
      setNoMatch(false);
      recordAsk({ query: query.trim(), label: destination.label, href: destination.href });
      router.push(destination.href);
      return;
    }
    setNoMatch(true);
  }

  if (open) {
    return (
      <section
        aria-label="Pandu — pemandu tokomu"
        style={cardOffsetStyle}
        className={cn(
          'bg-sea-glass animate-in fade-in slide-in-from-bottom-3 ease-tide fixed inset-x-3 z-50 flex max-h-[75svh] flex-col overflow-hidden rounded-xl border shadow-lg duration-300 sm:inset-x-auto sm:right-4 sm:w-[360px]',
          defaultBottomClass,
        )}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <BrandMark className="text-primary size-4.5" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
            Pandu <span className="text-muted-foreground font-normal">— pemandu tokomu</span>
          </p>
          <Badge variant="outline" className="text-muted-foreground text-[10px] uppercase">
            Pratinjau
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7"
            onClick={() => {
              setOpen(false);
              setDockCollapsed(true);
            }}
          >
            <ChevronsRight className="size-4" />
            <span className="sr-only">Sembunyikan Pandu ke tepi layar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Tutup Pandu</span>
          </Button>
        </header>

        <div
          className="flex-1 space-y-3 overflow-y-auto p-4"
          aria-busy={isLoading}
          aria-live="polite"
        >
          {chips.length > 0 ? (
            <div className="space-y-2 border-b pb-3">
              <p className="eyebrow text-muted-foreground">
                Pintasan{sectionLabel ? ` · ${sectionLabel}` : ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <Button key={chip.id} size="sm" variant="secondary" className="h-8" asChild>
                    <Link href={chip.href}>{chip.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="eyebrow text-muted-foreground">Sorotan hari ini · otomatis</p>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError && nudges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Sorotan nggak bisa dimuat sekarang — coba buka lagi nanti.
            </p>
          ) : nudges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Laut tenang — nggak ada yang perlu perhatian khusus sekarang.
            </p>
          ) : (
            <div className="space-y-3">
              {urgentNudges.length > 0 ? (
                <div className="space-y-2">
                  {calmNudges.length > 0 ? (
                    <p className="eyebrow text-highlight-strong">Perlu segera</p>
                  ) : null}
                  <ul className="space-y-2">
                    {urgentNudges.map((nudge) => (
                      <NudgeRow key={nudge.id} nudge={nudge} onDismiss={dismissNudge} />
                    ))}
                  </ul>
                </div>
              ) : null}
              {calmNudges.length > 0 ? (
                <div className="space-y-2">
                  {urgentNudges.length > 0 ? (
                    <p className="eyebrow text-muted-foreground">Pantau</p>
                  ) : null}
                  <ul className="space-y-2">
                    {calmNudges.map((nudge) => (
                      <NudgeRow key={nudge.id} nudge={nudge} onDismiss={dismissNudge} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {mounted && askHistory.length > 0 ? (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-muted-foreground">Riwayat tanya</p>
                <button
                  type="button"
                  onClick={clearAskHistory}
                  className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                >
                  Bersihkan
                </button>
              </div>
              <ul className="space-y-1">
                {askHistory.map((ask) => (
                  <li key={ask.id}>
                    <button
                      type="button"
                      onClick={() => router.push(ask.href)}
                      className="hover:bg-card hover:border-border flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition-colors"
                    >
                      <Clock aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="text-muted-foreground min-w-0 flex-1 truncate">
                        {ask.query}
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="text-muted-foreground/50 size-3 shrink-0"
                      />
                      <span className="max-w-[42%] shrink-0 truncate font-medium">{ask.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {noMatch ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Pandu masih belajar di pelabuhan — coba salah satu ini:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PANDU_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion.href}
                    size="sm"
                    variant="secondary"
                    className="h-7"
                    asChild
                  >
                    <Link href={suggestion.href}>{suggestion.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleAsk} className="flex items-center gap-2 border-t p-3">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setNoMatch(false);
            }}
            placeholder="Tanya stokmu… (mis. “sisa kaos hitam M”)"
            aria-label="Tanya Pandu"
            className="bg-card h-9"
          />
          <Button type="submit" size="icon" className="size-9 shrink-0" disabled={!query.trim()}>
            <ArrowRight className="size-4" />
            <span className="sr-only">Kirim pertanyaan</span>
          </Button>
        </form>

        <p className="text-muted-foreground border-t px-4 py-2 text-[11px]">
          Pratinjau — Pandu baru bisa navigasi &amp; sorotan otomatis, belum menjawab bebas.
        </p>
      </section>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setDockCollapsed(false)}
        style={offsetStyle}
        className={cn(
          'bg-sea-glass text-muted-foreground hover:text-foreground focus-visible:ring-ring fixed right-0 z-50 flex items-center gap-1 rounded-l-full border border-r-0 py-2 pr-1 pl-2 shadow-sm transition-transform duration-200 hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:outline-none',
          defaultBottomClass,
        )}
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        <span className="relative flex">
          <BrandMark className="text-primary size-4" />
          {mounted && hasUrgent ? (
            <span
              aria-hidden
              className="bg-highlight pandu-breath absolute -top-1 -right-1 size-2 rounded-full"
            />
          ) : null}
        </span>
        <span className="sr-only">
          Tampilkan Pandu{mounted && hasUrgent ? ' — ada catatan penting' : ''}
        </span>
      </button>
    );
  }

  return (
    <Button
      onClick={handlePillClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      size="icon"
      style={offsetStyle}
      className={cn(
        'ease-tide fixed right-4 z-50 size-12 touch-none rounded-full shadow-lg transition-transform duration-200 hover:-translate-y-0.5',
        defaultBottomClass,
      )}
      aria-label={`Buka Pandu${mounted && hasUrgent ? ' — ada catatan penting' : ''}`}
    >
      <span className="relative flex items-center">
        <BrandMark className="size-5" />
        {mounted && hasUrgent ? (
          <span
            aria-hidden
            className="bg-highlight pandu-breath absolute -top-1 -right-1 size-2.5 rounded-full"
          />
        ) : null}
      </span>
    </Button>
  );
}
