import { AsyncLocalStorage } from 'node:async_hooks';

export { generateRequestId, REQUEST_ID_HEADER, resolveRequestId } from './correlation-id.js';

export type CorrelationContext = {
  requestId: string;
  userId?: string;
  jobId?: string;
  queueName?: string;
};

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

export function getRequestId(): string | undefined {
  return correlationStorage.getStore()?.requestId;
}

export function runWithCorrelationContext<T>(context: CorrelationContext, fn: () => T): T {
  return correlationStorage.run(context, fn);
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return correlationStorage.run({ requestId }, fn);
}

export function extendCorrelationContext(partial: Partial<CorrelationContext>): void {
  const current = correlationStorage.getStore();
  if (!current) return;

  Object.assign(current, partial);
}
