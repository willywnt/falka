'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { recordingRecoveryService } from '@/modules/recordings/recovery/services/recording-recovery.service';
import { useRecordingReliabilityStore } from '@/modules/recordings/recovery/store/recording-reliability.store';
import { formatRecoveryFileSize } from '@/modules/recordings/recovery/utils/format';

const QUOTA_WARNING_BYTES = 500 * 1024 * 1024;

export function LocalStorageUsageIndicator() {
  const temporaryRecordings = useRecordingReliabilityStore((state) => state.temporaryRecordings);
  const [totalBytes, setTotalBytes] = useState(0);
  const [quotaWarning, setQuotaWarning] = useState(false);

  useEffect(() => {
    async function loadUsage() {
      const bytes = await recordingRecoveryService.getTotalPendingBytes();
      setTotalBytes(bytes);
      setQuotaWarning(bytes >= QUOTA_WARNING_BYTES);
    }

    void loadUsage();
  }, [temporaryRecordings]);

  if (temporaryRecordings.length === 0) return null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${quotaWarning ? 'border-highlight/40 bg-highlight/15' : 'border-border bg-muted/30'}`}
    >
      <p>
        Upload yang tertunda makan{' '}
        <span className="font-medium">{formatRecoveryFileSize(totalBytes)}</span> penyimpanan lokal
        <span className="text-muted-foreground"> · {temporaryRecordings.length} item</span>
      </p>
      {quotaWarning ? (
        <p className="text-status-warn mt-2 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Penyimpanan lokal hampir penuh. Upload atau buang rekaman yang tertunda biar lega lagi.
        </p>
      ) : null}
    </div>
  );
}
