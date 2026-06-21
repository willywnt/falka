import { Skeleton } from '@falka/web';

export function LoadingCard() {
  return (
    <div
      style={{
        width: 320,
        border: '1px solid var(--border, #e5e1d8)',
        borderRadius: 12,
        padding: 16,
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton className="size-10 rounded-full" />
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function ListRows() {
  return (
    <div style={{ width: 320, display: 'grid', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton className="size-12 rounded-md" />
          <div style={{ display: 'grid', gap: 6, flex: 1 }}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

export function TextLines() {
  return (
    <div style={{ width: 280, display: 'grid', gap: 8 }}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
