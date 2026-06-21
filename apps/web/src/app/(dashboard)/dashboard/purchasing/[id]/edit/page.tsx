import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { PoForm } from '@/modules/purchasing/components/po-form';

export const metadata: Metadata = {
  title: 'Edit draf pembelian',
};

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOrgPermission('purchasing.view');
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/dashboard/purchasing/${id}`}>
          <ArrowLeft className="size-4" />
          Kembali ke pembelian
        </Link>
      </Button>

      <PageHeader
        eyebrow="Stok"
        title="Edit draf pembelian"
        description="Ubah item, jumlah, modal, atau pemasok. Hanya draf yang bisa diedit."
      />
      {/* PoForm uses useSearchParams (via the shared New-PO form) — render under Suspense. */}
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        }
      >
        <PoForm editPoId={id} />
      </Suspense>
    </div>
  );
}
