'use client';

import type { InventoryEventListItemDto } from '../types';
import { INVENTORY_EVENT_TYPE_LABELS } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

export function InventoryEventsTable({ events }: { events: InventoryEventListItemDto[] }) {
  if (events.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No inventory mutations recorded for this variant yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Before</TableHead>
            <TableHead className="text-right">After</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDateTime(event.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{INVENTORY_EVENT_TYPE_LABELS[event.type]}</Badge>
              </TableCell>
              <TableCell className="text-right">{event.quantity}</TableCell>
              <TableCell className="text-right">{event.previousStock}</TableCell>
              <TableCell className="text-right font-medium">{event.newStock}</TableCell>
              <TableCell className="text-muted-foreground max-w-[180px] truncate text-sm">
                {event.reason ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {event.actorId ? event.actorId.slice(0, 8) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
