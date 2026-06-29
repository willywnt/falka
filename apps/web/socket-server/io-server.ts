import type { Server as HttpServer } from 'http';
import { Server, type Server as SocketIOServer } from 'socket.io';

import { SOCKET_PATH } from '../src/modules/scanner-pairing/config';
import { registerPairingSocketHandlers } from './register-handlers';

let io: SocketIOServer | null = null;

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '');
}

function resolveSocketCorsOrigins(isDev: boolean): boolean | string[] {
  if (isDev) {
    return true;
  }

  const origins = new Set<string>();
  for (const key of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_PAIRING_URL', 'AUTH_URL']) {
    const value = process.env[key]?.trim();
    if (value) {
      origins.add(normalizeOrigin(value));
    }
  }

  // Fail CLOSED in production: never reflect-any-origin with credentials. An empty allow-list is a
  // misconfiguration (missing app-URL env) that must fail loudly at boot, not silently allow any
  // origin to open a credentialed socket.
  if (origins.size === 0) {
    throw new Error(
      'Socket CORS allow-list is empty in production; set NEXT_PUBLIC_APP_URL / AUTH_URL.',
    );
  }

  return [...origins];
}

export function initPairingSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  const isDev = process.env.NODE_ENV !== 'production';

  io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: {
      origin: resolveSocketCorsOrigins(isDev),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  registerPairingSocketHandlers(io);
  return io;
}

export function getPairingSocketServer(): SocketIOServer | null {
  return io;
}
