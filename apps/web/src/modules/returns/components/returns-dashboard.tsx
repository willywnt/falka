'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Undo2 } from 'lucide-react';
import type { ReturnStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/formatters';

import { useReturnsQuery } from '../hooks/use-returns';
import { ReturnStatusBadge } from './return-status-badge';

const FILTERS: ReadonlyArray<{ label: string; value: ReturnStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Awaiting goods', value: 'PENDING' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function ReturnsDashboard() {
  const [filter, setFilter] = useState<ReturnStatus | 'ALL'>('ALL');
  const { data, isLoading, error } = useReturnsQuery(filter === 'ALL' ? undefined : filter);

  const returns = data ?? [];
  const isEmpty = !isLoading && returns.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filter === option.value ? 'default' : 'outline'}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Failed to load returns. {error instanceof Error ? error.message : 'Please try again.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Undo2}
          title="No returns"
          description="Returns open automatically when a shipped order is cancelled, or you can open one from an order."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((ret) => (
                <TableRow key={ret.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/returns/${ret.id}`}
                      className="font-medium hover:underline"
                    >
                      {ret.externalOrderId}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {ret.shopName}
                      {ret.autoDetected ? ' · auto' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ReturnStatusBadge status={ret.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ret.itemCount}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    <span suppressHydrationWarning>{formatDateTime(ret.createdAt)}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {ret.processedAt ? (
                      <span suppressHydrationWarning>{formatDateTime(ret.processedAt)}</span>
                    ) : (
                      <Badge variant="outline" className={cn('border-amber-500 text-amber-600')}>
                        pending
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
