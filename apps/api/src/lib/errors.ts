// ─────────────────────────────────────────────────────────────────────────────
// Typed errors → uniform HTTP shape (build spec §9). Throw an ApiError anywhere;
// the central handler (registered in index.ts) maps it to { error, message,
// details? } with the right status. Unknown throws become 500 INTERNAL.
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'NO_ROUTE_FOUND'
  | 'STOP_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NO_ROUTE_FOUND: 404,
  STOP_NOT_FOUND: 404,
  RATE_LIMIT_EXCEEDED: 429,
  UNAUTHORIZED: 401,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  toBody() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

// Convenience constructors for the common cases.
export const notFound = (msg = 'Not found') => new ApiError('NOT_FOUND', msg);
export const noRoute = (suggestions: unknown[] = []) =>
  new ApiError('NO_ROUTE_FOUND', 'No route found between those stops.', { suggestions });
export const stopNotFound = (suggestions: unknown[] = []) =>
  new ApiError('STOP_NOT_FOUND', 'Stop not found.', { suggestions });
export const unauthorized = (msg = 'Unauthorized') => new ApiError('UNAUTHORIZED', msg);
export const validation = (details: { field: string; message: string }[]) =>
  new ApiError('VALIDATION_ERROR', 'Request validation failed.', details);
