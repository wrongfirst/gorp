// src/core/store/storage/encryptedStorage.ts
import { StateStorage } from 'zustand/middleware';
import { encryptSecret } from '../../crypto';
import { ChatEndpoint } from '../../types';

let writeQueue: Promise<void> = Promise.resolve();
let writesSuppressed = false;

export function clearPersistedStorage(name: string): void {
  writesSuppressed = true;
  localStorage.removeItem(name);
}

export function flushPersistedStorage(): Promise<void> {
  return writeQueue;
}

async function encryptIfNeeded(secret: string): Promise<string> {
  if (!secret) return '';
  if (secret.startsWith('enc:v1:')) return secret;
  return encryptSecret(secret);
}

async function processWrite(name: string, value: string): Promise<void> {
  if (writesSuppressed) return;
  try {
    const parsed = JSON.parse(value);
    const hasChatSettings = Boolean(parsed?.state?.chatSettings);
    const hasSyncSettings = Boolean(parsed?.state?.gistSyncSettings);

    if (hasChatSettings || hasSyncSettings) {
      if (hasChatSettings) {
        const cs = { ...parsed.state.chatSettings };
        if (cs.apiKey) {
          cs.apiKey = await encryptIfNeeded(cs.apiKey);
        }
        if (Array.isArray(cs.endpoints)) {
          cs.endpoints = await Promise.all(
            cs.endpoints.map(async (ep: ChatEndpoint) => ({
              ...ep,
              apiKey: ep.apiKey ? await encryptIfNeeded(ep.apiKey) : '',
            }))
          );
        }
        parsed.state.chatSettings = cs;
      }

      if (hasSyncSettings) {
        const ss = { ...parsed.state.gistSyncSettings };
        if (ss.token) {
          ss.token = await encryptIfNeeded(ss.token);
        }
        parsed.state.gistSyncSettings = ss;
      }

      if (writesSuppressed) return;
      localStorage.setItem(name, JSON.stringify(parsed));
      return;
    }

    if (writesSuppressed) return;
    localStorage.setItem(name, value);
  } catch {
    if (writesSuppressed) return;
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
    if (writesSuppressed) return;
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

