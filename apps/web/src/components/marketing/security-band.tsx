import { Lock, ScrollText, Shield, Users } from 'lucide-react';

import { Reveal } from './reveal';

const TRUST = [
  {
    Icon: Lock,
    title: 'Buku besar append-only',
    text: 'Stok cuma bisa nambah baris, nggak bisa diedit diam-diam. Setiap angka punya jejak.',
  },
  {
    Icon: ScrollText,
    title: 'Jejak audit lengkap',
    text: 'Siapa mengubah apa dan kapan — terekam dan bisa diekspor untuk pembukuan.',
  },
  {
    Icon: Users,
    title: 'Multi-pengguna & hak akses',
    text: 'Atur peran kasir, gudang, dan admin. Tiap orang lihat yang perlu mereka lihat saja.',
  },
];

/** Trust band — append-only ledger, audit trail, RBAC. */
export function SecurityBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <Reveal>
        <div className="bg-card relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-11">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="bg-primary/10 text-primary flex size-13 items-center justify-center rounded-2xl">
                <Shield className="size-6.5" />
              </span>
              <h2 className="mt-4.5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Tenang — datamu rapi, aman, dan teraudit.
              </h2>
              <p className="text-muted-foreground mt-3.5 leading-relaxed text-pretty">
                Palka dibangun seperti buku besar kapal: setiap pergerakan tercatat, tak bisa
                dihapus, dan bisa kamu pertanggungjawabkan kapan saja.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              {TRUST.map(({ Icon, title, text }) => (
                <div
                  key={title}
                  className="flex gap-3.5 rounded-2xl border bg-[color-mix(in_oklab,var(--sea-glass)_50%,var(--card))] px-4.5 py-4"
                >
                  <span className="text-primary mt-0.5 shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[0.98rem] font-semibold tracking-tight">{title}</h3>
                    <p className="text-muted-foreground mt-1.25 text-[0.88rem] leading-relaxed text-pretty">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
