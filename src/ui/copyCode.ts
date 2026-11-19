import { copyToClipboardSafe } from '../core/clipboard';
import { ICONS } from './icons';
import { showPopup } from './popup';
import { setupToolbarActionButton } from './buttonFeedback';

/**
 * Initializes the copy button in the editor toolbar.
 * Copies the current editor code safely to the user's clipboard,
 * temporarily swaps the button icon to a checkmark for visual feedback,
 * and displays a brief toast notification.
 */
export function setupCopyCodeButton(
    btn: HTMLButtonElement,
    getCodeFn: () => string
): void {
    setupToolbarActionButton(btn, {
        defaultIcon: ICONS.COPY,
        successMessage: 'Code copied to clipboard!',
        emptyOrErrorMessage: 'No code to copy',
        duration: 2000,
        action: async () => {
            const code = getCodeFn();
            if (!code || !code.trim()) {
                return false;
            }
            const success = await copyToClipboardSafe(code);
            if (!success) {
                showPopup('Failed to copy code');
                return false;
            }
            return true;
        },
    });
}
