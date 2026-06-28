import { Avatar, Badge } from '@palka/web';

export function Initials() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Budi Santoso" />
      <Avatar name="Siti Rahmawati" />
      <Avatar name="Toko Palka Demo" />
      <Avatar name="owner@palka.demo" />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Andi Wijaya" className="size-6 text-[10px]" />
      <Avatar name="Andi Wijaya" />
      <Avatar name="Andi Wijaya" className="size-10 text-sm" />
      <Avatar name="Andi Wijaya" className="size-12 text-base" />
    </div>
  );
}

export function MemberRow() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Avatar name="Rina Kusuma" />
        <div style={{ display: 'grid', gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Rina Kusuma</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>
            rina@palka.demo
          </span>
        </div>
        <Badge variant="secondary" style={{ marginLeft: 'auto' }}>
          OWNER
        </Badge>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Avatar name="Dewi Lestari" />
        <div style={{ display: 'grid', gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Dewi Lestari</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>
            dewi@palka.demo
          </span>
        </div>
        <Badge variant="outline" style={{ marginLeft: 'auto' }}>
          STAFF
        </Badge>
      </div>
    </div>
  );
}
