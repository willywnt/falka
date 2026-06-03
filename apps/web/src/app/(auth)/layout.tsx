import Link from 'next/link';
import { APP_NAME } from '@olshop/config/constants';
import { Boxes, PackageCheck, RefreshCw } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Boxes, title: 'One source of truth', text: 'An internal stock ledger that never lies.' },
  {
    icon: RefreshCw,
    title: 'Multi-marketplace sync',
    text: 'Push stock across channels, prevent oversell.',
  },
  {
    icon: PackageCheck,
    title: 'Packing-video proof',
    text: 'Evidence per resi against buyer disputes.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="text-primary flex size-9 items-center justify-center rounded-lg bg-white text-base font-bold">
            {APP_NAME.charAt(0)}
          </span>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Inventory &amp; fulfillment, in one place.
            </h2>
            <p className="text-primary-foreground/70 max-w-sm text-pretty">
              Multi-channel orders in, stock as the source of truth, packing-video proof out.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-primary-foreground/60 text-sm">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-primary-foreground/50 relative text-xs">Built for Indonesian sellers.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="flex items-center justify-center gap-2 lg:hidden">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
              {APP_NAME.charAt(0)}
            </span>
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
