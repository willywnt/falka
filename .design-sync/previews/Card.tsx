import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  Button,
  Badge,
} from '@palka/web';

export function Basic() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <CardTitle>Ringkasan pesanan</CardTitle>
        <CardDescription>3 item • dikemas hari ini</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Total belanja Rp 248.000 termasuk ongkir Rp 18.000. Pembeli memilih kurir reguler dan
          meminta bubble wrap tambahan.
        </p>
      </CardContent>
      <CardFooter style={{ gap: 8 }}>
        <Button>Proses pesanan</Button>
        <Button variant="outline">Tunda</Button>
      </CardFooter>
    </Card>
  );
}

export function WithAction() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader className="border-b">
        <CardTitle>Stok menipis</CardTitle>
        <CardDescription>Kaos Polos — Hitam / L</CardDescription>
        <CardAction>
          <Badge variant="secondary">5 tersisa</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Rata-rata terjual 4 pcs/hari. Perkiraan habis dalam 1–2 hari, pertimbangkan buat PO ke
          pemasok.
        </p>
      </CardContent>
    </Card>
  );
}
