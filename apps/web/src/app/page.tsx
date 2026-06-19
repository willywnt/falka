import Link from 'next/link';
import { ArrowRight, Boxes, RefreshCw, ShoppingCart } from 'lucide-react';
import { APP_NAME } from '@falka/config/constants';

import { auth } from '@/auth';
import { BrandBadge } from '@/components/brand-mark';
import { WaveHairline } from '@/components/maritime-art';
import { AnjunganMock, DisputeEvidenceMock } from '@/components/marketing/product-mocks';
import { ChannelSync } from '@/components/marketing/channel-sync';
import { OmzetChart, SellThrough } from '@/components/marketing/charts';
import { DaySteps } from '@/components/marketing/day-steps';
import { Faq } from '@/components/marketing/faq';
import { FeatureBento } from '@/components/marketing/feature-bento';
import { HeroFloat } from '@/components/marketing/hero-float';
import { LedgerTrail } from '@/components/marketing/ledger-trail';
import { MarketplaceStrip } from '@/components/marketing/marketplace-strip';
import { PanduSection } from '@/components/marketing/pandu-section';
import { RiakWaves, SectionHead, SuarDot } from '@/components/marketing/primitives';
import { Reveal } from '@/components/marketing/reveal';
import { ScannerKit } from '@/components/marketing/scanner-kit';
import { SecurityBand } from '@/components/marketing/security-band';
import { SiteFooter } from '@/components/marketing/site-footer';
import { ThemeToggle } from '@/components/marketing/theme-toggle';
import { Voyage } from '@/components/marketing/voyage';
import { Button } from '@/components/ui/button';

const NAV = [
  ['#sync', 'Sinkron stok'],
  ['#angka', 'Angka jujur'],
  ['#bukti', 'Bukti packing'],
  ['#fitur', 'Fitur'],
];
const SYNC_BULLETS = [
  [RefreshCw, 'Sinkron dua arah, real-time'],
  [ShoppingCart, 'Pesanan dibayar langsung potong stok'],
  [Boxes, 'Satu cache stok untuk semua toko'],
] as const;
const HERO_STATS = [
  ['3+', 'channel sinkron'],
  ['1', 'angka stok benar'],
  ['100%', 'paket ada buktinya'],
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const appHref = isLoggedIn ? '/dashboard' : '/login';
  const appLabel = isLoggedIn ? 'Buka aplikasi' : 'Masuk';

  return (
    <div className="bg-background min-h-screen">
      {/* HEADER */}
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-15.5 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandBadge />
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button asChild>
              <Link href={appHref}>
                {appLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="horizon-wash relative overflow-hidden">
        <div aria-hidden className="hero-dotgrid pointer-events-none absolute inset-0 opacity-55" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-160px] left-[52%] h-130 w-190"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in oklab, var(--primary) 22%, transparent), transparent)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-18 pb-24 lg:grid-cols-2">
          <div>
            <span className="border-primary/30 bg-primary/5 text-primary eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <SuarDot /> Stok · Kasir · Bukti packing
            </span>
            <h1 className="mt-5.5 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]">
              Lihat lebih tajam, jualan lebih tenang.
            </h1>
            <p className="text-muted-foreground mt-5.5 max-w-[480px] text-lg leading-relaxed text-pretty">
              {APP_NAME} menjaga satu angka stok yang benar di semua channel jualanmu — dan setiap
              paket yang keluar punya satu video bukti packing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={appHref}>
                  Mulai sekarang
                  <ArrowRight className="size-4.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#sync">Lihat cara kerjanya</a>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-6.5">
              {HERO_STATS.map(([n, l]) => (
                <div key={l}>
                  <p className="num-display text-primary text-2xl">{n}</p>
                  <p className="text-muted-foreground mt-0.5 text-[0.78rem]">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <HeroFloat>
              <div className="float-card">
                <AnjunganMock />
              </div>
            </HeroFloat>
            <p className="text-muted-foreground mt-3 text-center text-xs">
              Tampilan asli aplikasinya — bukan ilustrasi.
            </p>
          </div>
        </div>
        <RiakWaves />
        <div className="mx-auto max-w-6xl px-6 pb-2">
          <WaveHairline />
        </div>
      </section>

      <MarketplaceStrip />
      <DaySteps />

      {/* CHANNEL SYNC */}
      <section id="sync" className="bg-sea-glass border-y">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[0.92fr_1.08fr]">
          <Reveal>
            <SectionHead
              eyebrow="Sinkronisasi stok"
              title="Satu angka stok. Semua channel ikut."
              sub="StockLedger jadi sumber kebenaran — kaitkan listing sekali, dan stok Shopee, Tokopedia, dan TikTok Shop sinkron otomatis tiap ada penjualan. Online tak akan oversell."
            />
            <div className="mt-7 flex flex-col gap-3">
              {SYNC_BULLETS.map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-8.5 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-[0.95rem] font-medium">{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="rounded-3xl border bg-[color-mix(in_oklab,var(--card)_70%,transparent)] p-6 shadow-lg">
              <ChannelSync />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ANGKA JUJUR */}
      <section id="angka" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHead
            center
            eyebrow="Angka jujur"
            title="Tutup hari dengan angka yang bisa kamu percaya."
            sub="Omzet, margin bersih, dan kecepatan laku — dihitung otomatis dari transaksi nyata, retur sudah ikut diperhitungkan."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal>
            <div className="bg-card h-full rounded-3xl border p-6 shadow-sm">
              <OmzetChart />
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="bg-card h-full rounded-3xl border p-6 shadow-sm">
              <p className="eyebrow text-primary mb-1">Sell-through & restok</p>
              <p className="mb-4.5 font-semibold tracking-tight">Apa yang perlu kamu restok</p>
              <SellThrough />
            </div>
          </Reveal>
        </div>
      </section>

      {/* BUKTI */}
      <section id="bukti" className="bg-sea-glass border-y">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <SectionHead
              eyebrow="Bukti, bukan klaim"
              title="Setiap pergerakan stok ada buktinya."
              sub="Stok dicatat di buku besar yang hanya bisa bertambah baris — tak bisa diedit. Tiap paket direkam saat dipacking. Ada selisih atau komplain? Tinggal tunjukkan catatannya."
            />
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="bg-card h-full rounded-3xl border p-6 shadow-sm">
                <LedgerTrail />
                <p className="text-muted-foreground mt-4 text-sm text-pretty">
                  Buku besar stok yang tak bisa diedit — setiap angka ada riwayatnya.
                </p>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="bg-card flex h-full flex-col rounded-3xl border p-6 shadow-sm">
                <DisputeEvidenceMock />
                <p className="text-muted-foreground mt-4 text-sm text-pretty">
                  Komplain &ldquo;barang tidak sesuai&rdquo;? Kirim video packing resinya — sengketa
                  selesai dengan bukti, bukan debat.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <ScannerKit />
      <Voyage />
      <FeatureBento />
      <PanduSection />
      <SecurityBand />
      <Faq />

      {/* CTA */}
      <section id="cta" className="bg-sea-glass relative overflow-hidden border-t">
        <RiakWaves heightClass="h-50" className="opacity-80" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <Reveal>
            <BrandBadge className="mx-auto size-14 rounded-2xl" markClassName="size-7.5" />
            <h2 className="mx-auto mt-5.5 max-w-[620px] text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl lg:leading-[1.08]">
              Jualan lebih tenang, mulai hari ini.
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-[480px] text-[1.05rem] leading-relaxed">
              Stok akurat di semua channel, kasir offline, dan bukti packing — buat seller
              Indonesia.
            </p>
            <div className="mt-7.5 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href={appHref}>
                  Mulai sekarang
                  <ArrowRight className="size-4.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#sync">Lihat cara kerjanya</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
