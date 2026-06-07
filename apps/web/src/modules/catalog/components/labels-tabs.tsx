'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BundleLabelStudio } from './bundle-label-studio';
import { LabelStudio } from './label-studio';

/**
 * Switches the label studio between products (variants) and bundles. Both encode
 * `barcode ?? sku` so the mobile scanner can add either to a sale / PO.
 */
export function LabelsTabs() {
  return (
    <Tabs defaultValue="products" className="gap-6">
      <TabsList className="print:hidden">
        <TabsTrigger value="products">Produk</TabsTrigger>
        <TabsTrigger value="bundles">Bundel</TabsTrigger>
      </TabsList>
      <TabsContent value="products">
        <LabelStudio />
      </TabsContent>
      <TabsContent value="bundles">
        <BundleLabelStudio />
      </TabsContent>
    </Tabs>
  );
}
