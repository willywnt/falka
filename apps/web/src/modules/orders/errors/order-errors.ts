import { DomainError } from '@/lib/errors';

export const ORDER_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type OrderErrorCode = (typeof ORDER_ERROR_CODES)[keyof typeof ORDER_ERROR_CODES];

export class OrderError extends DomainError {
  declare readonly code: OrderErrorCode;

  constructor(code: OrderErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'OrderError';
  }

  static validation(message: string) {
    return new OrderError(ORDER_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Order not found.') {
    return new OrderError(ORDER_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
