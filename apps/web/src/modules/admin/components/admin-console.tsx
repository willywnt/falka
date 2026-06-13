'use client';

import { useState } from 'react';
import { Building2, FileWarning, HardDriveDownload, Settings2, Boxes } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
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
import { formatDateTime, formatStorageUsage } from '@/lib/formatters';

import { CreateOrgDialog } from './create-org-dialog';
import { EditOrgSheet } from './edit-org-sheet';
import { useAdminOpsQuery, useAdminOrgsQuery } from '../hooks/use-admin-orgs';
import type { AdminOrgListItem } from '../types';

export function AdminConsole() {
  return (
    <div className="space-y-10">
      <OrganizationsSection />
      <OperationalSection />
    </div>
  );
}

function OrganizationsSection() {
  const { data, isLoading, error, refetch } = useAdminOrgsQuery();
  const [editing, setEditing] = useState<AdminOrgListItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openEdit(org: AdminOrgListItem) {
    setEditing(org);
    setSheetOpen(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="eyebrow text-muted-foreground">Platform</p>
          <h1 className="text-2xl font-semibold tracking-tight">Organisasi</h1>
          <p className="text-muted-foreground text-sm">
            Buat organisasi baru dan atur plan, batas anggota, serta kuota penyimpanannya.
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {error ? (
        <ErrorState
          title="Gagal memuat organisasi"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada organisasi"
          description="Buat organisasi pertama lewat tombol di atas."
        />
      ) : (
        <OrgTable organizations={data} onEdit={openEdit} />
      )}

      <EditOrgSheet org={editing} open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}

function OrgTable({
  organizations,
  onEdit,
}: {
  organizations: AdminOrgListItem[];
  onEdit: (org: AdminOrgListItem) => void;
}) {
  return (
    <>
      {/* Cards on phones, table on sm+. */}
      <ul className="space-y-3 sm:hidden">
        {organizations.map((org) => (
          <li key={org.id} className="border-border/70 space-y-2 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{org.name}</p>
                <p className="text-muted-foreground truncate text-xs break-all">
                  {org.ownerEmail ?? '—'}
                </p>
              </div>
              <StatusBadge tone="info">{org.plan}</StatusBadge>
            </div>
            <dl className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
              <div>
                Anggota:{' '}
                <span className="num text-foreground">
                  {org.memberCount}
                  {org.memberLimit != null ? ` / ${org.memberLimit}` : ''}
                </span>
              </div>
              <div className="num text-right">
                {formatStorageUsage(Number(org.storageUsedBytes), Number(org.storageQuotaBytes))}
              </div>
            </dl>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">{formatDateTime(org.createdAt)}</span>
              <Button variant="outline" size="sm" onClick={() => onEdit(org)}>
                <Settings2 className="size-4" />
                Atur
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead>Kuota</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>
                  <StatusBadge tone="info">{org.plan}</StatusBadge>
                </TableCell>
                <TableCell className="num text-sm">
                  {org.memberCount}
                  {org.memberLimit != null ? (
                    <span className="text-muted-foreground"> / {org.memberLimit}</span>
                  ) : null}
                </TableCell>
                <TableCell className="num text-muted-foreground text-sm whitespace-nowrap">
                  {formatStorageUsage(Number(org.storageUsedBytes), Number(org.storageQuotaBytes))}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm break-all">
                  {org.ownerEmail ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatDateTime(org.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onEdit(org)}>
                    <Settings2 className="size-4" />
                    Atur
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function OperationalSection() {
  const { data, isLoading, error, refetch } = useAdminOpsQuery();

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="eyebrow text-muted-foreground">Platform</p>
        <h2 className="text-xl font-semibold tracking-tight">Operasional</h2>
        <p className="text-muted-foreground text-sm">
          Pantauan kesehatan sistem — angka yang perlu kamu cek kalau ada yang janggal.
        </p>
      </div>

      {error ? (
        <ErrorState
          title="Gagal memuat metrik operasional"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Upload gagal"
            value={data.failedUploads.length}
            icon={FileWarning}
            tone="rose"
          />
          <StatCard
            label="Rekaman yatim"
            value={data.orphanRecordings.length}
            icon={Boxes}
            tone="amber"
          />
          <StatCard
            label="Job macet"
            value={data.stuckJobs.length}
            icon={Settings2}
            tone="violet"
          />
          <StatCard
            label="Storage tak cocok"
            value={data.storageMismatch.length}
            icon={HardDriveDownload}
            tone="sky"
          />
        </div>
      )}
    </section>
  );
}
