import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Olshop',
    template: '%s | Olshop',
  },
  description: 'Operational recording and marketplace integration platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
