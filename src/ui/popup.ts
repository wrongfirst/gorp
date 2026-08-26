export function showPopup(text: string, duration: number = 1000) {
    const popup = document.createElement('div');
    popup.className = 'fixed bottom-4 right-4 bg-fg-primary text-bg-app px-4 py-2 rounded shadow-lg text-xs font-bold z-50';
    popup.textContent = text;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), duration);
}
