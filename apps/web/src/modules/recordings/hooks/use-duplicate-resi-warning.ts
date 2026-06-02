'use client';

import { useCallback, useState } from 'react';

import { apiFetch } from '@/lib/api/fetch-client';
import { apiRoutes } from '@/lib/api/routes';
import type { RecordingListItem } from '@/modules/recordings/types';

export function useDuplicateResiWarning() {
  const [duplicateWarning, setDuplicateWarning] = useState<{
    noResi: string;
    recentRecording: RecordingListItem;
  } | null>(null);

  const checkDuplicate = useCallback(async (noResi: string): Promise<boolean> => {
    // The server does the exact-match, in-progress-aware, 24h-windowed lookup.
    const result = await apiFetch<RecordingListItem | null>(
      `${apiRoutes.recordings}/duplicate?noResi=${encodeURIComponent(noResi)}`,
    );

    if (!result.success || !result.data) {
      return false;
    }

    setDuplicateWarning({ noResi, recentRecording: result.data });
    return true;
  }, []);

  const clearDuplicateWarning = useCallback(() => {
    setDuplicateWarning(null);
  }, []);

  return {
    duplicateWarning,
    checkDuplicate,
    clearDuplicateWarning,
  };
}
