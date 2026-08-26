// src/core/store/storage/encryptedStorage.ts
import { StateStorage } from 'zustand/middleware';
import { encryptSecret } from '../../crypto';
import { ChatEndpoint } from '../../types';

let writeQueue: Promise<void> = Promise.resolve();

async function processWrite(name: string, value: string): Promise<void> {
  try {
    const parsed = JSON.parse(value);
    const hasChatSettings = Boolean(parsed?.state?.chatSettings);
    const hasSyncSettings = Boolean(parsed?.state?.gistSyncSettings);

    if (hasChatSettings || hasSyncSettings) {
      if (hasChatSettings) {
        const cs = { ...parsed.state.chatSettings };
        if (cs.apiKey) {
          cs.apiKey = await encryptSecret(cs.apiKey);
        }
        if (Array.isArray(cs.endpoints)) {
          cs.endpoints = await Promise.all(
            cs.endpoints.map(async (ep: ChatEndpoint) => ({
              ...ep,
              apiKey: ep.apiKey ? await encryptSecret(ep.apiKey) : '',
            }))
          );
        }
        parsed.state.chatSettings = cs;
      }

      if (hasSyncSettings) {
        const ss = { ...parsed.state.gistSyncSettings };
        if (ss.token) {
          ss.token = await encryptSecret(ss.token);
        }
        parsed.state.gistSyncSettings = ss;
      }

      localStorage.setItem(name, JSON.stringify(parsed));
      return;
    }

    localStorage.setItem(name, value);
  } catch {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Non-fatal if localStorage is full or disabled
    }
  }
}

export const syncStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name);
  },

  setItem: (name: string, value: string): void => {
    // Chain writes sequentially to prevent out-of-order execution / race conditions
    writeQueue = writeQueue
      .then(() => processWrite(name, value))
      .catch((err) => {
        console.warn('[storage] Error during queued storage write:', err);
      });
  },

  removeItem: (name: string): void => {
    writeQueue = writeQueue
      .then(() => {
        localStorage.removeItem(name);
      })
      .catch((err) => {
        console.warn('[storage] Error during queued storage removal:', err);
      });
  },
};

