import type { Job } from 'bullmq';
import { METRIC_KEYS, incrementMetric } from '@palka/metrics';
import {
  extendCorrelationContext,
  logEvents,
  logger,
  runWithRequestId,
} from '@palka/logger/server';
import { sanitizeForLogging } from '@palka/logger/sanitize';

import type { JobResultMetadata } from '../types/index.js';

type JobLogContext = {
  queueName: string;
  jobName: string;
  jobId: string | undefined;
  attemptsMade: number;
  requestId?: string;
};

function getJobContext(job: Job): JobLogContext {
  const payload = job.data as { requestId?: string } | undefined;

  return {
    queueName: job.queueName,
    jobName: job.name,
    jobId: job.id,
    attemptsMade: job.attemptsMade,
    requestId: payload?.requestId,
  };
}

export async function runJobWithLogging<TPayload, TResult extends JobResultMetadata>(
  job: Job<TPayload>,
  handler: (payload: TPayload) => Promise<TResult>,
): Promise<TResult> {
  const context = getJobContext(job);
  const startedAt = Date.now();
  const requestId = context.requestId ?? `job-${job.id ?? 'unknown'}`;

  return runWithRequestId(requestId, async () => {
    extendCorrelationContext({
      requestId,
      jobId: context.jobId,
      queueName: context.queueName,
    });

    logEvents.jobStarted({
      ...context,
      payload: sanitizeForLogging(job.data),
    });

    try {
      const result = await handler(job.data);
      const durationMs = Date.now() - startedAt;

      logEvents.jobCompleted({
        ...context,
        durationMs,
        result: sanitizeForLogging(result),
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);
      const willRetry = job.attemptsMade < (job.opts.attempts ?? 1);

      logEvents.jobFailed({
        ...context,
        durationMs,
        error: message,
        willRetry,
      });

      await incrementMetric(METRIC_KEYS.JOBS_FAILED, 1);
      if (willRetry) {
        await incrementMetric(METRIC_KEYS.JOBS_RETRIED, 1);
      }

      throw error;
    }
  });
}

export function logPermanentJobFailure(job: Job, error: Error): void {
  logger.error('job.dead_letter', {
    queueName: job.queueName,
    jobName: job.name,
    jobId: job.id,
    attemptsMade: job.attemptsMade,
    failedReason: error.message,
    payload: sanitizeForLogging(job.data),
    failedAt: new Date().toISOString(),
  });
}
