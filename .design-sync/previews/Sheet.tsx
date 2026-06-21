import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  StatusBadge,
} from '@falka/web';

export function OrderPeek() {
  return (
    <Sheet open>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Pesanan #S00482</SheetTitle>
          <SheetDescription>Shopee • 21 Jun 2026, 14:08</SheetDescription>
        </SheetHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>Status</span>
            <StatusBadge tone="ok">Lunas</StatusBadge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kaos Polos — Hitam / M × 2</span>
              <span>Rp 110.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Topi Rajut — Krem × 1</span>
              <span>Rp 65.000</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 600,
                borderTop: '1px solid var(--border)',
                paddingTop: 8,
              }}
            >
              <span>Total</span>
              <span>Rp 175.000</span>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button>Buka detail pesanan</Button>
          <Button variant="outline">Lihat video kemas</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
