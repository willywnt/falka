/**
 * Base class for every domain/application error that maps to an HTTP response.
 *
 * The shared API error handler maps any `DomainError` generically from its
 * `code` + `statusCode`, so feature modules can define their own error types
 * (RecordingError, PairingError, …) without the shared layer having to import
 * them. Subclasses MUST pass their code/statusCode through `super(...)` and,
 * because `useDefineForClassFields` is enabled (target ES2022), narrow `code`
 * with `declare readonly code` rather than a real field — a real field would
 * re-initialize to `undefined` after `super()` runs.
 */
export class DomainError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
