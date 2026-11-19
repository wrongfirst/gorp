export function initTabs(
    tabProblem: HTMLElement | null,
    tabCode: HTMLElement | null,
    problemPanel: HTMLElement | null,
    editorOutputPanel: HTMLElement | null
) {
    if (!tabProblem || !tabCode || !problemPanel || !editorOutputPanel) return (t: 'problem' | 'code') => { };

    function switchTab(tab: 'problem' | 'code') {
        if (tab === 'problem') {
            problemPanel!.classList.remove('hidden');
            problemPanel!.classList.add('flex');
            editorOutputPanel!.classList.add('hidden');
            editorOutputPanel!.classList.remove('flex');

            tabProblem!.classList.add('text-fg-primary', 'border-brand');
            tabProblem!.classList.remove('text-fg-muted', 'border-transparent');
            tabCode!.classList.add('text-fg-muted', 'border-transparent');
            tabCode!.classList.remove('text-fg-primary', 'border-brand');
        } else {
            problemPanel!.classList.add('hidden');
            problemPanel!.classList.remove('flex');
            editorOutputPanel!.classList.remove('hidden');
            editorOutputPanel!.classList.add('flex');

            tabCode!.classList.add('text-fg-primary', 'border-brand');
            tabCode!.classList.remove('text-fg-muted', 'border-transparent');
            tabProblem!.classList.add('text-fg-muted', 'border-transparent');
            tabProblem!.classList.remove('text-fg-primary', 'border-brand');
        }
    }

    tabProblem.addEventListener('click', () => switchTab('problem'));
    tabCode.addEventListener('click', () => switchTab('code'));

    return switchTab;
}
