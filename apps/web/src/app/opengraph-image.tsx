import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Palka — stok akurat, kasir, dan bukti packing untuk seller Indonesia';

/** Open Graph card — Palka mark + wordmark + tagline on the warm-paper canvas. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#fdfcf8',
        backgroundImage: 'linear-gradient(180deg, #eef7f8 0%, #fdfcf8 55%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: '#1f8ba0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="58" height="58" viewBox="0 0 32 32" fill="none">
            <path d="M16 3.2 23.4 7.4 16 11.6 8.6 7.4Z" fill="#f7fcfd" fillOpacity="0.25" />
            <path
              d="M16 3.2 23.4 7.4 23.4 13 16 17.2 8.6 13 8.6 7.4Z"
              stroke="#f7fcfd"
              strokeWidth="2.3"
              strokeLinejoin="round"
            />
            <path
              d="M8.6 7.4 16 11.6 23.4 7.4M16 11.6V17.2"
              stroke="#f7fcfd"
              strokeWidth="2.3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M2.5 21.6c2.25-2.6 4.5-2.6 6.75 0s4.5 2.6 6.75 0 4.5-2.6 6.75 0 4.5 2.6 6.75 0"
              stroke="#f7fcfd"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <path
              d="M6.8 26.6c2.05-2.3 4.1-2.3 6.15 0s4.1 2.3 6.15 0 4.1-2.3 6.15 0"
              stroke="#f7fcfd"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: '#16323a', letterSpacing: -1 }}>
          Palka
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: '#16323a',
            letterSpacing: -2,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Lihat lebih tajam, jualan lebih tenang.
        </div>
        <div style={{ fontSize: 30, color: '#5a6b70', maxWidth: 860 }}>
          Stok akurat di semua channel, kasir, dan bukti packing — buat seller Indonesia.
        </div>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#1f8ba0', fontSize: 26 }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#ee5a32' }} />
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#1f9d6b' }} />
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#3b3f4a' }} />
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#7b54c9' }} />
        </div>
        <span style={{ color: '#5a6b70' }}>
          Shopee · Tokopedia · TikTok Shop · Lazada — dan terus bertambah
        </span>
      </div>
    </div>,
    { ...size },
  );
}
