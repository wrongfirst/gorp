let activePopup: HTMLElement | null = null;
let activePopupTimeout: ReturnType<typeof setTimeout> | null = null;

export function showPopup(text: string, duration: number = 1000) {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
    if (activePopupTimeout) {
        clearTimeout(activePopupTimeout);
        activePopupTimeout = null;
    }

    const popup = document.createElement('div');
    popup.className = 'fixed bottom-[calc(var(--bar-primary-mobile-h)+0.75rem+env(safe-area-inset-bottom))] md:bottom-[calc(var(--bar-tertiary-h)+0.75rem)] right-[var(--gutter-edge)] bg-fg-primary text-bg-app px-4 py-2 rounded shadow-lg text-xs font-bold z-70';
    popup.textContent = text;
    document.body.appendChild(popup);
    activePopup = popup;

    activePopupTimeout = setTimeout(() => {
        popup.remove();
        if (activePopup === popup) {
            activePopup = null;
        }
        activePopupTimeout = null;
    }, duration);
}

