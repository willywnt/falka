'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Play,
  Search,
  Trash2,
  UploadCloud,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import type { RecordingListItem } from '../types';
import { RECORDING_STATUS_FILTER_LABELS } from '../types';
import {
  useDeleteRecordingMutation,
  useDownloadRecordingMutation,
  useRecordingDetailQuery,
  useRecordingsListQuery,
} from '../hooks/use-recordings-management';
import {
  formatRecordingDate,
  formatRecordingDuration,
  formatRecordingFileSize,
  isPlayableRecording,
} from '../utils/recording-display';
import { useRecordingLibraryFilters } from '../hooks/use-recording-library-filters';
import { RECORDING_STATUS_FILTERS, type RecordingSortField } from '../validators/list-recordings';
import { RecordingDeleteDialog } from './recording-delete-dialog';
import { RecordingDetailModal } from './recording-detail-modal';
import { RecordingPlayerModal } from './recording-player-modal';
import { OperationalStatusBadge } from './operational-status-badge';
import { RecordingsEmptyState } from './recordings-empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRecordingReliabilityStore } from '@/modules/recording-recovery/store/recording-reliability.store';
import { useUploadRetry } from '@/modules/recording-recovery/hooks/use-upload-retry';
import { PendingLocalPlayerModal } from '@/modules/recording-recovery/components/pending-local-player-modal';
import { PendingRecordingDetailSheet } from '@/modules/recording-recovery/components/pending-recording-detail-sheet';
import { PendingDiscardDialog } from '@/modules/recording-recovery/components/pending-discard-dialog';
import type { TemporaryRecording } from '@/modules/recording-recovery/types';
import { EllipsisTooltip } from '@/components/ui/action-tooltip';
import {
  mapRecoveryUploadToOperational,
  mapServerStatusToOperational,
} from '../types/operational-recording-status';
import {
  formatRecoveryDate,
  formatRecoveryDuration,
  formatRecoveryFileSize,
} from '@/modules/recording-recovery/utils/format';
import { resolvePendingRecordingFailureMessage } from '@/modules/recording-recovery/types/failure-codes';
import { usePersistedToggle } from '../hooks/use-persisted-toggle';

const PENDING_SECTION_STORAGE_KEY = 'olshop-pending-uploads-expanded';

function SortButton({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: RecordingSortField;
  sortBy: RecordingSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: RecordingSortField) => void;
}) {
  const isActive = sortBy === field;
  const Icon = !isActive ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort(field)}>
      {label}
      <Icon className="size-3.5" />
    </Button>
  );
}

export function RecordingsDashboard() {
  const { query, setQuery, searchInput, setSearchInput, listQuery } = useRecordingLibraryFilters();
  const [selectedRecording, setSelectedRecording] = useState<RecordingListItem | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecordingListItem | null>(null);
  const [pendingPlayerTarget, setPendingPlayerTarget] = useState<TemporaryRecording | null>(null);
  const [pendingDetailTarget, setPendingDetailTarget] = useState<TemporaryRecording | null>(null);
  const [pendingDiscardTarget, setPendingDiscardTarget] = useState<TemporaryRecording | null>(null);
  const [isDiscardingPending, setIsDiscardingPending] = useState(false);

  const temporaryRecordings = useRecordingReliabilityStore((state) => state.temporaryRecordings);
  const isOnline = useRecordingReliabilityStore((state) => state.isOnline);
  const isRetryingUpload = useRecordingReliabilityStore((state) => state.isRetryingUpload);
  const selectedRecoveryId = useRecordingReliabilityStore((state) => state.selectedRecoveryId);
  const retryUploadProgress = useRecordingReliabilityStore((state) => state.retryUploadProgress);
  const setUploadCenterOpen = useRecordingReliabilityStore((state) => state.setUploadCenterOpen);
  const setSelectedRecoveryId = useRecordingReliabilityStore(
    (state) => state.setSelectedRecoveryId,
  );
  const { retryUpload, discardRecording } = useUploadRetry();
  const { value: pendingSectionExpanded, toggle: togglePendingSection } = usePersistedToggle(
    PENDING_SECTION_STORAGE_KEY,
    true,
  );

  const { data, isLoading, isFetching, error } = useRecordingsListQuery(listQuery);
  const detailQuery = useRecordingDetailQuery(detailId, detailOpen);
  const deleteMutation = useDeleteRecordingMutation();
  const downloadMutation = useDownloadRecordingMutation();

  function handleSort(field: RecordingSortField) {
    setQuery((current) => ({
      ...current,
      page: 1,
      sortBy: field,
      sortOrder: current.sortBy === field && current.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }

  function openPlayer(recording: RecordingListItem) {
    setSelectedRecording(recording);
    setPlayerOpen(true);
  }

  function openDetail(recording: RecordingListItem) {
    setDetailId(recording.id);
    setDetailOpen(true);
  }

  async function handleDownload(recording: RecordingListItem) {
    try {
      await downloadMutation.mutateAsync(recording.id);
    } catch (downloadError) {
      toast.error('Download failed', {
        description: downloadError instanceof Error ? downloadError.message : 'Unknown error',
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Recording deleted');
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error('Delete failed', {
        description: deleteError instanceof Error ? deleteError.message : 'Unknown error',
      });
    }
  }

  async function handlePendingDiscardConfirm() {
    if (!pendingDiscardTarget) return;

    setIsDiscardingPending(true);
    try {
      await discardRecording(pendingDiscardTarget.id);
      if (pendingDetailTarget?.id === pendingDiscardTarget.id) {
        setPendingDetailTarget(null);
      }
      setPendingDiscardTarget(null);
    } finally {
      setIsDiscardingPending(false);
    }
  }

  const hasSearch = Boolean(searchInput.trim());

  const hiddenServerRecordingIds = useMemo(
    () =>
      new Set(
        temporaryRecordings
          .map((recording) => recording.recordingId)
          .filter((id): id is string => Boolean(id)),
      ),
    [temporaryRecordings],
  );

  const visibleServerRecordings = useMemo(
    () => (data?.items ?? []).filter((recording) => !hiddenServerRecordingIds.has(recording.id)),
    [data?.items, hiddenServerRecordingIds],
  );

  const isEmpty =
    !isLoading && visibleServerRecordings.length === 0 && temporaryRecordings.length === 0;

  const filteredPending = useMemo(() => {
    const term = searchInput.trim().toUpperCase();
    if (!term) return temporaryRecordings;
    return temporaryRecordings.filter((recording) => recording.noResi.toUpperCase().includes(term));
  }, [searchInput, temporaryRecordings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value.toUpperCase())}
              placeholder="Search by resi number..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {RECORDING_STATUS_FILTERS.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={query.status === status ? 'default' : 'outline'}
                onClick={() => setQuery((current) => ({ ...current, page: 1, status }))}
              >
                {RECORDING_STATUS_FILTER_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>

        <Button asChild>
          <Link href="/recordings">
            <Video className="size-4" />
            New recording
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Failed to load recordings. {error instanceof Error ? error.message : 'Please try again.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <RecordingsEmptyState
          title={hasSearch ? 'No matching recordings' : 'No recordings yet'}
          description={
            hasSearch
              ? 'Try a different resi number or clear your filters.'
              : 'Create your first operational recording to see it listed here.'
          }
        />
      ) : (
        <>
          {filteredPending.length > 0 ? (
            <div className="overflow-hidden rounded-xl border">
              <button
                type="button"
                className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                onClick={togglePendingSection}
              >
                <div>
                  <p className="text-sm font-medium">Pending uploads</p>
                  <p className="text-muted-foreground text-xs">
                    {filteredPending.length} saved on this device — not yet in cloud storage
                  </p>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Badge variant="secondary">{filteredPending.length}</Badge>
                  {pendingSectionExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </div>
              </button>

              {pendingSectionExpanded ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Failure reason</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>File size</TableHead>
                      <TableHead>Recorded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((recording) => {
                      const failureMessage = resolvePendingRecordingFailureMessage(recording);
                      const isUploadingThis =
                        isRetryingUpload && selectedRecoveryId === recording.id;
                      const status = isUploadingThis
                        ? 'UPLOADING'
                        : mapRecoveryUploadToOperational(recording.uploadStatus);

                      return (
                        <TableRow key={recording.id} className="bg-muted/20">
                          <TableCell className="font-medium">{recording.noResi}</TableCell>
                          <TableCell>
                            <OperationalStatusBadge status={status} />
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            {failureMessage ? (
                              <EllipsisTooltip
                                text={failureMessage}
                                className="text-destructive text-sm leading-snug"
                                contentClassName="max-w-sm"
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatRecoveryDuration(recording.durationSeconds)}</TableCell>
                          <TableCell>
                            {formatRecoveryFileSize(recording.estimatedSizeBytes)}
                          </TableCell>
                          <TableCell>{formatRecoveryDate(recording.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {isUploadingThis ? (
                              <div
                                className="inline-flex items-center gap-2"
                                role="status"
                                aria-label={`Uploading ${retryUploadProgress}%`}
                              >
                                <Loader2 className="text-primary size-4 animate-spin" />
                                <span className="text-muted-foreground text-xs tabular-nums">
                                  {retryUploadProgress}%
                                </span>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setPendingPlayerTarget(recording)}
                                  >
                                    <Play className="size-4" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!isOnline || isRetryingUpload}
                                    onClick={() => {
                                      setSelectedRecoveryId(recording.id);
                                      void retryUpload(recording.id);
                                    }}
                                  >
                                    <UploadCloud className="size-4" />
                                    Upload
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setPendingDetailTarget(recording)}
                                  >
                                    <Eye className="size-4" />
                                    View timeline
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={isRetryingUpload}
                                    onClick={() => setPendingDiscardTarget(recording)}
                                  >
                                    <Trash2 className="size-4" />
                                    Discard
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : null}
            </div>
          ) : null}

          {visibleServerRecordings.length > 0 ? (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton
                        label="Resi"
                        field="noResi"
                        sortBy={query.sortBy}
                        sortOrder={query.sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <SortButton
                        label="Duration"
                        field="durationSeconds"
                        sortBy={query.sortBy}
                        sortOrder={query.sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortButton
                        label="File size"
                        field="fileSizeBytes"
                        sortBy={query.sortBy}
                        sortOrder={query.sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortButton
                        label="Created"
                        field="createdAt"
                        sortBy={query.sortBy}
                        sortOrder={query.sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleServerRecordings.map((recording) => {
                    const canPlay = isPlayableRecording(recording.status, recording.publicUrl);

                    return (
                      <TableRow key={recording.id}>
                        <TableCell className="font-medium">{recording.noResi}</TableCell>
                        <TableCell>
                          <OperationalStatusBadge
                            status={mapServerStatusToOperational(recording.status)}
                          />
                        </TableCell>
                        <TableCell>{formatRecordingDuration(recording.durationSeconds)}</TableCell>
                        <TableCell>{formatRecordingFileSize(recording.fileSizeBytes)}</TableCell>
                        <TableCell>{formatRecordingDate(recording.createdAt)}</TableCell>
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
                                disabled={!canPlay}
                                onClick={() => openPlayer(recording)}
                              >
                                <Play className="size-4" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDetail(recording)}>
                                <Eye className="size-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canPlay || downloadMutation.isPending}
                                onClick={() => void handleDownload(recording)}
                              >
                                <Download className="size-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(recording)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {visibleServerRecordings.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Page {data?.meta.page ?? 1} of {data?.meta.totalPages ?? 1} ·{' '}
                {data?.meta.total ?? 0} recordings
                {isFetching ? ' · Updating...' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.meta.hasPreviousPage}
                  onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.meta.hasNextPage}
                  onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <RecordingPlayerModal
        recording={selectedRecording}
        open={playerOpen}
        onOpenChange={setPlayerOpen}
      />

      <RecordingDetailModal
        recording={detailQuery.data ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isLoading={detailQuery.isLoading}
      />

      <RecordingDeleteDialog
        noResi={deleteTarget?.noResi ?? ''}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        isDeleting={deleteMutation.isPending}
      />

      <PendingLocalPlayerModal
        recording={pendingPlayerTarget}
        open={Boolean(pendingPlayerTarget)}
        onOpenChange={(open) => !open && setPendingPlayerTarget(null)}
      />

      <PendingRecordingDetailSheet
        recording={pendingDetailTarget}
        open={Boolean(pendingDetailTarget)}
        onOpenChange={(open) => !open && setPendingDetailTarget(null)}
        showBack
        onBack={() => {
          setPendingDetailTarget(null);
          setUploadCenterOpen(true);
        }}
      />

      <PendingDiscardDialog
        noResi={pendingDiscardTarget?.noResi ?? null}
        open={Boolean(pendingDiscardTarget)}
        onOpenChange={(open) => !open && setPendingDiscardTarget(null)}
        onConfirm={() => void handlePendingDiscardConfirm()}
        isDiscarding={isDiscardingPending}
      />
    </div>
  );
}
