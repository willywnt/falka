import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS ignores transparency, so the chip ships its own solid teal ground;
// the OS applies the squircle mask itself.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f8ba0',
      }}
    >
      <svg width="124" height="124" viewBox="0 0 64 64" fill="none">
        <g stroke="#f7fcfd" strokeWidth="4.8" fill="none" strokeLinecap="round">
          <circle cx="32" cy="23" r="12.5" />
          <path d="M5 43c4.5-5.2 9-5.2 13.5 0s9 5.2 13.5 0 9-5.2 13.5 0 9 5.2 13.5 0" />
          <path d="M13.6 53c4.1-4.6 8.2-4.6 12.3 0s8.2 4.6 12.3 0 8.2-4.6 12.3 0" />
        </g>
        <circle cx="32" cy="23" r="4.8" fill="#f7fcfd" />
      </svg>
    </div>,
    size,
  );
}
