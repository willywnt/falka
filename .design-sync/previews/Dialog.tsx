import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@palka/web';

export function EditProduct() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesuaikan stok</DialogTitle>
          <DialogDescription>
            Kaos Polos Lengan Panjang — Hitam / L (SKU KPL-HTM-L)
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label htmlFor="qty">Jumlah penyesuaian</Label>
            <Input id="qty" defaultValue="+24" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label htmlFor="note">Catatan</Label>
            <Input id="note" defaultValue="Terima kiriman dari pemasok" />
          </div>
        </div>
        <DialogFooter style={{ gap: 8 }}>
          <Button variant="outline">Batal</Button>
          <Button>Simpan perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
