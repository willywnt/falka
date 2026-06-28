import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource-variable/plus-jakarta-sans';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';

const APP_DESCRIPTION =
  'Stok akurat di semua channel, kasir, dan bukti packing untuk seller Indonesia.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Palka',
    template: '%s | Palka',
  },
  description: APP_DESCRIPTION,
  applicationName: 'Palka',
  appleWebApp: { title: 'Palka' },
  openGraph: {
    type: 'website',
    siteName: 'Palka',
    locale: 'id_ID',
    title: 'Palka',
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfcf8' },
    { media: '(prefers-color-scheme: dark)', color: '#14171d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn(GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
