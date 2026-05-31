'use client';

import { format } from 'date-fns';
import { History } from 'lucide-react';

export type MobileScanHistoryEntry = {
  barcode: string;
  scannedAt: string;
};

type MobileScanHistoryProps = {
  entries: MobileScanHistoryEntry[];
};

export function MobileScanHistory({ entries }: MobileScanHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-xs">
        <History className="size-3.5 shrink-0" />
        <span>No scans yet — aim at a shipping barcode</span>
      </div>
    );
  }

  return (
    <div className="bg-background max-h-36 overflow-y-auto border-t">
      <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-xs font-medium">
        <History className="size-3.5 shrink-0" />
        Scan history
      </div>
      <ul className="divide-y px-2 pb-2">
        {entries.map((entry) => (
          <li
            key={`${entry.barcode}-${entry.scannedAt}`}
            className="flex items-center justify-between gap-2 px-2 py-2"
          >
            <span className="truncate font-mono text-sm font-semibold">{entry.barcode}</span>
            <time className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
              {format(new Date(entry.scannedAt), 'HH:mm:ss')}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
