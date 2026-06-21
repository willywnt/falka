import { Tabs, TabsList, TabsTrigger, TabsContent } from '@falka/web';

export function ProductTabs() {
  return (
    <Tabs defaultValue="produk" style={{ width: 360 }}>
      <TabsList>
        <TabsTrigger value="produk">Produk</TabsTrigger>
        <TabsTrigger value="bundling">Bundling</TabsTrigger>
        <TabsTrigger value="arsip">Terarsip</TabsTrigger>
      </TabsList>
      <TabsContent value="produk">
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '8px 0 0', color: 'var(--foreground)' }}>
          248 SKU aktif. Kaos Polos, Celana Chino, dan Jaket Denim adalah produk terlaris pekan ini.
        </p>
      </TabsContent>
      <TabsContent value="bundling">
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            margin: '8px 0 0',
            color: 'var(--muted-foreground, #6b7280)',
          }}
        >
          6 paket bundling aktif, mis. Paket Hemat Kaos + Topi.
        </p>
      </TabsContent>
      <TabsContent value="arsip">
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            margin: '8px 0 0',
            color: 'var(--muted-foreground, #6b7280)',
          }}
        >
          14 varian terarsip — bisa dipulihkan kapan saja.
        </p>
      </TabsContent>
    </Tabs>
  );
}

export function ReportTabs() {
  return (
    <Tabs defaultValue="margin" style={{ width: 360 }}>
      <TabsList>
        <TabsTrigger value="margin">Margin</TabsTrigger>
        <TabsTrigger value="channel">Per kanal</TabsTrigger>
      </TabsList>
      <TabsContent value="margin">
        <div style={{ display: 'grid', gap: 4, marginTop: 8, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted-foreground, #6b7280)' }}>Omzet bersih</span>
            <span style={{ fontWeight: 600 }}>Rp 28.400.000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted-foreground, #6b7280)' }}>Margin kotor</span>
            <span style={{ fontWeight: 600 }}>34%</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="channel">
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            margin: '8px 0 0',
            color: 'var(--muted-foreground, #6b7280)',
          }}
        >
          Shopee 48% • Lazada 31% • Kasir 21%.
        </p>
      </TabsContent>
    </Tabs>
  );
}
