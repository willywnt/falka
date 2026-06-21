# design-sync NOTES — @falka/web → "Palka Design System"

Repo-specific gotchas for future syncs. Read this BEFORE re-syncing.

## Shape & build model (non-obvious)

- The design system is the **Next.js app's component library** (`apps/web/src/components/**`),
  NOT the `@falka/ui` stub package (which is only Button + Card). `cfg.pkg = "@falka/web"`,
  `globalName = "Palka"`.
- There is **no shipped `dist/`** for these components. `.design-sync/build-inputs.mjs` (committed,
  durable) builds all sync inputs deterministically and is `cfg.buildCmd`. It generates, under
  `apps/web/` (all gitignored):
  - `.ds-entry.tsx` — barrel that `export *`s the scoped surface (the esbuild **bundle** entry → full
    API on `window.Palka`, incl. sub-exports like CardHeader/DialogTrigger).
  - `index.d.ts` — **curated** named re-exports of ONLY the `componentSrcMap` card set (the converter's
    **types/discovery** entry). This is why discovery yields exactly the ~48 cards and not all ~117
    sub-exports. If you add/remove a card, edit `componentSrcMap` (build-inputs reads it).
  - `.ds-types/**` — `tsc` declaration emit (real prop contracts; ts-morph reads these on-demand).
  - `.ds-compiled.css` — **Tailwind v4 compiled** ("Suar Dermaga" theme tokens + only the utilities the
    components use + brand `@font-face`). This is `cfg.cssEntry`. Tailwind utilities are NOT a static
    stylesheet — they must be compiled, hence this step. Input is `globals.css` minus its 3 `@import`s,
    re-headed with `source(none)` + `@source` + fonts (see build-inputs `TW_HEAD`).
  - `.ds-fonts/**` — Plus Jakarta Sans (latin + latin-ext) + Geist + Geist Mono variable woff2.
  - `tsconfig.ds-bundle.json` — `cfg.tsconfig`. Carries `@/*` alias **and `next/*` shims** (see below).
- **`--node-modules` = repo ROOT `node_modules`** (this repo hoists everything: react + all app deps are
  at root; `apps/web/node_modules` is sparse). Build cmd:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle`

## next/\* must be shimmed (else "process is not defined" in EVERY card)

- `error-screen.tsx` imports `next/link`, which drags the Next runtime (`process.env.__NEXT_*`) into the
  shared bundle → every preview throws `process is not defined`. Fix: `tsconfig.ds-bundle.json` `paths`
  redirect `next/link`/`next/image`/`next/navigation` to `.design-sync/shims/*` (committed). If a newly
  scoped component imports another `next/*` subpath, add a shim + a paths entry in build-inputs.

## Capture harness edit (re-apply after re-staging .ds-sync!)

- `.ds-sync/` is re-copied fresh from the skill bundle on every sync, so this edit is LOST and must be
  RE-APPLIED: add `await page.emulateMedia({ reducedMotion: 'reduce' })` right after `browser.newPage(...)`
  in BOTH `package-capture.mjs` and `package-validate.mjs`, and a `await page.waitForTimeout(300)` at the
  end of capture's `settle()`. (Parity with `storybook/compare.mjs`, which already does this.)
- Why: animated previews otherwise screenshot mid-flight. **ChannelDonutChart** (recharts pie respects
  `useReducedMotion()` → full ring only with reduced-motion) and effect/timer-driven content need it.
  Without the edit, ChannelDonutChart re-flags as a partial-arc `needs-work` on every re-sync.

## check_design_system token kinds (durable fix — build-inputs.mjs §3b)

- `check_design_system` (the claude.ai/design server self-check) reads inline `/* @kind … */`
  annotations in the compiled `_ds_bundle.css` to classify CSS custom properties. Tailwind v4's
  output ships motion/timing theme tokens (`--ease-*`, `--animate-*`, `--aspect-video`,
  `--default-transition-*`) and ~80 `--tw-*` `@property` plumbing rules that the checker can't
  classify on its own → "unclassified token" warnings.
- **FIXED durably (2026-06-22)**: `build-inputs.mjs` §3b post-processes the compiled CSS after the
  Tailwind run, appending `/* @kind other */` to the 8 motion/timing theme tokens and to **every**
  `@property --tw-*` rule (a safe superset of the 11 the checker flags — none are color/spacing/
  radius/shadow/font tokens). The build prints `css: annotated N tokens @kind other`.
- It MUST live on the generated output (not source): the source `@theme` block carries no such
  comments and the `--tw-*` rules are emitted by Tailwind. `_adherence.oxlintrc.json` (server-
  regenerated) maps these too, but the checker reads inline CSS `@kind`, **not** that JSON map.
- Isu 2 (the ~77 `--tw-*` set inside component-style/utility selectors) needs **no** change —
  those are framework plumbing under selectors, not theme tokens; classifying the `@property`
  rules by name covers them. Don't move `--tw-*` into `:root` (it breaks Tailwind utilities).

## Per-component facts (matched from source — trust these over guesses)

- **Select** is a styled NATIVE `<select>`, not a Radix overlay — NO `defaultOpen`. Render closed with
  `defaultValue`. (Its `cardMode:single` override is harmless but does nothing.)
- **Avatar** is a custom initials monogram: `{ name, className }` only. No AvatarImage/AvatarFallback.
- **ActionTooltip / EllipsisTooltip** wrap `<Tooltip>` and do NOT forward `open`/`defaultOpen`, so the
  tooltip BODY can't render in a static capture. Cards show the trigger / the truncated text (graded
  good, honestly). To show the bubble later would need a capture-time hover or an `open` passthrough.
- **DateRangePicker** has no `open` prop — card shows the trigger button (placeholder vs committed range).
- **LowStockBadge** `{ threshold }` only — popover collapses statically; the inline "Menipis" pill shows.
- **Toaster** (sonner) is **floor-carded on purpose** (no authored preview): toasts portal to
  `document.body` with `position:fixed`, anchoring to the viewport OUTSIDE the captured card region — not
  capturable in the per-story card model. It stays fully importable + documented (in the bundle + .d.ts +
  prompt.md). Do not keep re-trying to author it; if you do, it'll capture blank.
- **Overlays** (Dialog/AlertDialog/Sheet/Popover/DropdownMenu/Tooltip): render the OPEN state (`open` on
  Dialog-family roots, `defaultOpen` on Popover/DropdownMenu, `<Tooltip open>` inside `TooltipProvider`).
  `cardMode:single` (config) contains the portal in the product card. Tooltip needs its own TooltipProvider.
- **Charts** (recharts) need a sized parent div + data; exact datum shapes are documented in each preview.
  Chart colors come from `--chart-1..5` / `--signed-up/-down` / `--highlight` tokens in the bundle CSS.
- **Form** uses real `react-hook-form` (`useForm`); drive the error state via `form.setError` in a
  `useEffect`. Previews may import `react-hook-form`, `lucide-react`, `date-fns`, `sonner`, `react`.
- **NO provider wrapper is needed** — components render themed out of the box (`cfg.provider` unset).

## Known render warns (triaged legitimate — not new on re-sync)

- LowStockBadge: popover not shown statically (inline pill graded).
- ActionTooltip / EllipsisTooltip: tooltip body not shown statically (trigger/truncation graded).
- Toaster: floor card by design (un-capturable).

## Re-sync risks (what can silently go stale)

- **The capture-harness emulateMedia edit is NOT durable** (gitignored `.ds-sync/`). Re-apply it every
  sync or ChannelDonutChart (and any future animated preview) re-flags. This is the #1 thing to redo.
- **Groups are path-derived** (`general` for ui+composites, `charts` for charts) — finer grouping would
  need `@category` JSDoc in source or doc stubs (not done; cosmetic only).
- **`.d.ts` quality depends on the `tsc` emit** — a component whose props reference an app-internal `@/`
  type that doesn't resolve in ts-morph would emit a weaker body; none observed in this run, but watch
  `all .d.ts parse cleanly` on validate.
- Brand fonts are pulled from `@fontsource-variable/plus-jakarta-sans` + `geist` node_modules at build
  time; if those packages move/rename their variable files, `build-inputs.mjs` FONTS map needs updating.
- `componentSrcMap` (config) and the module list in `build-inputs.mjs` both enumerate the scoped set —
  keep them in sync when adding/removing components.
