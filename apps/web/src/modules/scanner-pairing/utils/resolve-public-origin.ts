import os from 'os';

import { isDevHttpsEnabled } from '@/lib/dev-https';

const VIRTUAL_INTERFACE_PATTERN =
  /virtual|vethernet|vmware|hyper-v|wsl|loopback|docker|npcap|bluetooth/i;

function isIPv4Entry(family: string | number): boolean {
  return family === 'IPv4' || family === 4;
}

/** First non-internal IPv4 on a physical-ish interface (dev LAN QR / mobile scan). */
export function getLocalLanIPv4(): string | null {
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses || VIRTUAL_INTERFACE_PATTERN.test(name)) continue;

    for (const entry of addresses) {
      if (isIPv4Entry(entry.family) && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

function devUsesHttps(): boolean {
  return isDevHttpsEnabled();
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '');
}

/** LAN/mobile origins must use https when the dev server has DEV_HTTPS enabled. */
export function ensureHttpsOrigin(url: string): string {
  try {
    const parsed = new URL(normalizeOrigin(url));
    parsed.protocol = 'https:';
    return parsed.origin;
  } catch {
    return normalizeOrigin(url).replace(/^http:\/\//i, 'https://');
  }
}

function buildLanOrigin(host: string): string {
  const port = process.env.PORT ?? '3000';
  const protocol = devUsesHttps() ? 'https' : 'http';
  return `${protocol}://${host}:${port}`;
}

/**
 * Mobile / QR pairing URL only (LAN). Desktop keeps NEXT_PUBLIC_APP_URL (localhost).
 */
export function resolveMobilePairingOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_PAIRING_URL?.trim();
  if (explicit) {
    const origin = normalizeOrigin(explicit);
    return devUsesHttps() ? ensureHttpsOrigin(origin) : origin;
  }

  if (process.env.NODE_ENV === 'production') {
    const fallback =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000';
    return normalizeOrigin(fallback);
  }

  const lanHost = process.env.PAIRING_LAN_HOST ?? getLocalLanIPv4();
  if (lanHost) {
    return buildLanOrigin(lanHost);
  }

  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}

/** Desktop browser URL in dev (from env, typically localhost). */
export function resolveDesktopDevOrigin(): string {
  const port = process.env.PORT ?? '3000';
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? `http://localhost:${port}`;
  return normalizeOrigin(configured);
}
