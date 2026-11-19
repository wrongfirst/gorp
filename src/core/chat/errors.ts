// src/core/chat/errors.ts
import { Data } from 'effect';

export class ChatConfigError extends Data.TaggedError('ChatConfigError')<{
  readonly message: string;
}> {}

export class ChatAuthError extends Data.TaggedError('ChatAuthError')<{
  readonly message: string;
  readonly status?: number;
}> {}

export class ChatNotFoundError extends Data.TaggedError('ChatNotFoundError')<{
  readonly message: string;
}> {}

export class ChatRateLimitError extends Data.TaggedError('ChatRateLimitError')<{
  readonly message: string;
  readonly retryAfterSeconds?: number;
}> {}

export class ChatInactivityTimeoutError extends Data.TaggedError('ChatInactivityTimeoutError')<{
  readonly message: string;
  readonly timeoutMs: number;
}> {}

export class ChatNetworkError extends Data.TaggedError('ChatNetworkError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatStreamParseError extends Data.TaggedError('ChatStreamParseError')<{
  readonly message: string;
}> {}

export class ChatParseError extends Data.TaggedError('ChatParseError')<{
  readonly message: string;
}> {}

export type ChatError =
  | ChatConfigError
  | ChatAuthError
  | ChatNotFoundError
  | ChatRateLimitError
  | ChatInactivityTimeoutError
  | ChatNetworkError
  | ChatStreamParseError
  | ChatParseError;
