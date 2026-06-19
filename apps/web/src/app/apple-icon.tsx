import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — the Palka cargo-box mark on the teal brand chip. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f8ba0',
        borderRadius: 40,
      }}
    >
      <svg width="118" height="118" viewBox="0 0 32 32" fill="none">
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
    </div>,
    { ...size },
  );
}
