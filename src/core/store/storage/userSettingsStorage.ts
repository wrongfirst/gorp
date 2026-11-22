// src/core/store/storage/userSettingsStorage.ts
import { encryptSecret } from '../../crypto';
import {
  ChatEndpoint,
  ChatSettings,
  GistAuthSettings,
  LastCompletedInfo,
  LastVisitedInfo,
  UserSettings,
  defaultChatSettings,
  defaultGistAuthSettings,
} from '../../types';

export const USER_SETTINGS_KEY = 'user_settings';
export const USER_SETTINGS_VERSION = 1;

let userSettingsWriteQueue: Promise<void> = Promise.resolve();
let userSettingsWritesSuppressed = false;
let suppressStoreSyncDepth = 0;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeChatSettingsFromRaw(raw: unknown): ChatSettings | undefined {
  if (!isPlainObject(raw)) return undefined;

  const endpoints: ChatEndpoint[] = Array.isArray(raw.endpoints)
    ? raw.endpoints
        .filter((ep): ep is Record<string, unknown> => isPlainObject(ep))
        .map((ep) => ({
          id: typeof ep.id === 'string' && ep.id ? ep.id : 'default-endpoint',
          ...(typeof ep.name === 'string' ? { name: ep.name } : {}),
          baseUrl: typeof ep.baseUrl === 'string' ? ep.baseUrl : '',
          apiKey: typeof ep.apiKey === 'string' ? ep.apiKey : '',
          model: typeof ep.model === 'string' ? ep.model : '',
        }))
    : defaultChatSettings.endpoints.map((ep) => ({ ...ep }));

  const safeEndpoints =
    endpoints.length > 0
      ? endpoints
      : defaultChatSettings.endpoints.map((ep) => ({ ...ep }));

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaultChatSettings.enabled,
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : defaultChatSettings.baseUrl,
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : defaultChatSettings.apiKey,
    model: typeof raw.model === 'string' ? raw.model : defaultChatSettings.model,
    selectedEndpointId:
      typeof raw.selectedEndpointId === 'string' && raw.selectedEndpointId
        ? raw.selectedEndpointId
        : safeEndpoints[0]?.id || 'default-endpoint',
    endpoints: safeEndpoints,
  };
}

function sanitizeGistAuthFromRaw(raw: unknown): GistAuthSettings | undefined {
  if (!isPlainObject(raw)) return undefined;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaultGistAuthSettings.enabled,
    token: typeof raw.token === 'string' ? raw.token.trim() : defaultGistAuthSettings.token,
    autoSync: typeof raw.autoSync === 'boolean' ? raw.autoSync : defaultGistAuthSettings.autoSync,
  };
}

function sanitizeLastVisitedFromRaw(raw: unknown): LastVisitedInfo | undefined {
  if (!isPlainObject(raw)) return undefined;
  if (typeof raw.siteSlug !== 'string' || !raw.siteSlug.trim()) return undefined;
  return {
    siteSlug: raw.siteSlug.trim(),
    siteTitle:
      typeof raw.siteTitle === 'string' && raw.siteTitle.trim()
        ? raw.siteTitle.trim()
        : raw.siteSlug.trim(),
    lessonSlug: typeof raw.lessonSlug === 'string' ? raw.lessonSlug.trim() : '',
    lessonTitle: typeof raw.lessonTitle === 'string' ? raw.lessonTitle.trim() : '',
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  };
}

function sanitizeLastCompletedFromRaw(raw: unknown): LastCompletedInfo | undefined {
  if (!isPlainObject(raw)) return undefined;
  if (typeof raw.siteSlug !== 'string' || !raw.siteSlug.trim()) return undefined;
  return {
    siteSlug: raw.siteSlug.trim(),
    siteTitle:
      typeof raw.siteTitle === 'string' && raw.siteTitle.trim()
        ? raw.siteTitle.trim()
        : raw.siteSlug.trim(),
    lessonSlug: typeof raw.lessonSlug === 'string' ? raw.lessonSlug.trim() : '',
    lessonTitle: typeof raw.lessonTitle === 'string' ? raw.lessonTitle.trim() : '',
    nextLessonSlug:
      typeof raw.nextLessonSlug === 'string' && raw.nextLessonSlug.trim()
        ? raw.nextLessonSlug.trim()
        : null,
    nextLessonTitle:
      typeof raw.nextLessonTitle === 'string' && raw.nextLessonTitle.trim()
        ? raw.nextLessonTitle.trim()
        : null,
    completedAt:
      typeof raw.completedAt === 'number' && Number.isFinite(raw.completedAt) ? raw.completedAt : 0,
  };
}

function hasMeaningfulChatConfig(cs: ChatSettings): boolean {
  if (cs.enabled || cs.baseUrl.trim() || cs.apiKey.trim() || cs.model.trim()) {
    return true;
  }
  return cs.endpoints.some(
    (ep) =>
      Boolean(ep.name?.trim()) ||
      Boolean(ep.baseUrl.trim()) ||
      Boolean(ep.apiKey.trim()) ||
      Boolean(ep.model.trim())
  );
}

function hasMeaningfulGistAuth(auth: GistAuthSettings): boolean {
  return Boolean(auth.enabled || auth.token.trim() || auth.autoSync === false);
}

function clonePatch(patch: Partial<UserSettings>): Partial<UserSettings> {
  const cloned: Partial<UserSettings> = {};
  if (typeof patch.version === 'number') {
    cloned.version = patch.version;
  }
  if (typeof patch.vimMode === 'boolean') {
    cloned.vimMode = patch.vimMode;
  }
  if (typeof patch.preferredLanguage === 'string' && patch.preferredLanguage.trim()) {
    cloned.preferredLanguage = patch.preferredLanguage.trim();
  }
  if (patch.chatSettings) {
    cloned.chatSettings = {
      ...patch.chatSettings,
      endpoints: Array.isArray(patch.chatSettings.endpoints)
        ? patch.chatSettings.endpoints.map((ep) => ({ ...ep }))
        : [],
    };
  }
  if (patch.gistAuth) {
    cloned.gistAuth = { ...patch.gistAuth };
  }
  if (patch.lastVisited) {
    cloned.lastVisited = { ...patch.lastVisited };
  }
  if (patch.lastCompleted) {
    cloned.lastCompleted = {
      ...patch.lastCompleted,
      nextLessonSlug: patch.lastCompleted.nextLessonSlug ?? null,
      nextLessonTitle: patch.lastCompleted.nextLessonTitle ?? null,
    };
  }
  return cloned;
}

async function encryptIfNeeded(secret: string): Promise<string> {
  if (!secret) return '';
  if (secret.startsWith('enc:v1:')) return secret;
  return encryptSecret(secret);
}

/**
 * Reads the raw parsed JSON object from shared `user_settings` without stripping unknown keys.
 */
export function readRawUserSettings(): Record<string, unknown> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(USER_SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Reads and sanitizes known fields from shared `user_settings`.
 * Secrets (`chatSettings.apiKey`, `chatSettings.endpoints[].apiKey`, `gistAuth.token`) remain
 * as stored (`enc:v1:...` or legacy plaintext) until `ensureSettingsDecrypted()` runs.
 */
export function readUserSettings(): Partial<UserSettings> {
  const raw = readRawUserSettings();
  const result: Partial<UserSettings> = {};

  if (typeof raw.version === 'number') {
    result.version = raw.version;
  }
  if (typeof raw.vimMode === 'boolean') {
    result.vimMode = raw.vimMode;
  }
  if (typeof raw.preferredLanguage === 'string' && raw.preferredLanguage.trim()) {
    result.preferredLanguage = raw.preferredLanguage.trim();
  }
  const chatSettings = sanitizeChatSettingsFromRaw(raw.chatSettings);
  if (chatSettings) {
    result.chatSettings = chatSettings;
  }
  const gistAuth = sanitizeGistAuthFromRaw(raw.gistAuth);
  if (gistAuth) {
    result.gistAuth = gistAuth;
  }
  const lastVisited = sanitizeLastVisitedFromRaw(raw.lastVisited);
  if (lastVisited) {
    result.lastVisited = lastVisited;
  }
  const lastCompleted = sanitizeLastCompletedFromRaw(raw.lastCompleted);
  if (lastCompleted) {
    result.lastCompleted = lastCompleted;
  }

  return result;
}

async function processUserSettingsPatch(patch: Partial<UserSettings>): Promise<void> {
  if (userSettingsWritesSuppressed || typeof localStorage === 'undefined') return;

  try {
    const encryptedPatch: Record<string, unknown> = { ...patch };

    if (patch.chatSettings) {
      const cs: ChatSettings = {
        ...patch.chatSettings,
        apiKey: await encryptIfNeeded(patch.chatSettings.apiKey || ''),
        endpoints: await Promise.all(
          (patch.chatSettings.endpoints || []).map(async (ep) => ({
            ...ep,
            apiKey: await encryptIfNeeded(ep.apiKey || ''),
          }))
        ),
      };
      encryptedPatch.chatSettings = cs;
    }

    if (patch.gistAuth) {
      const ga: GistAuthSettings = {
        ...patch.gistAuth,
        token: await encryptIfNeeded(patch.gistAuth.token || ''),
      };
      encryptedPatch.gistAuth = ga;
    }

    if (userSettingsWritesSuppressed) return;

    // Merge-on-write invariant: always re-read raw JSON right before writing so unknown keys
    // written by newer canary instances are never clobbered.
    const existingRaw = readRawUserSettings();
    const existingVersion =
      typeof existingRaw.version === 'number' && Number.isFinite(existingRaw.version)
        ? existingRaw.version
        : 0;

    const merged: Record<string, unknown> = {
      ...existingRaw,
      ...encryptedPatch,
      version: Math.max(USER_SETTINGS_VERSION, existingVersion),
    };

    if (isPlainObject(existingRaw.chatSettings) && isPlainObject(encryptedPatch.chatSettings)) {
      merged.chatSettings = {
        ...existingRaw.chatSettings,
        ...encryptedPatch.chatSettings,
      };
    }

    if (isPlainObject(existingRaw.gistAuth) && isPlainObject(encryptedPatch.gistAuth)) {
      merged.gistAuth = {
        ...existingRaw.gistAuth,
        ...encryptedPatch.gistAuth,
      };
    }

    if (isPlainObject(existingRaw.lastVisited) && isPlainObject(encryptedPatch.lastVisited)) {
      merged.lastVisited = {
        ...existingRaw.lastVisited,
        ...encryptedPatch.lastVisited,
      };
    }

    if (isPlainObject(encryptedPatch.lastCompleted)) {
      const nextCompleted = encryptedPatch.lastCompleted;
      merged.lastCompleted = {
        ...nextCompleted,
        nextLessonSlug:
          typeof nextCompleted.nextLessonSlug === 'string' && nextCompleted.nextLessonSlug.trim()
            ? nextCompleted.nextLessonSlug.trim()
            : null,
        nextLessonTitle:
          typeof nextCompleted.nextLessonTitle === 'string' && nextCompleted.nextLessonTitle.trim()
            ? nextCompleted.nextLessonTitle.trim()
            : null,
      };
    }

    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('[user_settings] Failed to persist shared user settings:', err);
  }
}

/**
 * Queues a sequential merge-on-write patch to `user_settings`.
 * Encrypts `chatSettings` API keys and `gistAuth.token` at rest before writing.
 */
export function writeUserSettingsPatch(patch: Partial<UserSettings>): void {
  if (userSettingsWritesSuppressed) return;
  const cloned = clonePatch(patch);
  if (Object.keys(cloned).length === 0) return;

  userSettingsWriteQueue = userSettingsWriteQueue
    .then(() => processUserSettingsPatch(cloned))
    .catch((err) => {
      console.warn('[user_settings] Error during queued write:', err);
    });
}

/**
 * One-time backward-compatible startup migration from legacy per-instance `${SITE_SLUG}_storage`
 * fields (`vimMode`, `chatSettings`, `gistSyncSettings.{enabled,token,autoSync}`) into shared
 * `user_settings` via merge-on-write.
 *
 * Returns the effective `Partial<UserSettings>` synchronously for immediate store hydration.
 */
export function migrateLegacySettingsToUserSettings(
  legacyState: Record<string, unknown> | undefined
): Partial<UserSettings> {
  const existingRaw = readRawUserSettings();
  const currentSettings = readUserSettings();

  if (!legacyState) {
    return currentSettings;
  }

  const migrationPatch: Partial<UserSettings> = {};

  // 1. Migrate vimMode only when absent in user_settings and explicitly enabled in legacy storage
  if (existingRaw.vimMode === undefined && legacyState.vimMode === true) {
    migrationPatch.vimMode = true;
  }

  // 2. Migrate chatSettings when absent in user_settings and meaningfully configured in legacy storage
  if (existingRaw.chatSettings === undefined && isPlainObject(legacyState.chatSettings)) {
    const legacyChat = sanitizeChatSettingsFromRaw(legacyState.chatSettings);
    if (legacyChat && hasMeaningfulChatConfig(legacyChat)) {
      migrationPatch.chatSettings = legacyChat;
    }
  }

  // 3. Migrate gistAuth (enabled, token, autoSync) from legacy gistSyncSettings when absent in user_settings
  if (existingRaw.gistAuth === undefined && isPlainObject(legacyState.gistSyncSettings)) {
    const legacyAuth = sanitizeGistAuthFromRaw(legacyState.gistSyncSettings);
    if (legacyAuth && hasMeaningfulGistAuth(legacyAuth)) {
      migrationPatch.gistAuth = legacyAuth;
    }
  }

  if (Object.keys(migrationPatch).length > 0) {
    writeUserSettingsPatch(migrationPatch);
    return {
      ...currentSettings,
      ...migrationPatch,
    };
  }

  return currentSettings;
}

/**
 * Queues a merge-on-write removal of `user_settings.lastCompleted` when it belongs
 * to the given `siteSlug`, leaving other books' completion pointers and all other
 * shared settings intact.
 */
export function clearLastCompletedForSite(siteSlug: string): void {
  if (userSettingsWritesSuppressed || !siteSlug.trim()) return;
  const targetSlug = siteSlug.trim();

  userSettingsWriteQueue = userSettingsWriteQueue
    .then(() => {
      if (userSettingsWritesSuppressed || typeof localStorage === 'undefined') return;
      try {
        const existingRaw = readRawUserSettings();
        if (
          !isPlainObject(existingRaw.lastCompleted) ||
          existingRaw.lastCompleted.siteSlug !== targetSlug
        ) {
          return;
        }
        const merged: Record<string, unknown> = { ...existingRaw };
        delete merged.lastCompleted;
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(merged));
      } catch (err) {
        console.warn('[user_settings] Failed to clear lastCompleted:', err);
      }
    })
    .catch((err) => {
      console.warn('[user_settings] Error during queued clear:', err);
    });
}

/**
 * Suppresses subsequent writes to `user_settings` and removes it from localStorage.
 * Used when the user explicitly opts in to clearing shared settings.
 */
export function clearUserSettingsStorage(): void {
  userSettingsWritesSuppressed = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_SETTINGS_KEY);
    }
  } catch {
    // Non-fatal if localStorage is disabled
  }
}

export function flushUserSettingsStorage(): Promise<void> {
  return userSettingsWriteQueue;
}

export function withoutUserSettingsPersist<T>(fn: () => T): T {
  suppressStoreSyncDepth += 1;
  try {
    return fn();
  } finally {
    suppressStoreSyncDepth -= 1;
  }
}

export function isUserSettingsPersistSuppressed(): boolean {
  return suppressStoreSyncDepth > 0;
}
