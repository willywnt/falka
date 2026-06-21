import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Label,
  Input,
} from '@falka/web';
import { SlidersHorizontal } from 'lucide-react';

export function StockFilter() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal style={{ width: 16, height: 16 }} />
          Filter stok
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Saring inventaris</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>
              Batas stok tersedia per varian
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Label htmlFor="min">Min</Label>
              <Input id="min" defaultValue="0" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Label htmlFor="max">Maks</Label>
              <Input id="max" defaultValue="10" />
            </div>
          </div>
          <Button size="sm">Terapkan</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
