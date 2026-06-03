'use client';

import Link from 'next/link';
import { MoreHorizontal, Unplug } from 'lucide-react';

import type { MarketplaceConnectionListItem } from '../types';
import { formatTokenExpiry, formatTokenExpiryRelative } from '../utils/token-lifecycle';
import { MarketplaceProviderBadge } from './marketplace-provider-badge';
import { MarketplaceStatusBadge } from './marketplace-status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

export function MarketplaceTable({
  connections,
  onDisconnect,
  isDisconnecting,
}: {
  connections: MarketplaceConnectionListItem[];
  onDisconnect: (connection: MarketplaceConnectionListItem) => void;
  isDisconnecting?: boolean;
}) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Token expiry</TableHead>
            <TableHead>Connected</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => (
            <TableRow key={connection.id}>
              <TableCell>
                <MarketplaceProviderBadge provider={connection.provider} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/marketplace/${connection.id}`}
                  className="font-medium hover:underline"
                >
                  {connection.shopName}
                </Link>
                <div className="text-muted-foreground text-xs">ID: {connection.shopId}</div>
              </TableCell>
              <TableCell>
                <MarketplaceStatusBadge status={connection.connectionStatus} />
              </TableCell>
              <TableCell>
                <div className="text-sm" suppressHydrationWarning>
                  {formatTokenExpiryRelative(connection.tokenExpiresAt)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatTokenExpiry(connection.tokenExpiresAt)}
                </div>
              </TableCell>
              <TableCell>{formatDateTime(connection.createdAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={!connection.isActive || isDisconnecting}
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDisconnect(connection)}
                    >
                      <Unplug className="size-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
