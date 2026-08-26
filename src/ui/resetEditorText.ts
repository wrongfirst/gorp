export function resetEditorText(btn: HTMLButtonElement, originalIcon: string, onConfirm: () => void) {
    let confirmTimeout: ReturnType<typeof setTimeout> | null = null;

    btn.innerHTML = originalIcon;

    btn.addEventListener('click', () => {
        if (confirmTimeout) {
            //confirmed
            clearTimeout(confirmTimeout);
            confirmTimeout = null;
            btn.innerHTML = originalIcon;
            onConfirm();
        } else {
            //first click
            btn.innerHTML = `<span class="text-xs font-bold tracking-wider">Discard changes? Click to confirm.</span>`;

            confirmTimeout = setTimeout(() => {
                confirmTimeout = null;
                btn.innerHTML = originalIcon;
            }, 5000);
        }
    });
}
