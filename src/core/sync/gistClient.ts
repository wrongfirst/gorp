// src/core/sync/gistClient.ts
import { Effect, Schedule } from 'effect';
import { SITE_TITLE, SITE_SLUG } from '../siteConfig';
import {
  GistAuthError,
  GistNotFoundError,
  GistRateLimitError,
  GistNetworkError,
  GistTimeoutError,
  OAuthExchangeError,
  GistParseError,
  GistHttpError,
  GistError,
} from './errors';

export const GIST_DEFAULT_DESCRIPTION = `${SITE_TITLE} Progress & Settings Backup`;

export interface TokenValidationResult {
  valid: boolean;
  username?: string;
  scopes?: string[];
  error?: string;
}

export interface GistFileEntry {
  filename: string;
  content?: string;
  truncated?: boolean;
  raw_url?: string;
  size?: number;
}

export interface GistActionResult {
  gistId?: string;
  htmlUrl?: string;
  files?: Record<string, GistFileEntry>;
  updatedAt?: string;
  notModified?: boolean;
}

export interface DiscoveredGist {
  gistId: string;
  htmlUrl?: string;
  updatedAt?: string;
  description?: string;
  filenames: string[];
}

/**
 * Extracts a bare Gist ID from a raw ID or full GitHub Gist URL.
 */
export function extractGistId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Remove fragment (#...) and query parameters (?...)
  const withoutParams = trimmed.split(/[?#]/)[0];

  // If it's a URL, grab the last path segment
  const match =
    withoutParams.match(/(?:gists?\.github\.com\/[^\/]+\/|^)([a-f0-9]+)\/?$/i) ||
    withoutParams.match(/([a-f0-9]{20,32})/i);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback: extract last alphanumeric token after slash
  const segments = withoutParams.split('/').filter(Boolean);
  return segments[segments.length - 1] || trimmed;
}

/**
 * Helper to build GitHub REST API request headers.
 */
function getHeaders(token?: string, ifModifiedSince?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token && token.trim() && !token.startsWith('enc:v1:')) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  if (ifModifiedSince) {
    headers['If-Modified-Since'] = ifModifiedSince;
  }
  return headers;
}

/**
 * Parses HTTP error response from GitHub into typed TaggedErrors.
 */
function parseResponseError(
  res: Response
): Effect.Effect<never, GistAuthError | GistNotFoundError | GistRateLimitError | GistNetworkError | GistHttpError> {
  return Effect.gen(function* () {
    let errorMsg = '';
    try {
      const data = yield* Effect.promise(() => res.json().catch(() => null));
      if (data && typeof data === 'object' && 'message' in data) {
        errorMsg = String((data as any).message);
      }
    } catch {
      // non-JSON fallback
    }

    if (res.status === 401) {
      return yield* Effect.fail(
        new GistAuthError({
          message: errorMsg || 'Bad credentials or expired GitHub token.',
          status: 401,
        })
      );
    }

    if (res.status === 404) {
      return yield* Effect.fail(
        new GistNotFoundError({
          message: errorMsg || 'Gist not found. Check the Gist ID.',
        })
      );
    }

    if (res.status === 403) {
      const isRateLimit =
        errorMsg.toLowerCase().includes('rate limit') ||
        res.headers.get('x-ratelimit-remaining') === '0';
      if (isRateLimit) {
        const retryAfter = res.headers.get('retry-after');
        return yield* Effect.fail(
          new GistRateLimitError({
            message: 'GitHub API rate limit exceeded. Please try again later.',
            retryAfterSeconds: retryAfter ? parseInt(retryAfter, 10) : undefined,
          })
        );
      }
      return yield* Effect.fail(
        new GistAuthError({
          message: errorMsg ? `Access forbidden: ${errorMsg}` : 'Access forbidden (HTTP 403).',
          status: 403,
        })
      );
    }

    if (res.status >= 500) {
      return yield* Effect.fail(
        new GistNetworkError({
          message: errorMsg || `GitHub server error (HTTP ${res.status}: ${res.statusText})`,
        })
      );
    }

    return yield* Effect.fail(
      new GistHttpError({
        message: errorMsg || `GitHub API error (HTTP ${res.status}: ${res.statusText})`,
        status: res.status,
      })
    );
  });
}

/**
 * Exponential backoff schedule for transient network glitches (retries twice).
 */
const transientRetrySchedule = Schedule.exponential('500 millis').pipe(
  Schedule.compose(Schedule.recurs(2))
);

function withTransientRetry<A, E extends GistError, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, GistError, R> {
  return effect.pipe(
    Effect.retry({
      schedule: transientRetrySchedule,
      while: (err) => err._tag === 'GistNetworkError',
    })
  );
}

/**
 * Validates a GitHub Personal Access Token against the GitHub API.
 */
export function validateToken(
  token: string
): Effect.Effect<TokenValidationResult, GistError> {
  if (!token || !token.trim() || token.startsWith('enc:v1:')) {
    return Effect.fail(
      new GistAuthError({
        message: 'Token cannot be empty or un-decrypted.',
      })
    );
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch('https://api.github.com/user', {
          method: 'GET',
          headers: getHeaders(token),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    if (!res.ok) {
      return yield* parseResponseError(res);
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new GistParseError({
          message: 'Failed to parse GitHub user response as JSON.',
        }),
    });

    const scopesHeader = res.headers.get('x-oauth-scopes');
    const scopes = scopesHeader ? scopesHeader.split(',').map((s) => s.trim()) : undefined;

    return {
      valid: true,
      username: data.login || 'GitHub User',
      scopes,
    };
  }).pipe(
    Effect.timeout('12 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'Token validation timed out after 12s.',
          timeoutMs: 12000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}

/**
 * Creates a new secret Gist with the provided multi-file payload.
 */
export function createGist(
  token: string,
  files: Record<string, string>,
  description = GIST_DEFAULT_DESCRIPTION
): Effect.Effect<GistActionResult, GistError> {
  if (!token || !token.trim() || token.startsWith('enc:v1:')) {
    return Effect.fail(
      new GistAuthError({
        message: 'GitHub token is required to create a Gist.',
      })
    );
  }

  const filesPayload: Record<string, { content: string }> = {};
  for (const [filename, content] of Object.entries(files)) {
    filesPayload[filename] = { content };
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description,
            public: false, // Secret / unlisted gist
            files: filesPayload,
          }),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    if (!res.ok) {
      return yield* parseResponseError(res);
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new GistParseError({
          message: 'Failed to parse Gist creation response as JSON.',
        }),
    });

    return {
      gistId: data.id,
      htmlUrl: data.html_url,
      updatedAt: data.updated_at,
    };
  }).pipe(
    Effect.timeout('15 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'Gist creation timed out after 15s.',
          timeoutMs: 15000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}

/**
 * Fetches all files and contents from an existing Gist.
 * Supports conditional fetching via options.ifModifiedSince (returns notModified: true on HTTP 304).
 */
export function fetchGist(
  gistId: string,
  token?: string,
  options?: { ifModifiedSince?: string }
): Effect.Effect<GistActionResult, GistError> {
  const cleanId = extractGistId(gistId);
  if (!cleanId) {
    return Effect.fail(
      new GistNotFoundError({
        message: 'Invalid Gist ID provided.',
        gistId,
      })
    );
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(`https://api.github.com/gists/${cleanId}`, {
          method: 'GET',
          headers: getHeaders(token, options?.ifModifiedSince),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    if (res.status === 304) {
      return {
        notModified: true,
        gistId: cleanId,
      };
    }

    if (!res.ok) {
      return yield* parseResponseError(res);
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new GistParseError({
          message: 'Failed to parse Gist fetch response as JSON.',
        }),
    });

    const rawFiles = data.files || {};
    const entries = Object.entries<any>(rawFiles);

    // Fetch truncated raw files with bounded concurrency (pure aggregation)
    const parsedEntries = yield* Effect.forEach(
      entries,
      ([filename, fileObj]) =>
        Effect.gen(function* () {
          let content = fileObj.content;
          if (fileObj.truncated && fileObj.raw_url) {
            const rawRes = yield* Effect.tryPromise({
              try: (signal) =>
                fetch(fileObj.raw_url, {
                  headers:
                    token && !token.startsWith('enc:v1:') ? { Authorization: `Bearer ${token.trim()}` } : {},
                  signal,
                }),
              catch: () => null,
            }).pipe(Effect.catchAll(() => Effect.succeed(null)));

            if (rawRes && rawRes.ok) {
              content = yield* Effect.tryPromise(() => rawRes.text()).pipe(
                Effect.catchAll(() => Effect.succeed(fileObj.content))
              );
            }
          }

          const entry: GistFileEntry = {
            filename,
            content,
            truncated: fileObj.truncated,
            raw_url: fileObj.raw_url,
            size: fileObj.size,
          };
          return [filename, entry] as const;
        }),
      { concurrency: 4 }
    );

    const parsedFiles = Object.fromEntries(parsedEntries);

    return {
      gistId: data.id,
      htmlUrl: data.html_url,
      files: parsedFiles,
      updatedAt: data.updated_at,
    };
  }).pipe(
    Effect.timeout('15 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'Gist fetch timed out after 15s.',
          timeoutMs: 15000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}

/**
 * Updates an existing Gist with new multi-file contents.
 * Passing null for a filename in `files` removes that file from the Gist.
 */
export function updateGist(
  gistId: string,
  token: string,
  files: Record<string, string | null>,
  description = GIST_DEFAULT_DESCRIPTION
): Effect.Effect<GistActionResult, GistError> {
  const cleanId = extractGistId(gistId);
  if (!cleanId) {
    return Effect.fail(
      new GistNotFoundError({
        message: 'Invalid Gist ID provided.',
        gistId,
      })
    );
  }
  if (!token || !token.trim() || token.startsWith('enc:v1:')) {
    return Effect.fail(
      new GistAuthError({
        message: 'GitHub token is required to update a Gist.',
      })
    );
  }

  const filesPayload: Record<string, { content: string } | null> = {};
  for (const [filename, content] of Object.entries(files)) {
    filesPayload[filename] = content === null ? null : { content };
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(`https://api.github.com/gists/${cleanId}`, {
          method: 'PATCH',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description,
            files: filesPayload,
          }),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    if (!res.ok) {
      return yield* parseResponseError(res);
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new GistParseError({
          message: 'Failed to parse Gist update response as JSON.',
        }),
    });

    return {
      gistId: data.id,
      htmlUrl: data.html_url,
      updatedAt: data.updated_at,
    };
  }).pipe(
    Effect.timeout('15 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'Gist update timed out after 15s.',
          timeoutMs: 15000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}

/**
 * Exchanges a temporary OAuth authorization code with the Cloudflare Worker proxy for a GitHub access_token.
 */
export function exchangeOAuthCode(
  workerUrl: string,
  code: string
): Effect.Effect<string, GistError> {
  if (!workerUrl || !workerUrl.trim()) {
    return Effect.fail(
      new OAuthExchangeError({
        message: 'OAuth worker URL is not configured.',
      })
    );
  }
  if (!code || !code.trim()) {
    return Effect.fail(
      new OAuthExchangeError({
        message: 'OAuth code is required.',
      })
    );
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(workerUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ code: code.trim() }),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new OAuthExchangeError({
          message: `HTTP ${res.status}: Failed to parse authorization response as JSON.`,
          status: res.status,
        }),
    });

    if (!res.ok || data.error) {
      return yield* Effect.fail(
        new OAuthExchangeError({
          message: data.error_description || data.error || `HTTP ${res.status}: Failed to exchange code.`,
          status: res.status,
        })
      );
    }

    if (data.access_token) {
      return String(data.access_token);
    }

    return yield* Effect.fail(
      new OAuthExchangeError({
        message: 'No access token received from authorization server.',
        status: res.status,
      })
    );
  }).pipe(
    Effect.timeout('15 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'OAuth code exchange timed out after 15s.',
          timeoutMs: 15000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}

/**
 * Searches the authenticated user's Gists to automatically locate an existing backup for this site instance.
 */
export function findSiteGist(
  token: string
): Effect.Effect<DiscoveredGist | undefined, GistError> {
  if (!token || !token.trim() || token.startsWith('enc:v1:')) {
    return Effect.fail(
      new GistAuthError({
        message: 'GitHub token is required.',
      })
    );
  }

  const pipeline = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch('https://api.github.com/gists?per_page=100', {
          method: 'GET',
          headers: getHeaders(token),
          signal,
        }),
      catch: (cause) =>
        new GistNetworkError({
          message: cause instanceof Error ? cause.message : 'Network request failed.',
          cause,
        }),
    });

    if (!res.ok) {
      return yield* parseResponseError(res);
    }

    const gists = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new GistParseError({
          message: 'Failed to parse Gist list response as JSON.',
        }),
    });

    if (!Array.isArray(gists)) {
      return undefined;
    }

    const targetMetadataFilename = `_${SITE_SLUG}.json`;

    // 1. Primary check: Gist contains this site's exact metadata signature file
    for (const g of gists) {
      const files = g.files || {};
      if (files[targetMetadataFilename]) {
        return {
          gistId: g.id,
          htmlUrl: g.html_url,
          updatedAt: g.updated_at,
          description: g.description,
          filenames: Object.keys(files),
        };
      }
    }

    // 2. Secondary check: exact description match AND no conflicting _foreign-slug.json file
    for (const g of gists) {
      if (g.description === GIST_DEFAULT_DESCRIPTION) {
        const files = g.files || {};
        const foreignMetaFile = Object.keys(files).find(
          (fn) => fn.startsWith('_') && fn.endsWith('.json') && fn !== targetMetadataFilename
        );
        if (!foreignMetaFile) {
          return {
            gistId: g.id,
            htmlUrl: g.html_url,
            updatedAt: g.updated_at,
            description: g.description,
            filenames: Object.keys(files),
          };
        }
      }
    }

    return undefined;
  }).pipe(
    Effect.timeout('15 seconds'),
    Effect.catchTag('TimeoutException', () =>
      Effect.fail(
        new GistTimeoutError({
          message: 'Gist discovery timed out after 15s.',
          timeoutMs: 15000,
        })
      )
    )
  );

  return withTransientRetry(pipeline);
}
