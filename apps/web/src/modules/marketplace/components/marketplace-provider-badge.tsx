'use client';

import type { MarketplaceProvider } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  getMarketplaceProviderIcon,
  getMarketplaceProviderLabel,
} from '../utils/provider-display';

export function MarketplaceProviderBadge({
  provider,
  className,
}: {
  provider: MarketplaceProvider;
  className?: string;
}) {
  const Icon = getMarketplaceProviderIcon(provider);

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', className)}>
      <Icon className="size-3.5" />
      {getMarketplaceProviderLabel(provider)}
    </Badge>
  );
}
