import { ImageResponse } from 'next/og';

export const alt = 'Falka — stok akurat, kasir, dan bukti packing untuk pedagang online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// A literal ledger sheet on warm paper: hairline rules, the falcon-eye mark,
// micro-caps eyebrow, the ID tagline — the brand where outsiders first meet it.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#fdfcf8',
        padding: '72px 84px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 18,
            backgroundColor: '#1f8ba0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
            <g stroke="#f7fcfd" strokeWidth="4.8" fill="none" strokeLinecap="round">
              <circle cx="32" cy="23" r="12.5" />
              <path d="M5 43c4.5-5.2 9-5.2 13.5 0s9 5.2 13.5 0 9-5.2 13.5 0 9 5.2 13.5 0" />
              <path d="M13.6 53c4.1-4.6 8.2-4.6 12.3 0s8.2 4.6 12.3 0 8.2-4.6 12.3 0" />
            </g>
            <circle cx="32" cy="23" r="4.8" fill="#f7fcfd" />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: '#23272f' }}>
          Falka
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 6,
            color: '#1f8ba0',
            fontWeight: 600,
          }}
        >
          STOK · KASIR · BUKTI PACKING
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 62,
            fontWeight: 700,
            color: '#23272f',
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Lihat lebih tajam, jualan lebih tenang.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <svg width="1032" height="14" viewBox="0 0 1032 14" fill="none">
          <path
            d="M1 7c21.5-12 43-12 64.5 0s43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0 43-12 64.5 0 43 12 64.5 0"
            stroke="#1f8ba0"
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: 'flex', fontSize: 26, color: '#6b7280' }}>
          Stok akurat di semua channel, kasir, dan bukti packing untuk pedagang online.
        </div>
      </div>
    </div>,
    size,
  );
}
