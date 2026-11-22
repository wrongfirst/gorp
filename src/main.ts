import './input.css';
import { store, ensureSettingsDecrypted } from './core/store';
import { exercises, curriculum, getExerciseDisplayNumber } from './exercises/exercise-registry';
import { getExerciseVariant } from './core/types';
import { loadExerciseCode, setEditorCode, updateEditorTheme, getCode, formatEditorCode } from './core/editor';
import { parseMarkdown, escapeHtml } from './core/markdown';
import { renderMath } from './core/math';

//module imports
import { elements } from './core/elements';
import { runner } from './core/runner';

//ui
import { ICONS } from './ui/icons';
import { status } from './ui/status';
import { showPopup } from './ui/popup';
import { initBranding } from './ui/branding';
import { initCourseSwitcher } from './ui/courseSwitcher';
import { renderSidebar, initSidebar } from './ui/sidebar';
import { renderProgressBar } from './ui/progressBar';
import { setupResize } from './ui/resize';
import { initTabs } from './ui/tabs';
import { initNavigation } from './ui/navigation';
import { resetEditorText } from './ui/resetEditorText';
import { setupCopyCodeButton } from './ui/copyCode';
import { setupFormatCodeButton } from './ui/formatCode';
import { initShortcuts } from './ui/shortcuts';
import { createLazyLoader } from './ui/lazy';
import { renderLanguageSelector } from './ui/languageSelector';
import { getLanguageExtension, prefetchInactiveLanguageAssets } from './languages/language-registry';
import { activeRunner } from './language';

//freeze fetch to prevent monkey-patching by injected scripts 
Object.defineProperty(window, 'fetch', { value: window.fetch, writable: false, configurable: false });

//initialisation
initBranding();
initShortcuts();

//lazy-loaded modals: render visible chrome icons immediately, load modules on first click
if (elements.settingsBtn) {
    elements.settingsBtn.innerHTML = ICONS.SETTINGS;
    const loadSettings = createLazyLoader(() => import('./ui/settings'));
    elements.settingsBtn.addEventListener('click', () => {
        void loadSettings().then((m) => m.openSettingsModal());
    });
}

if (elements.resetProgressBtn) {
    elements.resetProgressBtn.innerHTML = ICONS.RESET;
    const loadResetProgress = createLazyLoader(() => import('./ui/resetProgress'));
    elements.resetProgressBtn.addEventListener('click', () => {
        void loadResetProgress().then((m) => m.openResetProgressDialog());
    });
}

//load speedrun modal only in dev environments
if (import.meta.env.DEV) {
    import('./ui/speedrunModal').then(m => m.initSpeedrunButton());
}

const switchTab = initTabs(
    elements.tabs.problem,
    elements.tabs.code,
    elements.problemAndChatPanel,
    elements.editorOutputPanel
);

const navActions = initNavigation(
    elements.nav.prev,
    elements.nav.next,
    store,
    switchTab
);

initSidebar();

//theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    updateEditorTheme(e.matches);
    render();
});

//render
let lastRenderedExerciseId: string | null = null;
let lastRenderedLanguageId: string | null = null;
let lastRenderedCompletedIds: string[] = [];
let lastRenderedUserCode: string | null = null;

function render() {
    const { activeLessonSlug, currentLanguageId, completedSlugs } = store.getState();

    const prevExerciseId = lastRenderedExerciseId;
    const prevLanguageId = lastRenderedLanguageId;
    const prevUserCode = lastRenderedUserCode;

    const currentEx = exercises.find(e => e.id === activeLessonSlug);
    if (!currentEx) return;

    const exerciseVariant = getExerciseVariant(currentEx, currentLanguageId);
    const currentUserCode = store.getState().getUserCode(activeLessonSlug, currentLanguageId) || exerciseVariant.initialCode;

    const isInitial = prevExerciseId === null || prevLanguageId === null;
    const isExerciseChanged = prevExerciseId !== null && activeLessonSlug !== prevExerciseId;
    const isLanguageChanged = prevLanguageId !== null && currentLanguageId !== prevLanguageId;
    const isCompletedChanged = completedSlugs.length !== lastRenderedCompletedIds.length ||
        completedSlugs.some((id, idx) => id !== lastRenderedCompletedIds[idx]);
    const isUserCodeChanged = prevUserCode !== null && currentUserCode !== prevUserCode;

    //render only on key changes and not when say chat responses are streaming in
    if (!isInitial && !isExerciseChanged && !isLanguageChanged && !isCompletedChanged && !isUserCodeChanged) {
        return;
    }

    lastRenderedExerciseId = activeLessonSlug;
    lastRenderedLanguageId = currentLanguageId;
    lastRenderedCompletedIds = [...completedSlugs];
    lastRenderedUserCode = currentUserCode;

    // If exercise or language changed (or initial load), update problem statement, language selector and editor
    if (isInitial || isExerciseChanged || isLanguageChanged) {
        //render description
        const descHtml = parseMarkdown(currentEx.description);
        const displayNum = getExerciseDisplayNumber(currentEx.id);
        const headerTitle = displayNum ? `${displayNum} ${currentEx.title}` : currentEx.title;
        const titleHtml = `<h1 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-fg-primary">${escapeHtml(headerTitle)}</h1>`;
        const fullContent = titleHtml + descHtml;

        if (elements.description.desktop) {
            elements.description.desktop.innerHTML = fullContent;
            renderMath(elements.description.desktop);
        }

        if (isExerciseChanged && elements.chat.scrollContainer) {
            elements.chat.scrollContainer.scrollTop = 0;
        }

        //update problem pane chapter header
        if (elements.problemChapterTitle) {
            const currentChapter = curriculum.find(c => c.exercises.some(e => e.id === currentEx.id));
            elements.problemChapterTitle.textContent = currentChapter?.title ?? '';
        }

        //update nav
        if (navActions) navActions.updateNavState(activeLessonSlug);

        //language selector
        renderLanguageSelector(elements.languageSelectorContainer, currentEx);
        const languageExtension = getLanguageExtension(currentLanguageId);

        //initialize editor with user code (loadExerciseCode automatically saves prior context)
        loadExerciseCode(activeLessonSlug, currentLanguageId, currentUserCode, languageExtension);

        //reset output on exercise or language switch
        if (isExerciseChanged || isLanguageChanged) {
            elements.output.textContent = "// Ready...";
            if (activeRunner.getStatus?.() === 'ready') {
                status.setReady();
            }
        }
    } else if (isUserCodeChanged) {
        // In-place update of editor code when store changes externally (e.g. backup restore or Gist pull)
        setEditorCode(currentUserCode);
    }

    //sidebar & progress (updates on exercise switch or completion changes)
    renderSidebar(elements.sidebar.list, curriculum, activeLessonSlug, completedSlugs);
    renderProgressBar(elements.progressContainer, curriculum, activeLessonSlug, completedSlugs);
}


//event listeners
store.subscribe(render);

//run button
elements.runBtn.addEventListener('click', () => runner.run());

//format button
if (elements.formatCodeBtn) {
    setupFormatCodeButton(elements.formatCodeBtn, () => formatEditorCode());
}

//copy button
if (elements.copyCodeBtn) {
    setupCopyCodeButton(elements.copyCodeBtn, () => getCode());
}

//reset button
if (elements.resetBtn) {
    resetEditorText(elements.resetBtn, ICONS.TRASH, () => {
        const { activeLessonSlug, currentLanguageId } = store.getState();
        const currentEx = exercises.find(e => e.id === activeLessonSlug);
        if (!currentEx) return;
        const exerciseVariant = getExerciseVariant(currentEx, currentLanguageId);
        setEditorCode(exerciseVariant.initialCode);
        store.getState().saveUserCode(activeLessonSlug, currentLanguageId, exerciseVariant.initialCode);
        showPopup('Reset to starter code');
    });
}

//clear output
if (elements.clearOutputBtn) {
    elements.clearOutputBtn.innerHTML = ICONS.TRASH;
    elements.clearOutputBtn.addEventListener('click', () => {
        if (elements.output) elements.output.textContent = "";
    });
}

//routing
const navigateToFirstExercise = () => {
    const firstExId = exercises[0]?.id;
    if (firstExId) {
        window.location.hash = `#${firstExId}`;
        store.getState().setCurrent(firstExId);
    }
};

//header course switcher (falls back to navigating to first exercise when directory.json is unavailable)
initCourseSwitcher(navigateToFirstExercise);

window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    if (exercises.find(e => e.id === id)) {
        store.getState().setCurrent(id);
    } else if (!id && exercises.length > 0) {
        store.getState().setCurrent(exercises[0].id);
    }
});

//resize logic
setupResize(elements.resize.dragHDesktop, elements.resize.paneProblem, 'horizontal');
setupResize(elements.resize.dragVOutput, elements.resize.paneOutput, 'vertical', true);


//startup
runner.init();

//setup initial state
const hashId = window.location.hash.slice(1);
const storedExerciseId = store.getState().activeLessonSlug;

if (hashId && exercises.some(e => e.id === hashId)) {
    store.getState().setCurrent(hashId);
} else if (storedExerciseId && exercises.some(e => e.id === storedExerciseId)) {
    history.replaceState(null, '', `#${storedExerciseId}`);
} else if (exercises.length > 0) {
    store.getState().setCurrent(exercises[0].id);
    history.replaceState(null, '', `#${exercises[0].id}`);
}

//initial render
render();

//lazy-load Rubber Duck chat panel only when enabled (on startup or when toggled on later)
let chatPanelLoaded = false;
let unsubChatBootstrap: (() => void) | null = null;
const ensureChatPanelLoaded = () => {
    if (chatPanelLoaded || !store.getState().chatSettings?.enabled) return;
    chatPanelLoaded = true;
    void import('./ui/chatPanel')
        .then((m) => {
            m.initChatPanel();
            unsubChatBootstrap?.();
            unsubChatBootstrap = null;
        })
        .catch((err) => {
            chatPanelLoaded = false;
            console.warn('[main] Failed to initialize chat panel:', err);
        });
};
unsubChatBootstrap = store.subscribe(ensureChatPanelLoaded);
ensureChatPanelLoaded();

//kick off background credential decryption and startup sync (non-blocking, lazy-loaded when sync/OAuth is active)
ensureSettingsDecrypted(store)
    .then(() => {
        const { gistSyncSettings } = store.getState();
        const hasOAuthCode = new URLSearchParams(window.location.search).has('code');
        const hasSyncConfig = Boolean(gistSyncSettings?.enabled && gistSyncSettings?.token);
        if (hasOAuthCode || hasSyncConfig) {
            return import('./core/sync/syncManager').then((m) => m.runStartupSync());
        }
    })
    .catch((err) => {
        console.warn('[main] Startup decryption or sync check failed:', err);
    });

// Wait for active runner readiness, then schedule background asset prefetch for inactive languages
activeRunner.whenReady?.()
    .then(() => {
        const scheduleBackgroundPrefetch = () => {
            const currentLang = store.getState().currentLanguageId;
            prefetchInactiveLanguageAssets(currentLang).catch(() => { });
        };

        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(scheduleBackgroundPrefetch, { timeout: 8000 });
        } else {
            setTimeout(scheduleBackgroundPrefetch, 2000);
        }
    })
    .catch((err) => {
        console.warn('[main] Active runner initialization or prefetch deferred:', err);
    });

