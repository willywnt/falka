import type { Metadata } from 'next';
import { APP_NAME } from '@palka/config/constants';
import { PackageCheck, ShieldAlert } from 'lucide-react';

import { recordingShareService } from '@/modules/recordings/services/recording-share.service';
import { BrandBadge } from '@/components/brand-mark';
import { formatDateTime, formatDuration } from '@/lib/formatters';

// Always render per-request: each view validates the token, mints a fresh
// short-lived presigned URL, and records the view. Never statically cached.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Video packing',
  robots: { index: false, follow: false },
  // Chat-preview framing only — the og image is deliberately data-free so no
  // resi/order detail ever leaks into a link unfurl.
  openGraph: {
    title: 'Bukti packing — Palka',
    description: 'Video packing pesanan, dibagikan sebagai bukti sengketa.',
  },
};

type Params = { token: string };

export default async function SharedRecordingPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const view = await recordingShareService.resolvePublicShareLink(token);

  return (
    <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <BrandBadge />
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        {view ? (
          <div className="bg-card text-card-foreground overflow-hidden rounded-lg border">
            <div className="border-b p-4">
              <div className="text-primary flex items-center gap-2 text-sm font-medium">
                <PackageCheck className="size-4" />
                Bukti packing
              </div>
              <h1 className="mt-1 text-lg font-semibold">No. resi {view.noResi}</h1>
              <p className="text-muted-foreground text-sm">
                Video packing terekam, durasi {formatDuration(view.durationSeconds)}.
              </p>
            </div>

            <video
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              src={view.playbackUrl}
            >
              <source src={view.playbackUrl} type={view.mimeType} />
              Browser kamu tidak bisa memutar video ini.
            </video>

            <div className="text-muted-foreground border-t p-4 text-xs">
              Tautan ini berlaku sampai {formatDateTime(view.expiresAt)}. Dibagikan sebagai bukti
              sengketa — tolong jangan disebar ke umum.
            </div>
          </div>
        ) : (
          <div className="bg-card text-card-foreground rounded-lg border p-8 text-center">
            <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="mt-4 text-lg font-semibold">Tautan tidak tersedia</h1>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Tautan video packing ini tidak valid, sudah kedaluwarsa, atau dicabut. Minta tautan
              baru ke penjual.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
