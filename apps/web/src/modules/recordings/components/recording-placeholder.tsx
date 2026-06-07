'use client';

import { Video } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RecordingPlaceholder() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
          <Video className="text-muted-foreground size-6" />
        </div>
        <CardTitle>Belum ada rekaman</CardTitle>
        <CardDescription>
          Rekaman webcam akan muncul di sini. Mulai rekam alur operasional langsung dari browser
          kamu.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground text-sm">
          Mesin rekam, unggah R2, dan manajemen siklus hidup segera hadir.
        </p>
      </CardContent>
    </Card>
  );
}
