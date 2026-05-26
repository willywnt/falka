import { RECORDING_MODULE_CONFIG } from '../types';

type TabLockPayload = {
  tabId: string;
  acquiredAt: number;
};

function getTabId(): string {
  if (typeof window === 'undefined') return 'server';

  const key = 'olshop-recording-tab-id';
  const existing = sessionStorage.getItem(key);

  if (existing) return existing;

  const tabId = crypto.randomUUID();
  sessionStorage.setItem(key, tabId);
  return tabId;
}

function readLock(): TabLockPayload | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(RECORDING_MODULE_CONFIG.tabLockKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TabLockPayload;
  } catch {
    return null;
  }
}

function writeLock(payload: TabLockPayload): void {
  localStorage.setItem(RECORDING_MODULE_CONFIG.tabLockKey, JSON.stringify(payload));
}

function clearLock(tabId: string): void {
  const current = readLock();
  if (current?.tabId === tabId) {
    localStorage.removeItem(RECORDING_MODULE_CONFIG.tabLockKey);
  }
}

function isLockStale(lock: TabLockPayload): boolean {
  return Date.now() - lock.acquiredAt > RECORDING_MODULE_CONFIG.tabLockStaleMs;
}

export function acquireTabLock(): boolean {
  const tabId = getTabId();
  const current = readLock();

  if (current && !isLockStale(current) && current.tabId !== tabId) {
    return false;
  }

  writeLock({ tabId, acquiredAt: Date.now() });
  return readLock()?.tabId === tabId;
}

export function releaseTabLock(): void {
  clearLock(getTabId());
}

export function refreshTabLock(): void {
  const tabId = getTabId();
  const current = readLock();

  if (current?.tabId === tabId) {
    writeLock({ tabId, acquiredAt: Date.now() });
  }
}

export function createTabLockChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(RECORDING_MODULE_CONFIG.tabLockChannel);
}

export function isAnotherTabRecording(): boolean {
  const current = readLock();
  if (!current || isLockStale(current)) return false;
  return current.tabId !== getTabId();
}
