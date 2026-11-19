import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { indentRange } from '@codemirror/language';
import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { vim } from '@replit/codemirror-vim';
import { themeCompartment, getTheme } from '../../ui/theme';
import { showPopup } from '../../ui/popup';
import { store } from '../store';
import { baseEditorExtensions } from './setup';
import { formatLintMessages } from './diagnostics';
export { baseEditorExtensions } from './setup';
export { getEditorDiagnostics, type EditorDiagnostic } from './diagnostics';

let view: EditorView | null = null;
let tabCount = 0;
let lastTabTime = 0;
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let onSaveCallback: (() => void) | undefined;
let isProgrammaticChange = false;
let activeExerciseId: string | null = null;
let activeLanguageId: string | null = null;

// Compartments are dynamic slots for extensions swapped dynamically at runtime
const languageCompartment = new Compartment();
const vimCompartment = new Compartment();

function updateEditorLanguage(languageExtension?: Extension) {
    if (view) {
        view.dispatch({
            effects: languageCompartment.reconfigure(languageExtension || [])
        });
    }
}

export function updateEditorVimMode(enabled: boolean) {
    if (view) {
        view.dispatch({
            effects: vimCompartment.reconfigure(enabled ? vim() : [])
        });
    }
}

export function updateEditorTheme(isDark: boolean) {
    if (view) {
        view.dispatch({
            effects: themeCompartment.reconfigure(getTheme(isDark))
        });
    }
}

export function focusEditor(): void {
    if (view) {
        view.focus();
    }
}

// Safely updates editor content without triggering auto-save
function setDocText(code: string) {
    if (!view) return;
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    const currentText = view.state.doc.toString();
    if (currentText === code) return;

    isProgrammaticChange = true;
    try {
        view.dispatch({
            changes: { from: 0, to: currentText.length, insert: code }
        });
    } finally {
        isProgrammaticChange = false;
    }
}

export function setEditorCode(code: string) {
    setDocText(code);
}

export function getCode(): string {
    return view ? view.state.doc.toString() : "";
}

/**
 * Re-indents the active editor document using CodeMirror's syntax tree indentation service.
 */
export function formatEditorCode(): boolean {
    if (!view) return false;
    const { state } = view;
    const docLength = state.doc.length;
    if (docLength === 0) return false;

    try {
        const changes = indentRange(state, 0, docLength);
        view.dispatch({
            changes,
            scrollIntoView: false
        });
        scheduleAutoSave();
        return true;
    } catch (err) {
        console.warn('[Editor] Failed to auto-format code:', err);
        return false;
    }
}

/**
 * Formats active editor diagnostics into a human-readable list for LLM context.
 */
export function getFormattedLintMessages(): string {
    return formatLintMessages(view);
}

// Immediately flushes pending edits to the store for the active exercise/language
export function flushAutoSave(targetExerciseId?: string, targetLanguageId?: string) {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    if (view) {
        const { activeLessonSlug, currentLanguageId } = store.getState();
        const exId = targetExerciseId ?? activeExerciseId ?? activeLessonSlug;
        const langId = targetLanguageId ?? activeLanguageId ?? currentLanguageId;
        if (exId && langId) {
            store.getState().saveUserCode(exId, langId, view.state.doc.toString());
        }
    }
}

function scheduleAutoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        autoSaveTimeout = null;
        flushAutoSave();
    }, 300);
}

// Loads code and syntax for an exercise, automatically flushing prior edits
export function loadExerciseCode(
    exerciseId: string,
    languageId: string,
    code: string,
    languageExtension?: Extension,
    onSave?: () => void
) {
    onSaveCallback = onSave;

    // Flush any pending unsaved changes from the previous exercise/language context
    if (autoSaveTimeout && activeExerciseId && activeLanguageId && (activeExerciseId !== exerciseId || activeLanguageId !== languageId)) {
        const prevEx = activeExerciseId;
        const prevLang = activeLanguageId;
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
        if (view) {
            store.getState().saveUserCode(prevEx, prevLang, view.state.doc.toString());
        }
    }

    activeExerciseId = exerciseId;
    activeLanguageId = languageId;

    const editorEl = document.getElementById('editor');
    if (!editorEl) return;

    if (!view) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isVim = store.getState().vimMode;

        const state = EditorState.create({
            doc: code,
            extensions: [
                vimCompartment.of(isVim ? vim() : []),
                ...baseEditorExtensions,
                autocompletion(),
                lintGutter(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && !isProgrammaticChange) {
                        scheduleAutoSave();
                    }
                }),
                keymap.of([
                    { key: "Tab", run: acceptCompletion },

                    // If user presses tab 3 times, show a toast indicating they can focus out with Esc + Tab
                    {
                        key: "Tab",
                        run: () => {
                            const now = Date.now();
                            if (now - lastTabTime > 2000) {
                                tabCount = 0;
                            }
                            tabCount++;
                            lastTabTime = now;

                            if (tabCount >= 3) {
                                showPopup('Press Esc + Tab to move focus out of editor', 3000);
                                tabCount = 0;
                            }
                            return false;
                        }
                    },
                    indentWithTab,
                    {
                        key: "Mod-s",
                        run: () => {
                            flushAutoSave();
                            if (onSaveCallback) {
                                onSaveCallback();
                            } else {
                                showPopup('Saved!');
                            }
                            return true;
                        },
                        preventDefault: true
                    },
                    {
                        key: "Mod-Shift-f",
                        run: () => {
                            const success = formatEditorCode();
                            if (success) {
                                showPopup('Code formatted');
                            }
                            return true;
                        },
                        preventDefault: true
                    }
                ]),
                languageCompartment.of(languageExtension || []),
                themeCompartment.of(getTheme(isDark)),
                EditorView.theme({
                    "&": { height: "100%", backgroundColor: "var(--bg-app)", color: "var(--fg-primary)" },
                    ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono)" },
                }),
                // Adding domEventHandlers here ensures Tab is not overridden by indentWithTab
                EditorView.domEventHandlers({
                    keydown: (event) => {
                        if (event.key !== 'Tab') {
                            tabCount = 0;
                        }
                    },
                    mousedown: () => {
                        tabCount = 0;
                    }
                })
            ]
        });

        view = new EditorView({
            state,
            parent: editorEl
        });
    } else {
        updateEditorLanguage(languageExtension);
        updateEditorVimMode(store.getState().vimMode);
        setDocText(code);
    }
}
