import { TooltipProvider, ActionTooltip, Button } from '@falka/web';
import { Printer } from 'lucide-react';

// ActionTooltip is a convenience wrapper around <Tooltip> that does NOT forward an
// open/defaultOpen prop, so its tooltip cannot be forced open for a static capture.
// We render the trigger affordance, which is the honest static render.
export function Trigger() {
  return (
    <TooltipProvider>
      <ActionTooltip label="Cetak ulang label QR">
        <Button variant="outline" size="icon">
          <Printer style={{ width: 16, height: 16 }} />
        </Button>
      </ActionTooltip>
    </TooltipProvider>
  );
}
