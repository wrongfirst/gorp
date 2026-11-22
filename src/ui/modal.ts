import { ICONS } from './icons';

export interface ModalOptions {
    modal: HTMLElement | null;
    closeBtn?: HTMLButtonElement | null;
    canClose?: () => boolean;
    restoreFocus?: boolean;
    fallbackFocus?: () => void;
    onOpen?: () => void;
    onClose?: () => void;
}

export interface ModalController {
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
}

interface ActiveModalEntry {
    controller: ModalController;
    canClose: () => boolean;
}

const openStack: ActiveModalEntry[] = [];
let isEscapeListenerBound = false;

function ensureEscapeListener(): void {
    if (isEscapeListenerBound) return;
    isEscapeListenerBound = true;

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || openStack.length === 0) return;
        const top = openStack[openStack.length - 1];
        if (top && top.canClose()) {
            e.preventDefault();
            top.controller.close();
        }
    });
}

export function closeAllModals(except?: ModalController): void {
    for (let i = openStack.length - 1; i >= 0; i--) {
        const entry = openStack[i];
        if (entry && entry.controller !== except && entry.canClose()) {
            entry.controller.close();
        }
    }
}

export function createModal(options: ModalOptions): ModalController {
    const { modal, closeBtn, canClose, restoreFocus, fallbackFocus, onOpen, onClose } = options;
    const checkCanClose = canClose ?? (() => true);

    let open = false;
    let isMouseDownOnBackdrop = false;
    let previouslyFocused: HTMLElement | null = null;

    ensureEscapeListener();

    const controller: ModalController = {
        open() {
            if (!modal || open) return;
            if (restoreFocus) {
                previouslyFocused = document.activeElement as HTMLElement | null;
            }
            open = true;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            openStack.push(entry);
            onOpen?.();
        },
        close() {
            if (!modal || !open || !checkCanClose()) return;
            open = false;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            const idx = openStack.indexOf(entry);
            if (idx !== -1) openStack.splice(idx, 1);
            onClose?.();

            if (restoreFocus) {
                if (
                    previouslyFocused &&
                    typeof previouslyFocused.focus === 'function' &&
                    document.body.contains(previouslyFocused)
                ) {
                    previouslyFocused.focus();
                } else {
                    fallbackFocus?.();
                }
                previouslyFocused = null;
            }
        },
        toggle() {
            if (open) {
                controller.close();
            } else {
                controller.open();
            }
        },
        isOpen() {
            return open;
        },
    };

    const entry: ActiveModalEntry = {
        controller,
        canClose: checkCanClose,
    };

    if (closeBtn) {
        closeBtn.innerHTML = ICONS.CLOSE;
        closeBtn.addEventListener('click', () => controller.close());
    }

    modal?.addEventListener('mousedown', (e) => {
        isMouseDownOnBackdrop = e.target === modal;
    });

    modal?.addEventListener('click', (e) => {
        if (isMouseDownOnBackdrop && e.target === modal) {
            controller.close();
        }
        isMouseDownOnBackdrop = false;
    });

    return controller;
}
