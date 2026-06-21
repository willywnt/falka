import { QrCodeDialog } from '@falka/web';

export function Open() {
  return (
    <QrCodeDialog
      open
      onOpenChange={() => {}}
      value="KAOS-HITAM-L"
      name="Kaos Polos Lengan Pendek — Hitam / L"
      sku="KAOS-HITAM-L"
      lastPrintedAt="2026-06-18T09:15:00.000Z"
      onPrint={() => {}}
    />
  );
}
