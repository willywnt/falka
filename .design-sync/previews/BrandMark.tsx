import { BrandMark } from '@palka/web';

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, color: 'var(--primary, #0f766e)' }}>
      <BrandMark className="size-5" />
      <BrandMark className="size-8" />
      <BrandMark className="size-12" />
      <BrandMark className="size-16" />
    </div>
  );
}

export function Lockup() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--primary, #0f766e)',
      }}
    >
      <BrandMark className="size-7" />
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--foreground, #1c2530)',
        }}
      >
        Palka
      </span>
    </div>
  );
}
