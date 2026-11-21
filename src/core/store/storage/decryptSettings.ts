// src/core/store/storage/decryptSettings.ts
import { StoreApi } from 'zustand/vanilla';
import { decryptSecret } from '../../crypto';
import { AppState, ChatEndpoint } from '../../types';
import { withoutUserSettingsPersist } from './userSettingsStorage';

type DecryptStoreTarget = StoreApi<AppState> | { getState: () => AppState };

let decryptionPromise: Promise<void> | null = null;
let defaultStoreApi: DecryptStoreTarget | null = null;

function hasSetState(target: DecryptStoreTarget): target is StoreApi<AppState> {
  return 'setState' in target && typeof target.setState === 'function';
}

function hasEncryptedSecrets(state: AppState): boolean {
  if (state.gistSyncSettings?.token?.startsWith('enc:v1:')) {
    return true;
  }
  if (state.chatSettings?.apiKey?.startsWith('enc:v1:')) {
    return true;
  }
  if (Array.isArray(state.chatSettings?.endpoints)) {
    return state.chatSettings.endpoints.some((ep) => Boolean(ep?.apiKey?.startsWith('enc:v1:')));
  }
  return false;
}

export function registerDecryptionStore(storeApi: DecryptStoreTarget): void {
  defaultStoreApi = storeApi;
}

export function ensureSettingsDecrypted(storeApi?: DecryptStoreTarget): Promise<void> {
  if (decryptionPromise) {
    return decryptionPromise;
  }
  const target = storeApi || defaultStoreApi;
  if (target) {
    return decryptStoredSettings(target);
  }
  decryptionPromise = (async () => {
    const { store } = await import('../../store');
    await decryptStoredSettings(store);
  })().finally(() => {
    decryptionPromise = null;
  });
  return decryptionPromise;
}

export async function decryptStoredSettings(storeApi: DecryptStoreTarget): Promise<void> {
  if (decryptionPromise) {
    return decryptionPromise;
  }

  if (!hasEncryptedSecrets(storeApi.getState())) {
    return;
  }

  decryptionPromise = (async () => {
    const snapshot = storeApi.getState();

    // 1. Decrypt shared Chat Settings (apiKey + endpoints[].apiKey)
    const originalChat = snapshot.chatSettings;
    let decryptedApiKey: string | undefined;
    const originalApiKey = originalChat?.apiKey;
    const decryptedEndpointMap = new Map<string, { original: string; decrypted: string }>();

    if (originalChat) {
      if (originalApiKey && originalApiKey.startsWith('enc:v1:')) {
        decryptedApiKey = await decryptSecret(originalApiKey);
      }

      if (Array.isArray(originalChat.endpoints)) {
        await Promise.all(
          originalChat.endpoints.map(async (ep: ChatEndpoint) => {
            if (ep.apiKey && ep.apiKey.startsWith('enc:v1:')) {
              const plain = await decryptSecret(ep.apiKey);
              decryptedEndpointMap.set(ep.id, { original: ep.apiKey, decrypted: plain });
            }
          })
        );
      }
    }

    // 2. Decrypt shared Gist Auth Token (user_settings.gistAuth.token)
    const originalToken = snapshot.gistSyncSettings?.token;
    let decryptedToken: string | undefined;
    if (originalToken && originalToken.startsWith('enc:v1:')) {
      decryptedToken = await decryptSecret(originalToken);
    }

    // 3. Apply decrypted secrets back to store without triggering auto-push or redundant user_settings writes.
    //    Re-read latest state so concurrent user edits during async decryption are never clobbered.
    const latest = storeApi.getState();
    const statePatch: Partial<AppState> = {};

    if (originalChat && (decryptedApiKey !== undefined || decryptedEndpointMap.size > 0)) {
      const latestChat = latest.chatSettings;
      if (latestChat) {
        let chatChanged = false;
        let nextApiKey = latestChat.apiKey;
        if (decryptedApiKey !== undefined && latestChat.apiKey === originalApiKey) {
          nextApiKey = decryptedApiKey;
          chatChanged = true;
        }

        const nextEndpoints = Array.isArray(latestChat.endpoints)
          ? latestChat.endpoints.map((ep) => {
              const entry = decryptedEndpointMap.get(ep.id);
              if (entry && ep.apiKey === entry.original) {
                chatChanged = true;
                return { ...ep, apiKey: entry.decrypted };
              }
              return ep;
            })
          : latestChat.endpoints;

        if (chatChanged) {
          statePatch.chatSettings = {
            ...latestChat,
            apiKey: nextApiKey,
            endpoints: nextEndpoints,
          };
        }
      }
    }

    if (decryptedToken !== undefined && latest.gistSyncSettings?.token === originalToken) {
      statePatch.gistSyncSettings = {
        ...latest.gistSyncSettings,
        token: decryptedToken,
      };
    }

    if (Object.keys(statePatch).length > 0) {
      withoutUserSettingsPersist(() => {
        if (hasSetState(storeApi)) {
          storeApi.setState(statePatch);
        } else {
          if (statePatch.chatSettings) {
            storeApi.getState().setChatSettings({
              apiKey: statePatch.chatSettings.apiKey,
              endpoints: statePatch.chatSettings.endpoints,
            });
          }
          if (statePatch.gistSyncSettings) {
            storeApi.getState().setGistSyncSettings({
              token: statePatch.gistSyncSettings.token,
            });
          }
        }
      });
    }
  })().finally(() => {
    decryptionPromise = null;
  });

  return decryptionPromise;
}
