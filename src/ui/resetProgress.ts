import { elements } from '../core/elements';
import { store } from '../core/store';
import { flushPersistedStorage } from '../core/store/storage/encryptedStorage';
import { flushUserSettingsStorage } from '../core/store/storage/userSettingsStorage';
import { SITE_TITLE } from '../core/siteConfig';
import { abortAllStreams } from './chatPanel';
import { pushToGist } from '../core/sync/syncManager';
import { Effect } from 'effect';
import { createModal, type ModalController } from './modal';

export interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
}

let pendingConfirmCallback: (() => void | Promise<void>) | null = null;
let confirmModal: ModalController | null = null;

function initResetProgress() {
    if (confirmModal) return;

    confirmModal = createModal({
        modal: elements.resetProgress.modal,
        closeBtn: elements.resetProgress.closeBtn,
        onClose: () => {
            pendingConfirmCallback = null;
        },
    });

    elements.resetProgress.cancelBtn?.addEventListener('click', () => confirmModal?.close());

    elements.resetProgress.confirmBtn?.addEventListener('click', async () => {
        const callback = pendingConfirmCallback;
        confirmModal?.close();
        if (callback) {
            await callback();
        }
    });
}

export function openResetProgressDialog() {
    showConfirmDialog({
        title: `Reset Progress (${SITE_TITLE})`,
        message: `Are you sure you want to reset all progress for ${SITE_TITLE}? This will delete your saved code, chat history, and completion status for exercises in this book only. Your shared settings (Vim mode, Rubber Duck, GitHub account) and other books will not be affected. This action cannot be undone.`,
        confirmText: 'Reset Book Progress',
        onConfirm: async () => {
            abortAllStreams();
            store.getState().resetProgress();

            const { gistSyncSettings } = store.getState();
            if (gistSyncSettings?.enabled && gistSyncSettings?.gistId && gistSyncSettings?.token) {
                await Effect.runPromise(pushToGist().pipe(Effect.ignoreLogged));
            }

            await Promise.all([flushPersistedStorage(), flushUserSettingsStorage()]);
            window.location.reload();
        },
    });
}

export function showConfirmDialog(options: ConfirmDialogOptions) {
    initResetProgress();
    if (elements.resetProgress.title) {
        elements.resetProgress.title.textContent = options.title || 'Confirm Action';
    }
    if (elements.resetProgress.desc) {
        elements.resetProgress.desc.textContent = options.message;
    }
    if (elements.resetProgress.confirmBtn) {
        elements.resetProgress.confirmBtn.textContent = options.confirmText || 'Confirm';
    }

    pendingConfirmCallback = options.onConfirm;
    confirmModal?.open();
}

