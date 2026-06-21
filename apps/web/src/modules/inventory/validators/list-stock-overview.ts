import { z } from 'zod';

/** The drill-down buckets a shop owner filters the stock list by (mirrors the dashboard KPIs). */
export const STOCK_OVERVIEW_STATUSES = ['low', 'out', 'oversold', 'incoming', 'damaged'] as const;
export type StockOverviewStatus = (typeof STOCK_OVERVIEW_STATUSES)[number];

export const listStockOverviewQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(STOCK_OVERVIEW_STATUSES).optional(),
});

export type ListStockOverviewQuery = z.infer<typeof listStockOverviewQuerySchema>;
