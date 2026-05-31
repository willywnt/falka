import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Mobile Scanner',
  description: 'Connect to the recording station and scan logistics barcodes.',
};

export default function MobileScannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <Suspense fallback={<div className="text-muted-foreground p-6 text-sm">Loading…</div>}>
        {children}
      </Suspense>
      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}
