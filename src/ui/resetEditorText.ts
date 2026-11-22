export function resetEditorText(btn: HTMLButtonElement, originalIcon: string, onConfirm: () => void) {
    let confirmTimeout: ReturnType<typeof setTimeout> | null = null;

    const restore = () => {
        btn.classList.remove('w-auto', 'px-2');
        btn.innerHTML = originalIcon;
    };

    restore();

    btn.addEventListener('click', () => {
        if (confirmTimeout) {
            //confirmed
            clearTimeout(confirmTimeout);
            confirmTimeout = null;
            restore();
            onConfirm();
        } else {
            //first click
            btn.classList.add('w-auto', 'px-2');
            btn.innerHTML = `<span class="text-xs font-semibold normal-case tracking-normal whitespace-nowrap text-fg-primary">Discard changes? Click to confirm.</span>`;

            confirmTimeout = setTimeout(() => {
                confirmTimeout = null;
                restore();
            }, 5000);
        }
    });
}
