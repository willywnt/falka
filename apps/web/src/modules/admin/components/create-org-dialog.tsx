'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { NumberInput } from '@/components/ui/number-input';

import { useCreateOrgMutation } from '../hooks/use-admin-orgs';

/**
 * Flat form shape for RHF — memberLimit 0 means "unlimited" (mapped to null on
 * submit), so the operator never has to clear the field.
 */
const formSchema = z.object({
  orgName: z.string().trim().min(1, 'Nama organisasi wajib diisi').max(100),
  plan: z.string().trim().min(1, 'Plan wajib diisi').max(50),
  memberLimit: z.number().int().nonnegative(),
  ownerEmail: z.string().trim().email('Email pemilik tidak valid').max(255),
  ownerDisplayName: z.string().trim().max(100),
  ownerPassword: z.string().min(8, 'Password minimal 8 karakter').max(128),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  orgName: '',
  plan: 'FREE',
  memberLimit: 0,
  ownerEmail: '',
  ownerDisplayName: '',
  ownerPassword: '',
};

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const createOrg = useCreateOrgMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: FormValues) {
    try {
      await createOrg.mutateAsync({
        orgName: values.orgName,
        plan: values.plan,
        memberLimit: values.memberLimit > 0 ? values.memberLimit : null,
        owner: {
          email: values.ownerEmail,
          displayName: values.ownerDisplayName.trim() || undefined,
          password: values.ownerPassword,
        },
      });
      toast.success('Organisasi dibuat', {
        description: `Akun pemilik: ${values.ownerEmail}. Bagikan password-nya secara manual, ya.`,
      });
      form.reset(DEFAULT_VALUES);
      setOpen(false);
    } catch (error) {
      toast.error('Gagal membuat organisasi', {
        description: error instanceof Error ? error.message : 'Ada yang error, coba lagi.',
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(DEFAULT_VALUES);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Buat organisasi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Buat organisasi baru
          </DialogTitle>
          <DialogDescription>
            Sekalian buat akun pemiliknya. Kamu yang menentukan password awalnya — bagikan ke
            pemilik secara manual.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nama organisasi</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Toko Maju Jaya" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Plan</FormLabel>
                    <FormControl>
                      <Input placeholder="FREE" maxLength={50} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memberLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batas anggota</FormLabel>
                    <FormControl>
                      <NumberInput min={0} step={1} {...field} />
                    </FormControl>
                    <FormDescription>0 = tanpa batas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <p className="eyebrow text-muted-foreground mb-3">Akun pemilik</p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Email pemilik</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="pemilik@toko.com"
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
                  name="ownerDisplayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama pemilik</FormLabel>
                      <FormControl>
                        <Input placeholder="opsional" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Password awal</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="minimal 8 karakter"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pemilik tidak menerima email — bagikan password ini secara manual.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createOrg.isPending}>
                {createOrg.isPending ? 'Membuat…' : 'Buat organisasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
