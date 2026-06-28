# Palka (Palka) — building with this design system

These are the real React components of an Indonesian inventory / POS / e-commerce app, on
`window.Palka` (the bundle is loaded for you). Import a component as its `.prompt.md` shows; **no
provider or wrapper is required** — components render themed out of the box. Light is the default;
a `.dark` ancestor switches to dark mode. The product's language is **Indonesian (id-ID)** — prefer
Indonesian copy and rupiah ("Simpan", "Pesanan", "Rp 248.000").

## Styling idiom — Tailwind v4 utilities mapped to theme tokens

Write layout/glue with **Tailwind v4 utility classes**. The locked "Suar Dermaga" palette is exposed
as **token-backed utilities** that adapt to light/dark — **never hardcode hex or raw Tailwind palette
colors** (no `bg-emerald-500`, no `#0f766e`). Use the token utilities:

- **Surfaces:** `bg-background` (warm paper), `bg-card`, `bg-muted`, `bg-secondary`, `bg-accent`,
  `bg-popover`. **Text:** `text-foreground`, `text-muted-foreground`, `text-card-foreground`.
  **Borders/ring:** `border` + `border-border` (hairline — borders over shadows) / `border-input`,
  `ring-ring`.
- **Brand accent (teal):** `bg-primary` / `text-primary` / `text-primary-foreground`.
  **Danger:** `bg-destructive` / `text-destructive`.
- **Status colors — the ONLY allowed source of status hues:** prefer the **`StatusBadge`** component
  (`tone="ok|info|warn|urgent|danger|neutral"`). Raw token utilities if you must:
  `text-status-ok` (calm green), `text-status-info` (blue), `text-status-warn` /
  `text-highlight-strong` with `bg-highlight` (amber "suar"). Never raw emerald/amber/sky/rose.
- **Signed numerics (deltas):** `text-signed-up` (green, gain) / `text-signed-down` (ember, loss) —
  or use the **`NumberDelta`** component. Ember is hue-separated from danger red on purpose.
- **Radius:** `rounded-md` / `rounded-lg` / `rounded-xl` (driven by `--radius`). **Opacity tints:**
  append `/10`, `/15`, `/90` (e.g. `bg-primary/10`, `bg-highlight/15`).

### Fonts & ledger numerics

- `font-sans` = **Plus Jakarta Sans** (default body). `font-mono` = **Geist Mono**.
- Every stock / price / qty / KPI **number** uses a mono tabular utility so columns align like a
  ledger: **`num`** (inline figures), **`num-display`** (hero values, e.g. StatCard). Section and
  stat labels use **`eyebrow`** (micro-caps tracked). Dashboard canvas wash: **`horizon-wash`**.

## Where the real styles live

Read the bound **`_ds/<folder>/styles.css`** (it `@import`s `_ds_bundle.css` + the token `:root`) for
the full token set, then each component's **`<Name>.d.ts`** (props) and **`<Name>.prompt.md`** (usage

- examples) before composing. The components are tokenized — restyle via props/className, not forks.

## Idiomatic example

```tsx
// A KPI tile composed from real components + token utilities for the layout glue
<div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
  <p className="eyebrow text-muted-foreground">Omzet hari ini</p>
  <p className="num-display">Rp 4,82jt</p>
  <div className="flex items-center justify-between gap-2">
    <Palka.StatusBadge tone="ok">Lunas</Palka.StatusBadge>
    <Palka.Button>Proses pesanan</Palka.Button>
  </div>
</div>
```
