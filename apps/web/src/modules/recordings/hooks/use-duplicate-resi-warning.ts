'use client';

import { useCallback, useState } from 'react';

import { apiFetch } from '@/lib/api/fetch-client';
import { apiRoutes } from '@/lib/api/routes';
import type { RecordingListItem } from '@/modules/recordings/types';

const DUPLICATE_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export function useDuplicateResiWarning() {
  const [duplicateWarning, setDuplicateWarning] = useState<{
    noResi: string;
    recentRecording: RecordingListItem;
  } | null>(null);

  const checkDuplicate = useCallback(async (noResi: string): Promise<boolean> => {
    const result = await apiFetch<RecordingListItem[]>(
      `${apiRoutes.recordings}?page=1&pageSize=5&search=${encodeURIComponent(noResi)}&status=ALL&sortBy=createdAt&sortOrder=desc`,
    );

    if (!result.success || result.data.length === 0) {
      return false;
    }

    const recent = result.data.find((item) => item.noResi.toUpperCase() === noResi.toUpperCase());
    if (!recent) return false;

    const createdAt = new Date(recent.createdAt).getTime();
    if (Date.now() - createdAt > DUPLICATE_LOOKBACK_MS) {
      return false;
    }

    setDuplicateWarning({ noResi, recentRecording: recent });
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
