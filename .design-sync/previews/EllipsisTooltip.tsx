import { TooltipProvider, EllipsisTooltip } from '@falka/web';

// EllipsisTooltip truncates overflowing text and reveals the full string on hover/focus.
// A static capture can't trigger hover, so we render it inside a narrow fixed-width box
// to show the truncation + ellipsis — the honest static render. (Tooltip body itself
// won't appear without interaction.)
export function Truncated() {
  return (
    <TooltipProvider>
      <div style={{ width: 180, fontSize: 14 }}>
        <EllipsisTooltip text="Kaos Polos Lengan Panjang Premium — Hitam / XL (SKU KPL-HTM-XL)" />
      </div>
    </TooltipProvider>
  );
}
