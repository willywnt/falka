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
        <CardTitle>No recordings yet</CardTitle>
        <CardDescription>
          Webcam recording will be available here. Start capturing operational workflows from your
          browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground text-sm">
          Recording engine, R2 upload, and lifecycle management coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
