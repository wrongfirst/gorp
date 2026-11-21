import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppState,
  GistSyncSettings,
  PersistedInstanceState,
  UserSettings,
  defaultChatSettings,
  defaultGistAuthSettings,
} from './types';
import { createExerciseSlice } from './store/slices/exerciseSlice';
import { createChatSlice } from './store/slices/chatSlice';
import { createSettingsSlice } from './store/slices/settingsSlice';
import { createSyncSlice } from './store/slices/syncSlice';
import { getInitialProgressState, sanitizeBackupData } from './store/backup';
import { sanitizeLessons } from './backup/modules/lessonsModule';
import { sanitizeConversations } from './backup/modules/conversationsModule';
import { syncStateStorage } from './store/storage/encryptedStorage';
import {
  USER_SETTINGS_KEY,
  isUserSettingsPersistSuppressed,
  migrateLegacySettingsToUserSettings,
  writeUserSettingsPatch,
} from './store/storage/userSettingsStorage';
import {
  decryptStoredSettings,
  ensureSettingsDecrypted,
  registerDecryptionStore,
} from './store/storage/decryptSettings';
import { SITE_SLUG } from './siteConfig';
import {
  exercises,
  getExerciseDisplayTitle,
  isValidExerciseId,
} from '../exercises/exercise-registry';
import { defaultLanguageId, enabledLanguageIds } from '../languages/language-registry';

export const STORAGE_KEY = `${SITE_SLUG}_storage`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSupportedLanguage(langId: unknown): langId is string {
  if (typeof langId !== 'string' || !langId.trim()) return false;
  if (enabledLanguageIds.length === 0) return true;
  return enabledLanguageIds.includes(langId.trim());
}

function resolveInitialLanguageId(
  rawPersisted: Record<string, unknown> | undefined,
  preferredLanguage: string | undefined
): string {
  const savedLang = rawPersisted?.currentLanguageId ?? rawPersisted?.activeLanguageId;
  if (isSupportedLanguage(savedLang)) {
    return savedLang.trim();
  }
  if (isSupportedLanguage(preferredLanguage)) {
    return preferredLanguage.trim();
  }
  return defaultLanguageId;
}

function resolveLocalGistSync(
  rawPersisted: Record<string, unknown> | undefined
): { gistId: string; lastSyncedAt?: number } {
  const rawLocal = isRecord(rawPersisted?.gistSync)
    ? rawPersisted.gistSync
    : isRecord(rawPersisted?.gistSyncSettings)
      ? rawPersisted.gistSyncSettings
      : undefined;

  const gistId = typeof rawLocal?.gistId === 'string' ? rawLocal.gistId.trim() : '';
  const lastSyncedAt =
    typeof rawLocal?.lastSyncedAt === 'number' && Number.isFinite(rawLocal.lastSyncedAt)
      ? rawLocal.lastSyncedAt
      : undefined;

  return {
    gistId,
    ...(lastSyncedAt !== undefined ? { lastSyncedAt } : {}),
  };
}

export const store = createStore<AppState>()(
  persist(
    (set, get, api) => ({
      ...createExerciseSlice(set, get, api),
      ...createChatSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createSyncSlice(set, get, api),

      resetProgress: () => {
        set(getInitialProgressState());
      },

      restoreBackup: (backupState) => {
        set(sanitizeBackupData(backupState, get()));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage<PersistedInstanceState>(() => syncStateStorage),
      partialize: (state): PersistedInstanceState => ({
        activeLessonSlug: state.activeLessonSlug,
        activeLessonTitle: state.activeLessonTitle,
        exerciseCount: state.exerciseCount,
        currentLanguageId: state.currentLanguageId,
        completedSlugs: state.completedSlugs,
        userCode: state.userCode,
        userCodeTimestamps: state.userCodeTimestamps,
        chatConversations: state.chatConversations,
        activeConversationId: state.activeConversationId,
        gistSync: {
          gistId: state.gistSyncSettings?.gistId || '',
          ...(typeof state.gistSyncSettings?.lastSyncedAt === 'number'
            ? { lastSyncedAt: state.gistSyncSettings.lastSyncedAt }
            : {}),
        },
      }),
      merge: (persistedState, currentState): AppState => {
        const rawPersisted = isRecord(persistedState) ? persistedState : undefined;

        // One-time startup migration of legacy shared fields from ${SITE_SLUG}_storage -> user_settings
        const shared = migrateLegacySettingsToUserSettings(rawPersisted);

        const lessonsPart = rawPersisted ? sanitizeLessons(rawPersisted, currentState) : {};
        const convsPart = rawPersisted ? sanitizeConversations(rawPersisted, currentState) : {};

        const activeLessonSlug =
          lessonsPart.activeLessonSlug && isValidExerciseId(lessonsPart.activeLessonSlug)
            ? lessonsPart.activeLessonSlug
            : currentState.activeLessonSlug || exercises[0]?.id || '';
        const activeLessonTitle = activeLessonSlug ? getExerciseDisplayTitle(activeLessonSlug) : '';
        const currentLanguageId = resolveInitialLanguageId(rawPersisted, shared.preferredLanguage);

        const gistAuth = shared.gistAuth || defaultGistAuthSettings;
        const localGist = resolveLocalGistSync(rawPersisted);
        const gistSyncSettings: GistSyncSettings = {
          enabled: gistAuth.enabled,
          token: gistAuth.token,
          autoSync: gistAuth.autoSync,
          gistId: localGist.gistId,
          ...(localGist.lastSyncedAt !== undefined ? { lastSyncedAt: localGist.lastSyncedAt } : {}),
        };

        return {
          ...currentState,
          ...lessonsPart,
          ...convsPart,
          activeLessonSlug,
          activeLessonTitle,
          exerciseCount: exercises.length,
          currentLanguageId,
          vimMode: typeof shared.vimMode === 'boolean' ? shared.vimMode : currentState.vimMode,
          chatSettings: shared.chatSettings || currentState.chatSettings || defaultChatSettings,
          preferredLanguage: shared.preferredLanguage,
          lastVisited: shared.lastVisited,
          gistSyncSettings,
        };
      },
    }
  )
);

// Persist shared user_settings slices via merge-on-write whenever they change in the store
store.subscribe((state, prevState) => {
  if (isUserSettingsPersistSuppressed()) return;

  const patch: Partial<UserSettings> = {};

  if (state.vimMode !== prevState.vimMode) {
    patch.vimMode = state.vimMode;
  }

  if (state.preferredLanguage !== prevState.preferredLanguage && state.preferredLanguage) {
    patch.preferredLanguage = state.preferredLanguage;
  }

  if (state.chatSettings !== prevState.chatSettings) {
    patch.chatSettings = state.chatSettings;
  }

  const prevSync = prevState.gistSyncSettings;
  const nextSync = state.gistSyncSettings;
  if (
    nextSync &&
    (!prevSync ||
      nextSync.enabled !== prevSync.enabled ||
      nextSync.token !== prevSync.token ||
      nextSync.autoSync !== prevSync.autoSync)
  ) {
    patch.gistAuth = {
      enabled: nextSync.enabled,
      token: nextSync.token,
      autoSync: nextSync.autoSync,
    };
  }

  if (state.lastVisited !== prevState.lastVisited && state.lastVisited) {
    patch.lastVisited = state.lastVisited;
  }

  if (Object.keys(patch).length > 0) {
    writeUserSettingsPatch(patch);
  }
});

registerDecryptionStore(store);

// Ensure exerciseCount, activeLessonTitle, and shared lastVisited are persisted on boot
const initialHashSlug =
  typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
const resolvedInitialSlug =
  initialHashSlug && isValidExerciseId(initialHashSlug)
    ? initialHashSlug
    : store.getState().activeLessonSlug;
if (resolvedInitialSlug && isValidExerciseId(resolvedInitialSlug)) {
  store.getState().recordLessonVisit(resolvedInitialSlug);
}

export * from './types';
export { USER_SETTINGS_KEY, decryptStoredSettings, ensureSettingsDecrypted };
