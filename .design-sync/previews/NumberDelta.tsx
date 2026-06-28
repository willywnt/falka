import { NumberDelta } from '@palka/web';

export function Signs() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 16 }}>
      <NumberDelta value={24} />
      <NumberDelta value={-12} />
      <NumberDelta value={0} showZero />
    </div>
  );
}

export function WithArrows() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 16 }}>
      <NumberDelta value={48} arrow />
      <NumberDelta value={-7} arrow />
    </div>
  );
}

export function Currency() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 16 }}>
      <NumberDelta value={4820000} arrow format={(n) => `Rp ${n.toLocaleString('id-ID')}`} />
      <NumberDelta value={-320000} arrow format={(n) => `Rp ${n.toLocaleString('id-ID')}`} />
    </div>
  );
}

export function InLedgerColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, width: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Penjualan kasir</span>
        <NumberDelta value={-18} arrow />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Penerimaan PO</span>
        <NumberDelta value={120} arrow />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Retur masuk</span>
        <NumberDelta value={3} arrow />
      </div>
    </div>
  );
}
