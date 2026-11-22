const mdMediaQuery = window.matchMedia('(min-width: 768px)');

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

    // Clear inline desktop drag overrides when transitioning to single-pane mobile layout
    mdMediaQuery.addEventListener('change', (e) => {
        if (!e.matches) {
            if (direction === 'horizontal') {
                targetPane.style.width = '';
            } else {
                targetPane.style.height = '';
            }
            targetPane.style.flex = '';
        }
    });

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
            // min width 240px, max width 75% of workspace container; store as % so viewport resizes scale proportionally
            const containerWidth = targetPane.parentElement?.offsetWidth || window.innerWidth;
            if (newSize > 240 && newSize < containerWidth * 0.75) {
                const pct = (newSize / containerWidth) * 100;
                targetPane.style.width = `${pct.toFixed(2)}%`;
                targetPane.style.flex = 'none';
            }
        } else {
            // min height 100px, max height 80% of container
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
