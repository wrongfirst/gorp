export function setupResize(
    handle: HTMLElement,
    targetPane: HTMLElement,
    direction: 'horizontal' | 'vertical',
    isReversed: boolean = false
) {
    if (!handle || !targetPane) return;

    let isDragging = false;
    let startVal = 0;
    let startSize = 0;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.classList.add('resizing');
        startVal = direction === 'horizontal' ? e.clientX : e.clientY;
        startSize = direction === 'horizontal' ? targetPane.offsetWidth : targetPane.offsetHeight;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        handle.classList.add('bg-brand');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const currentVal = direction === 'horizontal' ? e.clientX : e.clientY;
        const delta = isReversed ? startVal - currentVal : currentVal - startVal;
        const newSize = startSize + delta;

        if (direction === 'horizontal') {
            //min width 200px, max width 70% of screen
            if (newSize > 200 && newSize < window.innerWidth * 0.7) {
                targetPane.style.width = `${newSize}px`;
                targetPane.style.flex = 'none';
            }
        } else {
            //min height 100px, max height 80% of container
            const containerHeight = targetPane.parentElement?.offsetHeight || window.innerHeight;
            if (newSize > 100 && newSize < containerHeight * 0.8) {
                targetPane.style.height = `${newSize}px`;
                targetPane.style.flex = 'none';
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.classList.remove('resizing');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            handle.classList.remove('bg-brand');
        }
    });
}
