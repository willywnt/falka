'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { reportingKeys } from './reporting-keys';
import type { ProfitPeriodGranularity, ProfitReport } from '../types';

export type ProfitReportParams = {
  from?: string;
  to?: string;
  groupBy: ProfitPeriodGranularity;
};

function toQueryParams(params: ProfitReportParams): Record<string, string> {
  return {
    groupBy: params.groupBy,
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
  };
}

export function useProfitReportQuery(params: ProfitReportParams) {
  const queryParams = toQueryParams(params);

  return useQuery({
    queryKey: reportingKeys.profit(queryParams),
    queryFn: async () => {
      const result = await apiFetch<ProfitReport>(`${apiRoutes.reports}/profit`, {
        params: queryParams,
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
  });
}

/** URL for the per-SKU CSV export, for a plain download link. */
export function profitExportUrl(params: ProfitReportParams): string {
  const search = new URLSearchParams(toQueryParams(params));
  return `${apiRoutes.reports}/profit/export?${search.toString()}`;
}
