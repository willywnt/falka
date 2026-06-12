# UX Overhaul Experiment — riset & eksekusi (2026-06-12)

> Status: **diimplementasikan di branch `feat/experiment-redesigned`** — semua gate hijau.
> Mandat: overhaul struktur/IA/interaksi dari landing sampai dashboard; tema "Suar Dermaga"
> (palet, token, brand) **tetap**; semua fitur **dipertahankan**.

---

## 1. Ringkasan riset

Riset dijalankan sebelum desain: 5 pembaca paralel atas dokumentasi + kode (jurnal bisnis,
inventaris fitur 40 rute, audit design-system) dan 3 peneliti web (pola vertikal, benchmark
kompetitor, pola segar lintas-genre).

### Vertikal & persona

UMKM seller omnichannel Indonesia (Shopee/Tokopedia/TikTok + konter offline). Persona utama:
**owner-operator solo** — non-teknis, phone-heavy, dikejar waktu; buka aplikasi pagi hari
di antara lakban dan jemputan kurir. Wedge produk: **bukti video packing per resi** +
**ledger stok append-only** (kebenaran yang bisa ditunjukkan).

### Konvensi genre (benchmark 13 produk: Jubelio, Ginee, BigSeller, Forstok, Olsera, Moka,

Dealpos + Shopify, Zoho, Cin7, Katana, Square, Lightspeed)

| Konvensi genre                                                                                        | Celah yang dieksploitasi                                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Dashboard default = KPI pasif + filter tanggal                                                        | Hanya Shopify yang task-oriented; **Falka: antrian kerja**        |
| Sidebar kata-benda (Produk/Pesanan/Gudang) di 12 dari 13 produk                                       | Hanya Katana pakai kata-kerja; **Falka: grup berbasis pekerjaan** |
| Landing page ID **tidak pernah menampilkan produk** (nol screenshot di Jubelio/BigSeller/Olsera/Moka) | **Falka: UI asli sebagai bukti** (mock dari primitif nyata)       |
| Bukti = logo wall + statistik agregat                                                                 | **Falka: bukti-bukan-klaim** (ledger trail + video sengketa)      |
| Tooling fisik dijual sebagai hardware (Square Terminal, Dealpos)                                      | **Falka: "gudang tanpa alat mahal"** (HP-jadi-scanner)            |
| Navigasi makin dalam = backlash (kasus redesign Square: 3–5 klik, favorit dihapus)                    | **Falka: command palette + aksi panas ≤2 klik**                   |
| Belum ada asisten apa pun di kompetitor ID; global = AI hype                                          | **Pandu jujur ("Pratinjau", deterministik)** tampil lebih luas    |

### Pola segar lintas-genre yang diadopsi

- **Briefing/Today-view** (Things 3, Flighty, Shopify Home): pagi = perintah kerja, bukan grafik.
- **Command palette sebagai onboarding** (Linear/Superhuman/Retool): satu kotak cari = satu
  muscle memory; kbd hint mengajarkan shortcut; bagi pengguna non-teknis ia "cuma search box".
- **Status ambient / calm-tech**: hitungan hidup di pinggiran (badge nav), eskalasi amber suar
  hanya saat butuh manusia.
- **Interactive demo di landing** (Navattic/Arcade: penonton demo konversi ~4×): versi jujur
  Falka = mock UI nyata dari primitif design-system (tanpa backend), bukan screenshot.

---

## 2. Arah desain terpilih

**"Anjungan yang memerintah, bukan memajang"** — struktur diubah ke arah kerja-harian:

1. **Antrian kerja** menggantikan posisi teratas home (oversold → restok mendesak → pesanan
   dibayar belum dikirim → retur menunggu), setiap baris deep-link ke list ter-filter
   (`?status=PAID`, `?status=PENDING`). KPI + chart inventaris tetap di bawahnya (paritas).
2. **Command palette Ctrl+K** (`components/command-palette.tsx`): navigasi + aksi Buat + router
   Pandu dalam satu permukaan deterministik; trigger = "search box" di navbar (md+) dan ikon
   cari (ponsel). Tanpa dependensi baru; jujur — semua hasil adalah rute nyata.
3. **IA berbasis pekerjaan** (`components/layout/nav-config.tsx`, satu sumber): Jualan / Stok /
   Katalog / Kirim & retur / Laporan / Sistem; "Saran restok" + "Aktivitas stok" naik jadi item
   nav; CREATE_ACTIONS + MOBILE_TABS + suppression list terpusat.
4. **Ops-pulse badges** (`use-ops-pulse.ts`): hitungan hidup di nav (pesanan PAID, retur
   PENDING, restok URGENT) dari query yang SUDAH ada (meta.total @ pageSize 1) — amber suar
   hanya untuk restok mendesak.
5. **Landing naratif yang menampilkan produk**: hero dua kolom dengan mock Anjungan nyata;
   "Satu hari bersama Falka" (Pagi/Siang/Sore/Malam); "Bukti, bukan klaim" (ledger trail +
   penyelesaian sengketa via video); "Gudang tanpa alat mahal"; 6 kartu fitur lama dipertahankan;
   teaser Pandu jujur tetap. Tanpa testimoni/harga/statistik karangan.
6. **Panel auth** berhenti mengulang kartu fitur landing → vignette antrian kerja di permukaan
   white/10.

Tema, token, motion (`--ease-tide`), guard reduced-motion: **tidak berubah**.

---

## 3. Checklist paritas fitur (40 rute — semuanya dipertahankan)

**Permukaan yang dirombak (perilaku dipertahankan, struktur baru):**

- `/` landing — semua 6 klaim fitur lama tetap; CTA session-aware tetap; tambah 4 seksi baru.
- `/login` + `/register` (layout) — form, validator, alur auth TIDAK disentuh; hanya panel kiri.
- `/dashboard` home — greeting + tanggal tetap; 5 pintasan tetap (href sama); WaveHairline +
  InventoryDashboard (KPI, arus stok, komposisi, perlu restok, pergerakan) utuh; hero Pandu bar
  diganti palette navbar (kemampuan yang sama, permukaan lebih global; dock Pandu tetap).
- Shell — semua 20 destinasi nav tetap ada (tak satu pun rute hilang); menu Buat 4 aksi tetap;
  tab bar 5 slot tetap; dock Pandu + suppression list tetap; accordion + cookie sidebar tetap;
  toggle tema, menu akun, judul halaman mobile tetap.

**Tidak disentuh sama sekali (35 permukaan):** `/share/[token]`, `/mobile/connect`,
`/recordings` (stasiun), `/settings`, products (+detail), bundles (list/new/detail), labels,
inventory (overview/activity/reorder/opname/opname detail), orders (+detail), returns (+detail),
sales (list/POS/detail), purchasing (list/new/detail), marketplace (+detail),
recordings history, reports (profit/channels-redirect/inventory-value/dead-stock), error/404
routes, recovery overlay, Pandu dock & nudges.

**Hard constraints**: Prisma/migrations, Auth.js/middleware/cookies, env, kontrak Socket.IO,
dua happy-flow — tidak tersentuh.

---

## 4. Elemen segar (dan kenapa)

| Elemen                                                        | Kelangkaan di genre                                      | Dasar riset                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Antrian kerja sebagai layar default                           | Absen di 7 kompetitor ID; hanya Shopify Home yang serupa | Task-first home; backlash Square saat orders terkubur           |
| Command palette ID informal + router Pandu                    | Tidak ada di 13 produk benchmark                         | Linear/Superhuman/Retool; "palette = search box" utk non-teknis |
| Badge denyut operasional di nav                               | Trading terminal punya; inventory SaaS UMKM tidak        | Calm-tech: pinggiran tenang, amber hanya saat perlu manusia     |
| Landing yang menampilkan UI asli (bukan screenshot/stock art) | Nol kompetitor ID menampilkan produknya                  | Interactive-demo research (konversi ~4×), versi statis-jujur    |
| "Bukti, bukan klaim" (ledger + video sengketa di marketing)   | Unik — packing-video tidak dipasarkan siapa pun          | Genre proof = logo wall; Falka punya artefak bukti nyata        |

---

## 5. Saran lanjutan dari riset (BELUM diimplementasikan — butuh persetujuan)

1. **Papan Keberangkatan** — mode layar penuh stasiun packing (resi/status real-time via socket).
2. **Peek panel** list→detail (pesanan/varian) tanpa kehilangan scroll/filter; **"Jual cepat"**
   overlay global.
3. **Palette sadar-scan**: wedge listener global → resi/SKU/kode dokumen (S00001/PO00001) loncat
   ke detail; entity search di palette.
4. **Rekap WA / Tutup Hari**: kartu rekap harian/bulanan ukuran WA-Status dari modul reporting.
5. **Gauge days-of-cover** di baris tabel inventaris + "Buat PO" satu klik.
6. **Quick-tender kasir** (uang pas / 50rb / 100rb) + peta shortcut keyboard POS.
7. **Density toggle + sticky kolom identitas** untuk tabel-tabel padat.
8. **Onboarding stok-dulu** ("catat stok kamu dulu", marketplace belakangan) saat onboarding
   wizard dibangun.
