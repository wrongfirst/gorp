// src/core/chat/client.ts
import { Effect, Stream, Option, Duration } from 'effect';
import { store } from '../store';
import { buildSystemPrompt, formatUserPromptWithContext } from './context';
import { decryptSecret } from '../crypto';
import {
  ChatAuthError,
  ChatConfigError,
  ChatError,
  ChatInactivityTimeoutError,
  ChatNetworkError,
  ChatNotFoundError,
  ChatRateLimitError,
  ChatStreamParseError,
  ChatParseError,
} from './errors';

export type StreamStatus = 'connecting' | 'thinking';

export interface StreamOptions {
  userPrompt: string;
  conversationId?: string;
  onStatus?: (status: StreamStatus) => void;
  timeoutDuration?: Duration.DurationInput;
}

/**
 * Sends a streaming chat completion request to the configured OpenAI-compatible endpoint.
 * Ingests rich context from the active exercise and streams response token chunks back in real-time.
 * Enforces inactivity watchdog timeouts via Effect Stream to prevent token runaway and hangs.
 */
export function streamCompletion(options: StreamOptions): Stream.Stream<string, ChatError> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const { userPrompt, conversationId, onStatus } = options;
      const timeoutDuration = options.timeoutDuration ?? '120 seconds';
      const state = store.getState();
      const settings = state.chatSettings;
      const { activeLessonSlug } = state;

      if (!settings?.enabled) {
        return yield* Effect.fail(
          new ChatConfigError({
            message: 'Rubber Duck is currently disabled. Please enable it in Settings.',
          })
        );
      }

      if (!settings.baseUrl) {
        return yield* Effect.fail(
          new ChatConfigError({
            message: 'API Base URL is not configured. Please set it in Settings.',
          })
        );
      }

      const model = settings.model;
      if (!model) {
        return yield* Effect.fail(
          new ChatConfigError({
            message: 'No model selected. Please select a model in Settings.',
          })
        );
      }

      const endpoint = getChatCompletionsUrl(settings.baseUrl);
      const { systemPrompt } = buildSystemPrompt();

      // Retrieve past messages for the active conversation of this exercise
      const convId = conversationId || state.activeConversationId[activeLessonSlug];
      const convs = state.chatConversations[activeLessonSlug] || [];
      const activeConv = convs.find((c) => c.id === convId) || convs[0];
      const history = (activeConv?.messages || [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      // Check if the current user prompt is already recorded in history
      const lastMsg = history[history.length - 1];
      const isAlreadyInHistory =
        lastMsg && lastMsg.role === 'user' && lastMsg.content === userPrompt;

      const enrichedUserPrompt = formatUserPromptWithContext(userPrompt);
      const outgoingHistory = [...history];
      if (isAlreadyInHistory) {
        outgoingHistory[outgoingHistory.length - 1] = {
          role: 'user',
          content: enrichedUserPrompt,
        };
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...outgoingHistory,
        ...(isAlreadyInHistory ? [] : [{ role: 'user', content: enrichedUserPrompt }]),
      ];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const rawKey = settings.apiKey || '';
      const resolvedKey = (
        yield* Effect.tryPromise({
          try: () => decryptSecret(rawKey),
          catch: () => new ChatConfigError({ message: 'Failed to decrypt API key' }),
        })
      ).trim();

      if (resolvedKey) {
        headers['Authorization'] = `Bearer ${resolvedKey}`;
      }

      if (settings.baseUrl.includes('anthropic.com')) {
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      }

      onStatus?.('connecting');

      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages,
              stream: true,
              temperature: 0.7,
              max_tokens: 10000,
            }),
            signal,
          }),
        catch: (cause) =>
          new ChatNetworkError({
            message: 'Network connection failed during chat completion',
            cause,
          }),
      }).pipe(
        Effect.timeout('30 seconds'),
        Effect.catchTag('TimeoutException', () =>
          Effect.fail(
            new ChatInactivityTimeoutError({
              message: 'Connection timed out after 30s. The AI endpoint failed to respond.',
              timeoutMs: 30000,
            })
          )
        )
      );

      if (!response.ok) {
        const errorText = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: () => Promise.resolve(''),
        }).pipe(Effect.catchAll(() => Effect.succeed('')));

        let errorMessage = `HTTP ${response.status} (${response.statusText})`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        } catch {
          if (errorText) {
            errorMessage = errorText.slice(0, 120);
          }
        }

        if (response.status === 401) {
          return yield* Effect.fail(
            new ChatAuthError({
              message: `Authentication failed (401): ${errorMessage}. Please check your API key in Settings.`,
              status: 401,
            })
          );
        } else if (response.status === 404) {
          return yield* Effect.fail(
            new ChatNotFoundError({
              message: `Endpoint or model not found (404): ${errorMessage}. Please verify your Base URL and Model name.`,
            })
          );
        } else if (response.status === 429) {
          return yield* Effect.fail(
            new ChatRateLimitError({
              message: `Rate limit exceeded (429): ${errorMessage}. Please try again shortly.`,
            })
          );
        }

        return yield* Effect.fail(new ChatNetworkError({ message: `API Error: ${errorMessage}` }));
      }

      if (!response.body) {
        return yield* Effect.fail(
          new ChatNetworkError({
            message: 'Response body is empty (streaming not supported by provider)',
          })
        );
      }

      onStatus?.('thinking');

      const rawByteStream = Stream.fromReadableStream(
        () => response.body!,
        (cause) => new ChatNetworkError({ message: 'Stream read failed', cause })
      );

      const tokenStream = rawByteStream.pipe(
        Stream.decodeText('utf-8'),
        Stream.splitLines,
        Stream.mapEffect((rawLine) =>
          Effect.gen(function* () {
            const line = rawLine.trim();
            if (!line || line.startsWith(':') || !line.startsWith('data:')) {
              return Option.none<string>();
            }

            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') {
              return Option.none<string>();
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                const errMsg = parsed.error.message || JSON.stringify(parsed.error);
                const errCode = parsed.error.code;
                if (errCode === 429 || /rate\s*limit/i.test(errMsg)) {
                  return yield* Effect.fail(
                    new ChatRateLimitError({
                      message: `Rate limit exceeded (429): ${errMsg}. Please try again shortly.`,
                    })
                  );
                } else if (errCode === 401 || /auth|unauthorized|api.?key/i.test(errMsg)) {
                  return yield* Effect.fail(
                    new ChatAuthError({
                      message: `Authentication failed: ${errMsg}. Please check your API key.`,
                      status: 401,
                    })
                  );
                }
                return yield* Effect.fail(new ChatNetworkError({ message: `API Error: ${errMsg}` }));
              }

              const delta =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.text ??
                '';
              if (typeof delta === 'string' && delta.length > 0) {
                return Option.some(delta);
              }
            } catch {
              // ignore malformed JSON chunk in stream
            }
            return Option.none<string>();
          })
        ),
        Stream.filterMap((opt) => opt),
        Stream.timeoutFail(
          () =>
            new ChatInactivityTimeoutError({
              message: 'Request timed out. The AI endpoint stopped responding.',
              timeoutMs: 120000,
            }),
          timeoutDuration
        )
      );

      return tokenStream;
    })
  );
}

/**
 * Fetches available models from an OpenAI-compatible endpoint.
 * Moves logic out of settings.ts to unify all chat endpoint error handling and retry mechanisms.
 */
export function fetchAvailableModels(
  baseUrl: string,
  apiKey: string
): Effect.Effect<string[], ChatError> {
  return Effect.gen(function* () {
    if (!baseUrl || !baseUrl.trim()) {
      return yield* Effect.fail(new ChatConfigError({ message: 'Base URL is required' }));
    }

    const resolvedApiKey = (
      yield* Effect.tryPromise({
        try: () => decryptSecret(apiKey || ''),
        catch: () => new ChatConfigError({ message: 'Failed to decrypt API key' }),
      })
    ).trim();

    const endpoint = getModelsUrl(baseUrl);
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (resolvedApiKey) {
      headers['Authorization'] = `Bearer ${resolvedApiKey}`;
    }
    if (cleanBaseUrl.includes('anthropic.com')) {
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const res = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(endpoint, {
          method: 'GET',
          headers,
          signal,
        }),
      catch: (cause) =>
        new ChatNetworkError({
          message: 'Network request failed (Check CORS or Base URL)',
          cause,
        }),
    }).pipe(
      Effect.timeout('15 seconds'),
      Effect.catchTag('TimeoutException', () =>
        Effect.fail(new ChatNetworkError({ message: 'Model listing request timed out after 15s' }))
      )
    );

    if (!res.ok) {
      const errText = yield* Effect.tryPromise({
        try: () => res.text(),
        catch: () => Promise.resolve(''),
      }).pipe(Effect.catchAll(() => Effect.succeed('')));

      let msg = `HTTP ${res.status} (${res.statusText})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      } catch {
        if (errText) {
          msg = errText.slice(0, 80);
        }
      }

      if (res.status === 401) {
        return yield* Effect.fail(
          new ChatAuthError({
            message: `Authentication failed (401): ${msg}. Please check your API key in Settings.`,
            status: 401,
          })
        );
      }
      if (res.status === 404) {
        return yield* Effect.fail(
          new ChatNotFoundError({
            message: `Endpoint or models not found (404): ${msg}. Please verify your Base URL.`,
          })
        );
      }
      if (res.status === 429) {
        return yield* Effect.fail(
          new ChatRateLimitError({
            message: `Rate limit exceeded (429): ${msg}. Please try again shortly.`,
          })
        );
      }
      return yield* Effect.fail(new ChatNetworkError({ message: msg }));
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () =>
        new ChatParseError({ message: 'Failed to parse models response JSON' }),
    });

    let list: string[] = [];
    if (Array.isArray(data?.data)) {
      list = data.data.map((m: any) => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data?.models)) {
      list = data.models.map((m: any) => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data)) {
      list = data.map((m: any) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);
    }

    // Filter out non-chat / embedding / audio / tts / whisper models if standard OpenAI
    if (cleanBaseUrl.includes('api.openai.com')) {
      const excluded = [
        'embedding',
        'whisper',
        'tts',
        'dall-e',
        'davinci',
        'babbage',
        'moderation',
        'realtime',
        'audio',
      ];
      list = list.filter((id) => !excluded.some((ex) => id.toLowerCase().includes(ex)));
    }

    if (list.length === 0) {
      return yield* Effect.fail(
        new ChatNotFoundError({ message: 'Endpoint returned an empty list of models' })
      );
    }

    // Sort alphabetically
    list.sort((a, b) => a.localeCompare(b));
    return list;
  });
}

/**
 * Normalizes a base URL and returns the standard chat completions endpoint URL.
 */
function getChatCompletionsUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/chat/completions')) {
    return clean;
  }
  return `${clean}/chat/completions`;
}

/**
 * Normalizes a base URL and returns the standard models listing endpoint URL.
 */
function getModelsUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/chat/completions')) {
    return clean.replace(/\/chat\/completions$/, '/models');
  }
  if (clean.endsWith('/models')) {
    return clean;
  }
  return `${clean}/models`;
}

/**
 * Generates a concise topic title for an existing conversation using the configured AI endpoint.
 * Used by the automated `/rename` slash command without adding messages to chat history.
 */
export function generateConversationTitle(
  conversationId: string
): Effect.Effect<string | null, ChatError> {
  return Effect.gen(function* () {
    const state = store.getState();
    const settings = state.chatSettings;
    const { activeLessonSlug } = state;

    if (!settings?.enabled || !settings.baseUrl || !settings.model) {
      return null;
    }

    const convs = state.chatConversations[activeLessonSlug] || [];
    const activeConv = convs.find((c) => c.id === conversationId);
    const history = (activeConv?.messages || [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    if (history.length === 0) {
      return 'Chat';
    }

    const endpoint = getChatCompletionsUrl(settings.baseUrl);
    const rawKey = settings.apiKey || '';
    const resolvedKey = (
      yield* Effect.tryPromise({
        try: () => decryptSecret(rawKey),
        catch: () => new ChatConfigError({ message: 'Failed to decrypt API key' }),
      })
    ).trim();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (resolvedKey) {
      headers['Authorization'] = `Bearer ${resolvedKey}`;
    }
    if (settings.baseUrl.includes('anthropic.com')) {
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are a concise conversation summarizer. Output a 1-3 word topic title summarizing the user discussion enclosed in <title>...</title> tags (e.g. <title>Binary Search</title>). Respond ONLY with the title tags, no other text.',
      },
      ...history,
      {
        role: 'user',
        content:
          'Summarize the topic of this conversation in a 1-3 word title enclosed in <title>...</title> tags.',
      },
    ];

    const response = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: settings.model,
            messages,
            temperature: 0.3,
            max_tokens: 1024,
          }),
          signal,
        }),
      catch: (cause) =>
        new ChatNetworkError({
          message: 'Failed to generate title',
          cause,
        }),
    }).pipe(
      Effect.timeout('15 seconds'),
      Effect.catchAll(() => Effect.succeed(null))
    );

    if (!response || !response.ok) {
      return null;
    }

    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: () => Promise.resolve(''),
    }).pipe(Effect.catchAll(() => Effect.succeed('')));

    let rawContent = '';
    try {
      const data = JSON.parse(text);
      const choice = data.choices?.[0];
      rawContent = choice?.message?.content || choice?.text || '';
      // Fallback if model output is in reasoning_content
      if (!rawContent.trim() && choice?.message?.reasoning_content) {
        const rMatch = choice.message.reasoning_content.match(/<title>([^<]*)<\/title>/i);
        if (rMatch) {
          rawContent = rMatch[0];
        }
      }
    } catch {
      // In case the endpoint returned SSE streaming text even without stream: true
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:') && !line.includes('[DONE]')) {
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            rawContent += parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
          } catch {}
        }
      }
    }

    const match =
      rawContent.match(/<title>([^<]*)<\/title>/i) ||
      rawContent.match(/^\s*<title>([^<]*)<\/title>/i);
    let title: string | null = null;
    if (match) {
      title = match[1].trim().replace(/[#*_`]/g, '').slice(0, 24);
    } else if (rawContent.trim()) {
      title = rawContent.trim().replace(/[#*_`]/g, '').replace(/^title:\s*/i, '').slice(0, 24);
    }

    return title || null;
  });
}
