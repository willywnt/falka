'use client';

import Link from 'next/link';

import type { ProductListItemDto } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

export function ProductsManagementTable({ products }: { products: ProductListItemDto[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No products match your filters</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Try adjusting search or create a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="text-right">Variants</TableHead>
            <TableHead className="text-right">Total stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="font-medium">{product.name}</div>
                <div className="text-muted-foreground font-mono text-xs">{product.slug}</div>
              </TableCell>
              <TableCell>{product.brand ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{product.variantCount}</TableCell>
              <TableCell className="text-right tabular-nums">{product.totalStock}</TableCell>
              <TableCell>
                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDateTime(product.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
