import { store } from '../core/store';
import { getEnabledLanguages } from '../languages/language-registry';
import { Exercise } from '../core/types';
import { elements } from '../core/elements';
import { ICONS } from './icons';

export function renderLanguageSelector(container: HTMLElement, currentExercise: Exercise | undefined) {
    if (!container) return;

    const enabledLanguages = getEnabledLanguages();
    const editorTitle = elements.editorTitle;

    // If only 1 or 0 languages enabled site-wide, show "Editor" text and hide selector
    if (enabledLanguages.length <= 1) {
        if (editorTitle) {
            editorTitle.classList.remove('hidden');
        }
        container.innerHTML = '';
        return;
    }

    // Keep "Editor" text hidden when multiple languages are enabled
    if (editorTitle) {
        editorTitle.classList.add('hidden');
    }

    const { currentLanguageId } = store.getState();

    // Check which languages are available for the current exercise
    const availableLanguages = enabledLanguages.map(lang => {
        let isAvailable = true;
        if (currentExercise?.variants) {
            isAvailable = lang.id in currentExercise.variants;
        }
        return {
            ...lang,
            isAvailable
        };
    });

    // Fallback logic: if current selected language is not available in current exercise, switch to first available
    // without overwriting the user's cross-book preferredLanguage.
    const activeIsAvailable = availableLanguages.find(l => l.id === currentLanguageId && l.isAvailable);
    if (!activeIsAvailable) {
        const fallback = availableLanguages.find(l => l.isAvailable);
        if (fallback && fallback.id !== currentLanguageId) {
            setTimeout(() => {
                store.getState().setLanguage(fallback.id, { updatePreference: false });
            }, 0);
        }
    }

    // Build styled dropdown HTML
    const optionsHtml = availableLanguages.map(lang => {
        const selected = lang.id === currentLanguageId ? 'selected' : '';
        const disabled = !lang.isAvailable ? 'disabled' : '';
        const label = lang.isAvailable ? lang.name : `${lang.name} (N/A)`;
        return `<option value="${lang.id}" ${selected} ${disabled} class="bg-bg-surface text-fg-primary">${label}</option>`;
    }).join('');

    container.innerHTML = `
        <div class="relative inline-flex items-center group">
            <select id="language-select-dropdown" aria-label="Select Language"
                class="appearance-none bg-transparent border-0 h-[var(--ctrl-md)] text-fg-muted group-hover:text-fg-primary text-xs font-medium pl-2 pr-6 rounded hover:bg-bg-app/50 focus:outline-none focus:ring-0 cursor-pointer transition-colors">
                ${optionsHtml}
            </select>
            <span class="pointer-events-none absolute right-1.5 flex items-center" aria-hidden="true">
                ${ICONS.CHEVRON_DOWN}
            </span>
        </div>
    `;

    const selectEl = container.querySelector('#language-select-dropdown') as HTMLSelectElement;
    if (selectEl) {
        selectEl.addEventListener('change', (e) => {
            const newLang = (e.target as HTMLSelectElement).value;
            selectEl.blur();
            store.getState().setLanguage(newLang);
        });
    }
}
