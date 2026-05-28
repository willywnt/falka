'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { StorageQuotaIndicator } from './storage-quota-indicator';

export function StorageSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>Cloudflare R2 quota and usage for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <StorageQuotaIndicator showIcon={false} />
      </CardContent>
    </Card>
  );
}
