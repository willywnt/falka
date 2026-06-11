import { ImageResponse } from 'next/og';

export const alt = 'Bukti packing — Falka';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Deliberately data-free: share tokens land in WhatsApp/marketplace chats, so
// the preview brands the evidence without leaking resi or order details.
export default function ShareOpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        backgroundColor: '#fdfcf8',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: '#1f8ba0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <g stroke="#f7fcfd" strokeWidth="4.8" fill="none" strokeLinecap="round">
            <circle cx="32" cy="23" r="12.5" />
            <path d="M5 43c4.5-5.2 9-5.2 13.5 0s9 5.2 13.5 0 9-5.2 13.5 0 9 5.2 13.5 0" />
            <path d="M13.6 53c4.1-4.6 8.2-4.6 12.3 0s8.2 4.6 12.3 0 8.2-4.6 12.3 0" />
          </g>
          <circle cx="32" cy="23" r="4.8" fill="#f7fcfd" />
        </svg>
      </div>
      <div style={{ display: 'flex', fontSize: 58, fontWeight: 700, color: '#23272f' }}>
        Bukti packing
      </div>
      <div style={{ display: 'flex', fontSize: 28, color: '#6b7280' }}>
        Video packing pesanan — dibagikan lewat Falka
      </div>
      <svg width="520" height="14" viewBox="0 0 520 14" fill="none">
        <path
          d="M1 7c21.6-12 43.2-12 64.9 0s43.2 12 64.9 0 43.2-12 64.9 0 43.2 12 64.9 0 43.2-12 64.9 0 43.2 12 64.9 0 43.2-12 64.9 0 43.2 12 64.9 0"
          stroke="#1f8ba0"
          strokeOpacity="0.35"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    size,
  );
}
