// src/core/sync/errors.ts
import { Data } from 'effect';

export class GistAuthError extends Data.TaggedError('GistAuthError')<{
  readonly message: string;
  readonly status?: number;
}> {}

export class GistNotFoundError extends Data.TaggedError('GistNotFoundError')<{
  readonly message: string;
  readonly gistId?: string;
}> {}

export class GistRateLimitError extends Data.TaggedError('GistRateLimitError')<{
  readonly message: string;
  readonly retryAfterSeconds?: number;
}> {}

export class GistConflictError extends Data.TaggedError('GistConflictError')<{
  readonly message: string;
}> {}

export class GistSiteMismatchError extends Data.TaggedError('GistSiteMismatchError')<{
  readonly message: string;
  readonly foreignSlug: string;
  readonly currentSlug: string;
}> {}

export class GistNetworkError extends Data.TaggedError('GistNetworkError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GistTimeoutError extends Data.TaggedError('GistTimeoutError')<{
  readonly message: string;
  readonly timeoutMs?: number;
}> {}

export class OAuthExchangeError extends Data.TaggedError('OAuthExchangeError')<{
  readonly message: string;
  readonly status?: number;
}> {}

export class GistParseError extends Data.TaggedError('GistParseError')<{
  readonly message: string;
}> {}

export class GistHttpError extends Data.TaggedError('GistHttpError')<{
  readonly message: string;
  readonly status: number;
}> {}

export type GistError =
  | GistAuthError
  | GistNotFoundError
  | GistRateLimitError
  | GistConflictError
  | GistSiteMismatchError
  | GistNetworkError
  | GistTimeoutError
  | OAuthExchangeError
  | GistParseError
  | GistHttpError;
