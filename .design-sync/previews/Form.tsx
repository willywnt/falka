import * as React from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
} from '@falka/web';

type ProductForm = {
  nama: string;
  harga: string;
};

export function ProductFields() {
  const form = useForm<ProductForm>({
    defaultValues: { nama: 'Kaos Polos Premium', harga: '85000' },
  });
  return (
    <Form {...form}>
      <form style={{ display: 'grid', gap: 16, width: 320 }}>
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nama produk</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nama produk" />
              </FormControl>
              <FormDescription>Tampil di katalog dan struk kasir.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="harga"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Harga jual</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" placeholder="0" />
              </FormControl>
              <FormDescription>Harga sebelum diskon, dalam rupiah.</FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function WithError() {
  const form = useForm<{ sku: string }>({
    defaultValues: { sku: '' },
  });
  React.useEffect(() => {
    form.setError('sku', { type: 'manual', message: 'SKU sudah dipakai varian lain.' });
  }, [form]);
  return (
    <Form {...form}>
      <form style={{ display: 'grid', gap: 16, width: 320 }}>
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>SKU varian</FormLabel>
              <FormControl>
                <Input {...field} placeholder="KAOS-PLN-HTM-L" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
