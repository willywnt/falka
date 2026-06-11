import type { PairingPurpose } from '@prisma/client';

/**
 * Single source of purpose-aware copy for the shared pairing UI. The same socket
 * flow drives two very different stations — packing-video recordings and the POS
 * till — so the desktop dialog and the phone screen read from here to stay
 * informative instead of generic ("Mobile scanner").
 */
export type StationPurposeMeta = {
  /** Desktop-facing name of the station this pairing drives. */
  label: string;
  /** Compact name for chips/badges. */
  shortLabel: string;
  /** What the connect dialog tells the operator the phone will do. */
  description: string;
  /** Title shown on the phone scanner screen. */
  mobileTitle: string;
  /** What to point the phone camera at. */
  scanHint: string;
  /** Phone status copy while linking to the station. */
  connectingLabel: string;
  /** Phone error copy when the station is unreachable. */
  unreachableLabel: string;
  /** Phone toast description after a successful scan. */
  mobileScanSuccess: (barcode: string) => string;
};

export const STATION_PURPOSE_META: Record<PairingPurpose, StationPurposeMeta> = {
  RECORDING: {
    label: 'Station rekaman',
    shortLabel: 'Rekaman',
    description: 'Scan barcode resi di label pengiriman buat otomatis mulai video packing.',
    mobileTitle: 'Scanner packing',
    scanHint: 'Arahkan kamera ke barcode resi di label pengiriman',
    connectingLabel: 'Menghubungkan ke station rekaman…',
    unreachableLabel: 'Station rekaman nggak bisa dihubungi.',
    mobileScanSuccess: (barcode) => `${barcode} — rekaman dimulai di desktop`,
  },
  POS: {
    label: 'Kasir',
    shortLabel: 'Kasir',
    description: 'Scan label QR atau barcode produk buat menambahkannya ke keranjang.',
    mobileTitle: 'Scanner kasir',
    scanHint: 'Arahkan kamera ke label QR atau barcode produk',
    connectingLabel: 'Menghubungkan ke kasir…',
    unreachableLabel: 'Kasir nggak bisa dihubungi.',
    mobileScanSuccess: (barcode) => `${barcode} — masuk ke keranjang`,
  },
  PURCHASING: {
    label: 'Pembelian (PO)',
    shortLabel: 'Pembelian',
    description: 'Scan label QR atau barcode produk buat menambahkannya ke pembelian (PO).',
    mobileTitle: 'Scanner pembelian',
    scanHint: 'Arahkan kamera ke label QR atau barcode produk',
    connectingLabel: 'Menghubungkan ke pembelian (PO)…',
    unreachableLabel: 'Pembelian (PO) nggak bisa dihubungi.',
    mobileScanSuccess: (barcode) => `${barcode} — masuk ke PO`,
  },
  OPNAME: {
    label: 'Opname stok',
    shortLabel: 'Opname',
    description: 'Scan label QR atau barcode produk buat menambah hitungan opname (+1 per scan).',
    mobileTitle: 'Scanner opname',
    scanHint: 'Arahkan kamera ke label QR atau barcode produk',
    connectingLabel: 'Menghubungkan ke opname stok…',
    unreachableLabel: 'Stasiun opname nggak bisa dihubungi.',
    mobileScanSuccess: (barcode) => `${barcode} — hitungan bertambah`,
  },
};

/** Meta for a purpose, defaulting to recordings (the legacy/back-compat station). */
export function stationPurposeMeta(purpose: PairingPurpose | null | undefined): StationPurposeMeta {
  return STATION_PURPOSE_META[purpose ?? 'RECORDING'];
}
