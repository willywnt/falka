import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@falka/web';

export function InventoryTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Produk</TableHead>
          <TableHead className="text-right">Tersedia</TableHead>
          <TableHead className="text-right">Harga</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs">KAOS-HTM-L</TableCell>
          <TableCell>Kaos Polos — Hitam / L</TableCell>
          <TableCell className="text-right">142</TableCell>
          <TableCell className="text-right">Rp 75.000</TableCell>
          <TableCell>
            <Badge variant="secondary">Aman</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">CHN-KRM-32</TableCell>
          <TableCell>Celana Chino — Krem / 32</TableCell>
          <TableCell className="text-right">8</TableCell>
          <TableCell className="text-right">Rp 189.000</TableCell>
          <TableCell>
            <Badge>Menipis</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">TPI-NVY-OS</TableCell>
          <TableCell>Topi Trucker — Navy</TableCell>
          <TableCell className="text-right">0</TableCell>
          <TableCell className="text-right">Rp 59.000</TableCell>
          <TableCell>
            <Badge variant="destructive">Habis</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">JKT-DNM-M</TableCell>
          <TableCell>Jaket Denim — Biru / M</TableCell>
          <TableCell className="text-right">37</TableCell>
          <TableCell className="text-right">Rp 320.000</TableCell>
          <TableCell>
            <Badge variant="secondary">Aman</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total 4 varian</TableCell>
          <TableCell className="text-right">187</TableCell>
          <TableCell className="text-right" colSpan={2}>
            Rp 643.000
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function SalesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kode</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead>Metode</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs">S00482</TableCell>
          <TableCell>Budi Santoso</TableCell>
          <TableCell>QRIS</TableCell>
          <TableCell className="text-right">Rp 248.000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">S00483</TableCell>
          <TableCell>Siti Rahmawati</TableCell>
          <TableCell>Tunai</TableCell>
          <TableCell className="text-right">Rp 96.000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">S00484</TableCell>
          <TableCell>Andi Wijaya</TableCell>
          <TableCell>Transfer</TableCell>
          <TableCell className="text-right">Rp 512.000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">S00485</TableCell>
          <TableCell>Dewi Lestari</TableCell>
          <TableCell>QRIS</TableCell>
          <TableCell className="text-right">Rp 134.000</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
