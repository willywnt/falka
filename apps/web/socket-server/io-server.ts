import type { Server as HttpServer } from 'http';
import { Server, type Server as SocketIOServer } from 'socket.io';

import { SOCKET_PATH } from '../src/modules/scanner-pairing/config';
import { registerPairingSocketHandlers } from './register-handlers';

let io: SocketIOServer | null = null;

export function initPairingSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  const isDev = process.env.NODE_ENV !== 'production';

  io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: {
      // Dev: allow desktop (localhost) and phone (LAN IP) origins
      origin: isDev ? true : (process.env.NEXT_PUBLIC_APP_URL ?? true),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  registerPairingSocketHandlers(io);
  return io;
}

export function getPairingSocketServer(): SocketIOServer | null {
  return io;
}
