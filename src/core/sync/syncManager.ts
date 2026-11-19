// src/core/sync/syncManager.ts
import { Effect, Fiber, Schedule } from 'effect';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_WORKER_URL } from './oauthConfig';
import { store, ensureSettingsDecrypted } from '../store';
import {
  createGist,
  fetchGist,
  updateGist,
  exchangeOAuthCode,
  findSiteGist,
  GistActionResult,
} from './gistClient';
import {
  GistError,
  GistNetworkError,
  GistConflictError,
  GistSiteMismatchError,
  GistAuthError,
  GistParseError,
} from './errors';
import { buildGistFiles, parseAndMergeGistFiles, BACKUP_FILENAMES } from '../backup';
import { SITE_SLUG } from '../siteConfig';
import { showPopup } from '../../ui/popup';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncStateEvent {
  status: SyncStatusType;
  message?: string;
  lastSyncedAt?: number;
}

// Internal sync state
let currentSyncState: SyncStateEvent = {
  status: 'idle',
};

const listeners = new Set<(event: SyncStateEvent) => void>();
let autoPushFiber: Fiber.RuntimeFiber<void, never> | null = null;
let lastFocusCheckAt = 0;
const FOCUS_CHECK_COOLDOWN_MS = 15_000;
let lastPushedPayloadString: string | null = null;

// Concurrency lock to serialize sync operations
const syncSemaphore = Effect.unsafeMakeSemaphore(1);
let isListenersInitialized = false;

/**
 * Validates that remote Gist files belong to the current site instance.
 */
function validateGistSiteMatch(files: Record<string, any>): Effect.Effect<void, GistSiteMismatchError> {
  const expectedMeta = `_${SITE_SLUG}.json`;
  const foreignMeta = Object.keys(files).find(
    (fn) => fn.startsWith('_') && fn.endsWith('.json') && fn !== expectedMeta
  );
  if (foreignMeta) {
    const foreignSlug = foreignMeta.slice(1, -5);
    return Effect.fail(
      new GistSiteMismatchError({
        message: `Gist belongs to a different site instance ('${foreignSlug}'). Current site is '${SITE_SLUG}'.`,
        foreignSlug,
        currentSlug: SITE_SLUG,
      })
    );
  }
  return Effect.void;
}

/**
 * Subscribes to reactive sync status updates.
 */
export function subscribeSyncStatus(listener: (event: SyncStateEvent) => void): () => void {
  listeners.add(listener);
  listener(getSyncStatus());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns the current sync status.
 */
export function getSyncStatus(): SyncStateEvent {
  const storeLastSynced = store.getState().gistSyncSettings?.lastSyncedAt;
  return {
    ...currentSyncState,
    lastSyncedAt: currentSyncState.lastSyncedAt ?? storeLastSynced,
  };
}

function setSyncStatus(status: SyncStatusType, message?: string, lastSyncedAt?: number) {
  currentSyncState = {
    status,
    message,
    lastSyncedAt: lastSyncedAt ?? currentSyncState.lastSyncedAt ?? store.getState().gistSyncSettings?.lastSyncedAt,
  };
  listeners.forEach((l) => l(currentSyncState));
}

/**
 * Pushes the current application state as multi-file backup to GitHub Gist.
 * Includes CAS (Compare-And-Swap) conflict check: if remote was updated by another device, merges first.
 */
export function pushToGist(): Effect.Effect<GistActionResult, GistError> {
  const operation = Effect.gen(function* () {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline', 'Cannot sync while offline.');
      return yield* Effect.fail(new GistNetworkError({ message: 'Offline' }));
    }

    if (store.getState().gistSyncSettings?.token?.startsWith('enc:v1:')) {
      yield* Effect.promise(() => ensureSettingsDecrypted());
    }

    const { gistSyncSettings } = store.getState();
    if (!gistSyncSettings?.enabled || !gistSyncSettings?.token || !gistSyncSettings?.gistId) {
      return yield* Effect.fail(
        new GistAuthError({ message: 'Gist sync is not configured or enabled.' })
      );
    }

    if (gistSyncSettings.token.startsWith('enc:v1:')) {
      return yield* Effect.fail(
        new GistAuthError({ message: 'GitHub credentials are not yet decrypted.' })
      );
    }

    setSyncStatus('syncing');

    const pullRes = yield* pullAndMergeIfNeeded(
      gistSyncSettings.gistId,
      gistSyncSettings.token,
      gistSyncSettings.lastSyncedAt
    );

    const newFiles = yield* Effect.promise(() => buildGistFiles(store.getState()));

    const currentPayloadString = JSON.stringify(newFiles);
    if (!pullRes.merged && currentPayloadString === lastPushedPayloadString) {
      const now = Date.now();
      setSyncStatus('synced', 'Synced successfully.', now);
      return { updatedAt: new Date(now).toISOString() };
    }

    const validFileSet = new Set(Object.values(BACKUP_FILENAMES));
    const filesToUpdate: Record<string, string | null> = { ...newFiles };

    // Mark any obsolete files currently on the Gist for deletion
    if (pullRes.files) {
      for (const existingFilename of Object.keys(pullRes.files)) {
        if (!validFileSet.has(existingFilename as any)) {
          filesToUpdate[existingFilename] = null;
        }
      }
    }

    const res = yield* updateGist(gistSyncSettings.gistId, gistSyncSettings.token, filesToUpdate);

    lastPushedPayloadString = currentPayloadString;
    const now = Date.now();
    store.getState().setGistSyncSettings({ lastSyncedAt: now });
    setSyncStatus('synced', 'Synced successfully.', now);
    return res;
  });

  return syncSemaphore.withPermits(1)(operation).pipe(
    Effect.tapError((err) =>
      Effect.sync(() => {
        setSyncStatus('error', err.message || 'Network error during Gist push.');
      })
    )
  );
}

/**
 * Pulls multi-file backup data from GitHub Gist and updates local state.
 */
export function pullFromGist(options?: { smartMerge?: boolean }): Effect.Effect<GistActionResult, GistError> {
  const operation = Effect.gen(function* () {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline', 'Cannot sync while offline.');
      return yield* Effect.fail(new GistNetworkError({ message: 'Offline' }));
    }

    if (store.getState().gistSyncSettings?.token?.startsWith('enc:v1:')) {
      yield* Effect.promise(() => ensureSettingsDecrypted());
    }

    const { gistSyncSettings } = store.getState();
    if (!gistSyncSettings?.gistId) {
      return yield* Effect.fail(
        new GistConflictError({ message: 'No Gist ID configured.' })
      );
    }

    setSyncStatus('syncing');

    const res = yield* fetchGist(gistSyncSettings.gistId, gistSyncSettings.token);
    if (!res.files) {
      return yield* Effect.fail(
        new GistParseError({ message: 'Failed to fetch Gist content.' })
      );
    }

    // Pre-flight check: ensure remote Gist belongs to this site
    yield* validateGistSiteMatch(res.files);

    const smartMerge = options?.smartMerge !== false;
    const currentState = store.getState();
    const parsed = parseAndMergeGistFiles(res.files, currentState, smartMerge);

    if (!parsed || !parsed.data) {
      return yield* Effect.fail(
        new GistParseError({ message: 'Gist content does not contain valid backup files.' })
      );
    }

    store.setState(parsed.data);

    const now = Date.now();
    store.getState().setGistSyncSettings({ lastSyncedAt: now, enabled: true });
    setSyncStatus('synced', 'Synced successfully.', now);
    return { updatedAt: res.updatedAt };
  });

  return syncSemaphore.withPermits(1)(operation).pipe(
    Effect.tapError((err) =>
      Effect.sync(() => {
        setSyncStatus('error', err.message || 'Error pulling from Gist.');
      })
    )
  );
}

/**
 * Creates a new secret Gist with multi-file state and links it to settings.
 */
export function createAndLinkGist(token: string): Effect.Effect<GistActionResult, GistError> {
  if (!token || !token.trim()) {
    return Effect.fail(
      new GistAuthError({ message: 'GitHub Personal Access Token is required.' })
    );
  }

  const operation = Effect.gen(function* () {
    setSyncStatus('syncing');
    const files = yield* Effect.promise(() => buildGistFiles(store.getState()));
    const res = yield* createGist(token, files);

    if (res.gistId) {
      const now = Date.now();
      store.getState().setGistSyncSettings({
        enabled: true,
        token: token.trim(),
        gistId: res.gistId,
        autoSync: true,
        lastSyncedAt: now,
      });
      setSyncStatus('synced', 'Gist created and linked.', now);
    }
    return res;
  });

  return syncSemaphore.withPermits(1)(operation).pipe(
    Effect.tapError((err) =>
      Effect.sync(() => {
        setSyncStatus('error', err.message || 'Error creating Gist.');
      })
    )
  );
}

/**
 * Schedules a debounced auto-push if auto-sync is enabled.
 * Uses a cancellable Effect Fiber.
 */
export function scheduleAutoPush(delayMs = 5000): void {
  const { gistSyncSettings } = store.getState();
  if (!gistSyncSettings?.enabled || !gistSyncSettings?.autoSync || !gistSyncSettings?.token || !gistSyncSettings?.gistId) {
    return;
  }

  if (autoPushFiber) {
    Effect.runFork(Fiber.interrupt(autoPushFiber));
    autoPushFiber = null;
  }

  let taskFiber: Fiber.RuntimeFiber<void, never> | null = null;
  const delayedTask = Effect.sleep(`${delayMs} millis`).pipe(
    Effect.andThen(pushToGist()),
    Effect.ignoreLogged,
    Effect.ensuring(
      Effect.sync(() => {
        if (autoPushFiber === taskFiber) {
          autoPushFiber = null;
        }
      })
    ),
    Effect.asVoid
  );

  taskFiber = Effect.runFork(delayedTask);
  autoPushFiber = taskFiber;
}

/**
 * Immediately triggers a push without waiting for debouncing.
 */
export function triggerImmediatePush(): void {
  if (autoPushFiber) {
    Effect.runFork(Fiber.interrupt(autoPushFiber));
    autoPushFiber = null;
  }
  const { gistSyncSettings } = store.getState();
  if (gistSyncSettings?.enabled && gistSyncSettings?.token && gistSyncSettings?.gistId) {
    Effect.runFork(pushToGist().pipe(Effect.ignoreLogged));
  }
}

/**
 * Initiates the GitHub OAuth authorization flow by redirecting to GitHub.
 */
export function initiateOAuthLogin(): void {
  if (typeof window === 'undefined') return;

  const csrf = crypto.randomUUID();
  sessionStorage.setItem('codebook_gh_oauth_state', csrf);

  const statePayload = btoa(
    JSON.stringify({
      csrf,
      returnUrl: window.location.origin + window.location.pathname,
    })
  );

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    GITHUB_OAUTH_CLIENT_ID
  )}&scope=gist&state=${encodeURIComponent(statePayload)}`;

  window.location.href = authUrl;
}

/**
 * Handles incoming GitHub OAuth redirect callback (?code=...&state=...) on application startup.
 */
export function handleOAuthCallback(): Effect.Effect<boolean, GistError> {
  return Effect.gen(function* () {
    if (typeof window === 'undefined' || !window.location.search) {
      return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const rawState = urlParams.get('state');

    if (!code) return false;

    // Extract CSRF from state payload
    let incomingCsrf = rawState;
    if (rawState) {
      try {
        const parsed = JSON.parse(atob(rawState));
        if (parsed.csrf) incomingCsrf = parsed.csrf;
      } catch { }
    }

    // CSRF validation
    const savedState = sessionStorage.getItem('codebook_gh_oauth_state');
    sessionStorage.removeItem('codebook_gh_oauth_state');

    if (savedState && incomingCsrf && incomingCsrf !== savedState) {
      console.error('[sync] OAuth state mismatch (possible CSRF attack).');
      setSyncStatus('error', 'OAuth security verification failed.');
      return false;
    }

    // Remove OAuth query parameters from URL bar without reloading
    urlParams.delete('code');
    urlParams.delete('state');
    const remainingQuery = urlParams.toString();
    const cleanUrl =
      window.location.pathname +
      (remainingQuery ? `?${remainingQuery}` : '') +
      window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    setSyncStatus('syncing', 'Signing in with GitHub...');
    showPopup('Syncing from GitHub...', 3000);
    const token = yield* exchangeOAuthCode(GITHUB_OAUTH_WORKER_URL, code);

    setSyncStatus('syncing', 'Locating your Codebook backup...');
    const discovered = yield* findSiteGist(token);

    if (discovered?.gistId) {
      // Existing backup found for this site instance
      const now = Date.now();
      store.getState().setGistSyncSettings({
        enabled: true,
        token,
        gistId: discovered.gistId,
        autoSync: true,
        lastSyncedAt: now,
      });

      yield* pullFromGist({ smartMerge: true });
      setSyncStatus('synced', 'Connected to GitHub and synced successfully!', now);
      showPopup('Connected to GitHub!');
      return true;
    } else {
      // No existing backup found; create a new one
      const createRes = yield* createAndLinkGist(token);
      if (createRes.gistId) {
        setSyncStatus('synced', 'Created new Codebook backup on GitHub Gist.');
        showPopup('Connected to GitHub!');
        return true;
      }
      return false;
    }
  }).pipe(
    Effect.tapError((err) =>
      Effect.sync(() => {
        setSyncStatus('error', err.message || 'Error during GitHub sign in.');
      })
    )
  );
}

/**
 * Checks if remote Gist has newer changes when app regains focus or visibility.
 */
export function checkAndPullOnFocus(): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    if (store.getState().gistSyncSettings?.token?.startsWith('enc:v1:')) {
      yield* Effect.promise(() => ensureSettingsDecrypted());
    }

    const { gistSyncSettings } = store.getState();
    if (
      !gistSyncSettings?.enabled ||
      !gistSyncSettings?.token ||
      !gistSyncSettings?.gistId ||
      gistSyncSettings.token.startsWith('enc:v1:')
    ) {
      return;
    }

    if (autoPushFiber !== null) return;

    const now = Date.now();
    if (now - lastFocusCheckAt < FOCUS_CHECK_COOLDOWN_MS) return;
    lastFocusCheckAt = now;

    yield* syncSemaphore.withPermits(1)(
      pullAndMergeIfNeeded(
        gistSyncSettings.gistId,
        gistSyncSettings.token,
        gistSyncSettings.lastSyncedAt
      )
    ).pipe(
      Effect.catchAll((err) => {
        console.warn('[sync] Focus check failed:', err);
        return Effect.void;
      })
    );
  }).pipe(
    Effect.catchAll(() => Effect.void)
  );
}

/**
 * Checks for OAuth callbacks and remote Gist updates on startup.
 */
export function initStartupSync(): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    // Setup network and visibility status listeners (once)
    if (typeof window !== 'undefined' && !isListenersInitialized) {
      isListenersInitialized = true;
      window.addEventListener('online', () => {
        setSyncStatus('idle');
        scheduleAutoPush(1000);
      });
      window.addEventListener('offline', () => {
        setSyncStatus('offline', 'Offline');
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          Effect.runFork(checkAndPullOnFocus());
        }
      });
    }

    // Handle OAuth redirect callback if present
    const handledAuth = yield* handleOAuthCallback().pipe(
      Effect.catchAll((err) => {
        console.warn('[sync] OAuth callback handling failed:', err);
        return Effect.succeed(false);
      })
    );

    if (store.getState().gistSyncSettings?.token?.startsWith('enc:v1:')) {
      yield* Effect.promise(() => ensureSettingsDecrypted());
    }

    const { gistSyncSettings } = store.getState();
    if (!gistSyncSettings?.enabled || !gistSyncSettings?.gistId) {
      return;
    }

    if (!handledAuth) {
      if (gistSyncSettings.token && gistSyncSettings.lastSyncedAt) {
        yield* syncSemaphore.withPermits(1)(
          pullAndMergeIfNeeded(
            gistSyncSettings.gistId,
            gistSyncSettings.token,
            gistSyncSettings.lastSyncedAt
          )
        ).pipe(
          Effect.catchAll((err) => {
            console.warn('[sync] Startup sync failed:', err);
            return Effect.void;
          })
        );
      } else {
        yield* pullFromGist({ smartMerge: true }).pipe(
          Effect.catchAll((err) => {
            console.warn('[sync] Startup sync failed:', err);
            return Effect.void;
          })
        );
      }
    }
  });
}

/**
 * Fetches remote state and merges into local if newer.
 */
export function pullAndMergeIfNeeded(
  gistId: string,
  token: string,
  lastSyncedAt?: number
): Effect.Effect<{ merged: boolean; error?: string; files?: Record<string, any> }, GistError> {
  return Effect.gen(function* () {
    const lastSyncedIso = lastSyncedAt ? new Date(lastSyncedAt).toUTCString() : undefined;

    const res = yield* fetchGist(gistId, token, { ifModifiedSince: lastSyncedIso });

    if (res.notModified) return { merged: false };
    if (!res.files) return { merged: false };

    yield* validateGistSiteMatch(res.files);

    const remoteUpdatedAt = res.updatedAt ? new Date(res.updatedAt).getTime() : 0;
    if (remoteUpdatedAt > (lastSyncedAt || 0)) {
      const currentState = store.getState();
      const parsed = parseAndMergeGistFiles(res.files, currentState, true);
      if (parsed && parsed.data) {
        store.setState(parsed.data);
        const syncNow = Date.now();
        store.getState().setGistSyncSettings({ lastSyncedAt: syncNow });
        setSyncStatus('synced', 'Synced with cloud.', syncNow);
        return { merged: true, files: res.files };
      }
    }

    return { merged: false, files: res.files };
  });
}
