const MARKETS = [
  { name: 'Shopee', dot: 'oklch(0.66 0.2 35)' },
  { name: 'Tokopedia', dot: 'oklch(0.62 0.17 150)' },
  { name: 'TikTok Shop', dot: 'oklch(0.5 0.02 250)' },
  { name: 'Lazada', dot: 'oklch(0.55 0.18 295)' },
];

/**
 * Channels the platform syncs with. Today's live integrations are Shopee +
 * Tokopedia (see MARKETPLACE_PROVIDERS); the "+ terus bertambah" pill keeps the
 * strip honest about the roadmap without implying everything is GA.
 */
export function MarketplaceStrip() {
  return (
    <section className="border-b">
      <div
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-6 py-6"
        style={{ gap: 'clamp(16px,4vw,52px)' }}
      >
        <span className="eyebrow text-muted-foreground">Sinkron langsung dengan</span>
        {MARKETS.map((m) => (
          <span
            key={m.name}
            className="inline-flex items-center gap-2.5 text-[1.02rem] font-bold tracking-tight"
          >
            <span className="size-2.75 rounded-full" style={{ background: m.dot }} />
            {m.name}
          </span>
        ))}
        <span className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold">
          + terus bertambah
        </span>
      </div>
    </section>
  );
}
