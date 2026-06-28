import { APP_NAME } from '@palka/config/constants';

import { BrandBadge } from '@/components/brand-mark';
import { Skeleton } from '@/components/ui/skeleton';

// The share page presigns per-request, so buyers briefly wait — keep the wait
// branded instead of a blank screen (this is an external trust surface).
export default function SharedRecordingLoading() {
  return (
    <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <BrandBadge />
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="bg-card overflow-hidden rounded-lg border">
          <div className="space-y-2 border-b p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="border-t p-4">
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
      </div>
    </main>
  );
}
