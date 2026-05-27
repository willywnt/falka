'use client';

import type { RecordingTimelineEvent } from '../types/recording-timeline';
import { TIMELINE_EVENT_LABELS } from '../types/recording-timeline';
import { formatRecoveryTimelineDate } from '../utils/format';

function dotClassName(type: RecordingTimelineEvent['type']): string {
  switch (type) {
    case 'UPLOAD_COMPLETED':
      return 'bg-emerald-500 ring-emerald-500/20';
    case 'UPLOAD_FAILED':
    case 'UPLOAD_INTERRUPTED':
    case 'CAMERA_DISCONNECTED':
      return 'bg-destructive ring-destructive/20';
    case 'UPLOAD_RESUMED':
      return 'bg-primary ring-primary/20';
    default:
      return 'bg-muted-foreground/70 ring-muted-foreground/15';
  }
}

export function RecordingTimelineList({ events }: { events: RecordingTimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">No timeline events yet.</p>;
  }

  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ol className="space-y-0">
      {sorted.map((event, index) => {
        const isLast = index === sorted.length - 1;

        return (
          <li
            key={`${event.at}-${event.type}-${index}`}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {!isLast ? (
              <span
                className="bg-border absolute top-3 left-[5px] h-[calc(100%-4px)] w-px"
                aria-hidden
              />
            ) : null}

            <span
              className={`relative z-10 mt-1 size-2.5 shrink-0 rounded-full ring-4 ${dotClassName(event.type)}`}
              aria-hidden
            />

            <div className="min-w-0 flex-1 pt-0">
              <p className="text-sm leading-snug font-medium">
                {TIMELINE_EVENT_LABELS[event.type]}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-snug">{event.message}</p>
              <time className="text-muted-foreground mt-1.5 block text-xs tabular-nums">
                {formatRecoveryTimelineDate(event.at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
