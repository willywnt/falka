import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StorageSettingsCard } from '@/modules/storage/components/storage-settings-card';

export const metadata: Metadata = {
  title: 'Pengaturan',
};

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Kelola akun dan preferensi organisasi kamu."
      />

      <Tabs defaultValue="general" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="storage">Penyimpanan</TabsTrigger>
          <TabsTrigger value="team">Tim</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Umum</CardTitle>
              <CardDescription>Pengaturan organisasi dan profil</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Preferensi profil dan organisasi segera hadir.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storage">
          <StorageSettingsCard />
        </TabsContent>
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Tim</CardTitle>
              <CardDescription>Kelola pengguna dan peran</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Manajemen pengguna segera hadir.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
