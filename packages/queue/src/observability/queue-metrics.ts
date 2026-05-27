import { getRegisteredQueues } from '../queues/create-queue.js';
import { QUEUE_NAMES, type QueueName } from '../types/index.js';

export type QueueCountsSnapshot = {
  queueName: QueueName;
  waiting: number;
  active: number;
  failed: number;
  delayed: number;
  completed: number;
};

export async function getQueueObservabilitySnapshot(): Promise<QueueCountsSnapshot[]> {
  const registered = getRegisteredQueues();

  if (registered.length === 0) {
    const { createQueue } = await import('../queues/create-queue.js');
    for (const queueName of Object.values(QUEUE_NAMES)) {
      createQueue(queueName);
    }
  }

  const queues = getRegisteredQueues();

  return Promise.all(
    queues.map(async (queue) => {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'failed',
        'delayed',
        'completed',
      );

      return {
        queueName: queue.name as QueueName,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        completed: counts.completed ?? 0,
      };
    }),
  );
}

export async function getFailedJobsSummary(limit = 20) {
  const { createQueue } = await import('../queues/create-queue.js');
  const summaries = [];

  for (const queueName of Object.values(QUEUE_NAMES)) {
    const queue = createQueue(queueName);
    const failedJobs = await queue.getFailed(0, limit - 1);

    for (const job of failedJobs) {
      summaries.push({
        queueName,
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      });
    }
  }

  return summaries.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, limit);
}
