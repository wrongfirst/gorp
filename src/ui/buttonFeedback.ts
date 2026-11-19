import { ICONS } from './icons';
import { showPopup } from './popup';

export interface ToolbarButtonFeedbackConfig {
    defaultIcon: string;
    successMessage: string;
    duration?: number;
    action: () => boolean | Promise<boolean>;
    emptyOrErrorMessage?: string;
}

/**
 * Binds a standard feedback lifecycle to a toolbar action button:
 * - Initializes the button icon
 * - Executes the action callback on click
 * - On success: temporarily swaps icon to checkmark, shows toast popup, and restores icon after duration
 * - On failure: shows the optional error toast
 */
export function setupToolbarActionButton(
    btn: HTMLButtonElement,
    config: ToolbarButtonFeedbackConfig
): void {
    btn.innerHTML = config.defaultIcon;
    let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

    btn.addEventListener('click', async () => {
        const success = await config.action();
        if (success) {
            if (feedbackTimeout) {
                clearTimeout(feedbackTimeout);
            }
            btn.innerHTML = ICONS.CHECK;
            showPopup(config.successMessage);

            feedbackTimeout = setTimeout(() => {
                btn.innerHTML = config.defaultIcon;
                feedbackTimeout = null;
            }, config.duration ?? 1500);
        } else if (config.emptyOrErrorMessage) {
            showPopup(config.emptyOrErrorMessage);
        }
    });
}
