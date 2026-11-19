import { ICONS } from './icons';
import { setupToolbarActionButton } from './buttonFeedback';

/**
 * Initializes the format button in the editor toolbar.
 * Re-indents the active editor code using CodeMirror syntax tree indentation,
 * temporarily swaps the button icon to a checkmark for visual confirmation,
 * and displays a brief toast notification.
 */
export function setupFormatCodeButton(
    btn: HTMLButtonElement,
    formatCodeFn: () => boolean
): void {
    setupToolbarActionButton(btn, {
        defaultIcon: ICONS.FORMAT,
        successMessage: 'Code formatted',
        emptyOrErrorMessage: 'Nothing to format',
        duration: 1500,
        action: () => formatCodeFn(),
    });
}
