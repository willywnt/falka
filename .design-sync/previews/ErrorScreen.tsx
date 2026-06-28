import { ErrorScreen } from '@palka/web';

export function Default() {
  return (
    <div style={{ width: 520, border: '1px solid var(--border)', borderRadius: 12 }}>
      <ErrorScreen reset={() => {}} />
    </div>
  );
}

export function WithBrand() {
  return (
    <div style={{ width: 520, border: '1px solid var(--border)', borderRadius: 12 }}>
      <ErrorScreen reset={() => {}} withBrand />
    </div>
  );
}
