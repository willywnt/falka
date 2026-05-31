'use client';

import { useEffect } from 'react';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useActivePairingQuery, useDisconnectPairingMutation } from '../hooks/use-pairing-api';
import { useDesktopScannerSocket } from '../hooks/use-desktop-scanner-socket';
import { useScannerPairingStore } from '../store/scanner-pairing.store';

type ScannerStatusWidgetProps = {
  onConnectClick: () => void;
};

export function ScannerStatusWidget({ onConnectClick }: ScannerStatusWidgetProps) {
  const { data: activeSession, refetch } = useActivePairingQuery();
  const setSession = useScannerPairingStore((s) => s.setSession);
  const connectionState = useScannerPairingStore((s) => s.connectionState);

  const storeSession = useScannerPairingStore((s) => s.session);
  const session = storeSession ?? activeSession?.session ?? null;
  const disconnectMutation = useDisconnectPairingMutation();

  useDesktopScannerSocket(session?.id ?? null);

  useEffect(() => {
    if (activeSession?.session) {
      setSession(activeSession.session);
    }
  }, [activeSession, setSession]);

  const isConnected = session?.status === 'CONNECTED' || connectionState === 'connected';

  const handleDisconnect = async () => {
    if (!session?.id) return;
    await disconnectMutation.mutateAsync(session.id);
    setSession(null);
    void refetch();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Smartphone className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">Mobile scanner</p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {isConnected ? (
              <>
                <Wifi className="size-3 text-emerald-600" />
                Connected — scan barcodes on your phone
              </>
            ) : (
              <>
                <WifiOff className="size-3" />
                {session?.status === 'PENDING' ? 'Waiting for phone…' : 'Not connected'}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {isConnected && session?.id ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disconnectMutation.isPending}
            onClick={() => void handleDisconnect()}
          >
            Disconnect
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={onConnectClick}>
          {isConnected ? 'QR' : 'Connect'}
        </Button>
      </div>
    </div>
  );
}
