'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MarketplaceProvider } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useCreateMarketplaceConnectionMutation } from '../hooks/use-marketplace-connections';
import {
  MARKETPLACE_PROVIDER_DESCRIPTIONS,
  getMarketplaceProviderLabel,
} from '../utils/provider-display';
import { SUPPORTED_MARKETPLACE_PROVIDERS } from '../utils/providers';
import {
  createMarketplaceConnectionFormSchema,
  type CreateMarketplaceConnectionFormInput,
} from '../validators/create-connection';

type AddMarketplaceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMarketplaceModal({ open, onOpenChange }: AddMarketplaceModalProps) {
  const createMutation = useCreateMarketplaceConnectionMutation();

  const form = useForm<CreateMarketplaceConnectionFormInput>({
    resolver: zodResolver(createMarketplaceConnectionFormSchema),
    defaultValues: {
      provider: MarketplaceProvider.SHOPEE,
      shopId: '',
      shopName: '',
      accessToken: '',
      refreshToken: '',
      expiresAt: null,
    },
  });

  const selectedProvider = form.watch('provider');

  async function onSubmit(values: CreateMarketplaceConnectionFormInput) {
    try {
      await createMutation.mutateAsync({
        ...values,
        refreshToken: values.refreshToken?.trim() || undefined,
      });
      toast.success('Toko marketplace terhubung', {
        description: `${values.shopName} siap untuk alur sinkron berikutnya.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menghubungkan', {
        description:
          error instanceof Error ? error.message : 'Tidak bisa menghubungkan toko marketplace.',
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) form.reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Hubungkan toko marketplace</DialogTitle>
          <DialogDescription>
            Untuk sekarang koneksi provider masih simulasi. Integrasi OAuth akan menggantikan input
            token manual nanti.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {SUPPORTED_MARKETPLACE_PROVIDERS.map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => field.onChange(provider)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          field.value === provider
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50',
                        )}
                      >
                        <span className="font-medium">{getMarketplaceProviderLabel(provider)}</span>
                      </button>
                    ))}
                  </div>
                  <FormDescription>
                    {MARKETPLACE_PROVIDER_DESCRIPTIONS[selectedProvider]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="shopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Toko</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama toko</FormLabel>
                    <FormControl>
                      <Input placeholder="Toko Shopee Saya" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Access token OAuth (simulasi)"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Dienkripsi sebelum disimpan. Tidak pernah dikirim balik ke browser.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refreshToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh token (opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Refresh token (simulasi)"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Masa berlaku token (opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date && !Number.isNaN(field.value.getTime())
                          ? field.value.toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value ? new Date(value) : null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menghubungkan...' : 'Hubungkan toko'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
