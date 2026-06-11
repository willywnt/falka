'use client';

import { ErrorScreen } from '@/components/error-screen';

// Page-level failures keep the sidebar/navbar frame alive; only the content
// area shows the suar screen.
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen reset={reset} />;
}
