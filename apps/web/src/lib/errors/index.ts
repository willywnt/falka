export { DomainError } from './domain-error';
export { AppError, type AppErrorCode } from './app-error';
import { AppError } from './app-error';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
