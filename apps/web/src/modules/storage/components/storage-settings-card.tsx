'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { StorageQuotaIndicator } from './storage-quota-indicator';

export function StorageSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penyimpanan</CardTitle>
        <CardDescription>Kuota dan pemakaian Cloudflare R2 untuk akun kamu</CardDescription>
      </CardHeader>
      <CardContent>
        <StorageQuotaIndicator showIcon={false} />
      </CardContent>
    </Card>
  );
}
