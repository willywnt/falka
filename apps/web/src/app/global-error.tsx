'use client';

import { ErrorScreen } from '@/components/error-screen';

import '@/styles/globals.css';

// Replaces the root layout when even it fails — must render its own shell.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ErrorScreen withBrand reset={reset} />
      </body>
    </html>
  );
}
