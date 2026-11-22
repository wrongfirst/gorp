import type { GistSyncSettings } from '../types';

export function scheduleAutoPush(gistSyncSettings?: GistSyncSettings, delayMs = 5000): void {
  if (!gistSyncSettings?.enabled || !gistSyncSettings?.autoSync || !gistSyncSettings?.token) {
    return;
  }
  void import('./syncManager').then((m) => m.scheduleAutoPush(delayMs));
}

export function triggerImmediatePush(gistSyncSettings?: GistSyncSettings): void {
  if (!gistSyncSettings?.enabled || !gistSyncSettings?.token) {
    return;
  }
  void import('./syncManager').then((m) => m.triggerImmediatePush());
}
