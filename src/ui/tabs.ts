export function initTabs(
    tabProblem: HTMLElement | null,
    tabCode: HTMLElement | null,
    problemPanel: HTMLElement | null,
    editorOutputPanel: HTMLElement | null
) {
    if (!tabProblem || !tabCode || !problemPanel || !editorOutputPanel) {
        throw new Error('Required tab elements are missing from the DOM');
    }

    const problemTab = tabProblem;
    const codeTab = tabCode;
    const problemPane = problemPanel;
    const editorPane = editorOutputPanel;

    function switchTab(tab: 'problem' | 'code') {
        const isProblem = tab === 'problem';

        problemPane.classList.toggle('hidden', !isProblem);
        problemPane.classList.toggle('flex', isProblem);
        editorPane.classList.toggle('hidden', isProblem);
        editorPane.classList.toggle('flex', !isProblem);

        problemTab.classList.toggle('text-fg-primary', isProblem);
        problemTab.classList.toggle('border-brand', isProblem);
        problemTab.classList.toggle('text-fg-muted', !isProblem);
        problemTab.classList.toggle('border-transparent', !isProblem);

        codeTab.classList.toggle('text-fg-primary', !isProblem);
        codeTab.classList.toggle('border-brand', !isProblem);
        codeTab.classList.toggle('text-fg-muted', isProblem);
        codeTab.classList.toggle('border-transparent', isProblem);
    }

    problemTab.addEventListener('click', () => switchTab('problem'));
    codeTab.addEventListener('click', () => switchTab('code'));

    return switchTab;
}
