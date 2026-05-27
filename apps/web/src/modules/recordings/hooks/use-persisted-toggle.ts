'use client';

import { useCallback, useEffect, useState } from 'react';

export function usePersistedToggle(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setValue(stored === 'true');
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setValue((current) => {
      const next = !current;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [storageKey]);

  const setPersisted = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  return { value, toggle, setValue: setPersisted, hydrated };
}
