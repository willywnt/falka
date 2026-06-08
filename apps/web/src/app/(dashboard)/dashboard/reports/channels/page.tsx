import { redirect } from 'next/navigation';

/**
 * The channel report was merged into the Laba & channel page as a tab. Keep this
 * route alive (old links/bookmarks) by redirecting to the Channel tab.
 */
export default function ChannelPerformanceReportPage() {
  redirect('/dashboard/reports/profit?tab=channel');
}
