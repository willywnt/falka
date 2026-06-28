import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Button,
} from '@palka/web';
import { MoreHorizontal, Pencil, QrCode, PackagePlus, Trash2 } from 'lucide-react';

export function RowActions() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal style={{ width: 16, height: 16 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Aksi varian</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Pencil />
          Ubah informasi tambahan
        </DropdownMenuItem>
        <DropdownMenuItem>
          <QrCode />
          Cetak label QR
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PackagePlus />
          Buat PO
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Hapus varian
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
