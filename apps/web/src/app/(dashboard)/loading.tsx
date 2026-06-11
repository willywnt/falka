import { BrandMark } from '@/components/brand-mark';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <BrandMark className="text-primary size-8" />
      <p className="text-muted-foreground text-sm">Menarik jangkar…</p>
    </div>
  );
}
