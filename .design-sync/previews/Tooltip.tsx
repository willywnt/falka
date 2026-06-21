import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Button,
} from '@falka/web';
import { Info } from 'lucide-react';

export function Hint() {
  return (
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Info style={{ width: 16, height: 16 }} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Stok tersedia sudah dikurangi reservasi pesanan online
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
