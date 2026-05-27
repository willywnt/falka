import { apiSuccess, handleApiError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import {
  getFailedUploadsReport,
  getOperationalMetricsReport,
  getOrphanRecordingsReport,
  getStuckJobsReport,
  getStorageMismatchReport,
} from '@/modules/admin/services/ops.service';

export const GET = withApiRoute(
  async () => {
    try {
      const [failedUploads, orphanRecordings, stuckJobs, storageMismatch, operational] =
        await Promise.all([
          getFailedUploadsReport(),
          getOrphanRecordingsReport(),
          getStuckJobsReport(),
          getStorageMismatchReport(),
          getOperationalMetricsReport(),
        ]);

      return apiSuccess({
        failedUploads,
        orphanRecordings,
        stuckJobs,
        storageMismatch,
        operational,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { requireAdmin: true },
);
