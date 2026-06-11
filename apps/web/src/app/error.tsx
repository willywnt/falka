'use client';

import { ErrorScreen } from '@/components/error-screen';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-background min-h-screen">
      <ErrorScreen withBrand reset={reset} />
    </main>
  );
}
