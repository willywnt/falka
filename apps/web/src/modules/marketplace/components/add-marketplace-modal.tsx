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
      toast.success('Marketplace connected', {
        description: `${values.shopName} is ready for future sync workflows.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Connection failed', {
        description: error instanceof Error ? error.message : 'Unable to connect marketplace store.',
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
          <DialogTitle>Connect marketplace store</DialogTitle>
          <DialogDescription>
            Simulate a provider connection for now. OAuth integration will replace manual token entry
            later.
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
                    <FormLabel>Shop ID</FormLabel>
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
                    <FormLabel>Shop name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Shopee Store" autoComplete="off" {...field} />
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
                      placeholder="Simulated OAuth access token"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Encrypted before storage. Never sent back to the browser.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refreshToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh token (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Simulated refresh token"
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
                  <FormLabel>Token expiry (optional)</FormLabel>
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
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Connecting...' : 'Connect store'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
