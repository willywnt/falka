import Link from 'next/link';
import { APP_NAME } from '@falka/config/constants';
import { Boxes, PackageCheck, RefreshCw } from 'lucide-react';

import { BrandBadge } from '@/components/brand-mark';

const HIGHLIGHTS = [
  {
    icon: Boxes,
    title: 'Always-accurate stock',
    text: 'One stock count you can trust, everywhere.',
  },
  {
    icon: RefreshCw,
    title: 'Synced across stores',
    text: 'Stock stays in sync so you never oversell.',
  },
  {
    icon: PackageCheck,
    title: 'Packing video proof',
    text: 'A video of every order you pack, for disputes.',
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
          <BrandBadge className="text-primary size-9 bg-white" markClassName="size-6" />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              See sharper. Sell calmer.
            </h2>
            <p className="text-primary-foreground/70 max-w-sm text-pretty">
              Orders from every store in, accurate stock in sync, a packing video out.
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
            <BrandBadge />
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
