import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * "Low" badge that explains itself on hover: stock is at or below the variant's
 * low-stock level. Reused wherever low stock is flagged.
 */
export function LowStockBadge({ threshold, className }: { threshold: number; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className={className}>
          Menipis
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Stok sudah di batas menipis ({threshold}) atau kurang.</TooltipContent>
    </Tooltip>
  );
}
