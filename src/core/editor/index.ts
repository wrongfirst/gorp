import { EditorView, GutterMarker, gutter, keymap, lineNumbers } from '@codemirror/view';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { indentRange } from '@codemirror/language';
import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
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
let isProgrammaticChange = false;
let activeExerciseId: string | null = null;
let activeLanguageId: string | null = null;

// Compartments are dynamic slots for extensions swapped dynamically at runtime
const languageCompartment = new Compartment();
const vimCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();

class LineNumberMarker extends GutterMarker {
    constructor(readonly text: string) {
        super();
    }
    eq(other: GutterMarker): boolean {
        return other instanceof LineNumberMarker && this.text === other.text;
    }
    toDOM(): Node {
        return document.createTextNode(this.text);
    }
}

function maxLineNumber(lines: number): number {
    let last = 9;
    while (last < lines) last = last * 10 + 9;
    return last;
}

function relativeLineNumbers(): Extension {
    return gutter({
        class: 'cm-lineNumbers',
        renderEmptyElements: false,
        lineMarker(view, line) {
            const lineNo = view.state.doc.lineAt(line.from).number;
            const activeLineNo = view.state.doc.lineAt(view.state.selection.main.head).number;
            const display = lineNo === activeLineNo ? lineNo : Math.abs(lineNo - activeLineNo);
            return new LineNumberMarker(String(display));
        },
        lineMarkerChange(update) {
            if (!update.selectionSet && !update.docChanged) return false;
            const prevLine = update.startState.doc.lineAt(update.startState.selection.main.head).number;
            const nextLine = update.state.doc.lineAt(update.state.selection.main.head).number;
            return prevLine !== nextLine || update.startState.doc.lines !== update.state.doc.lines;
        },
        initialSpacer(view) {
            return new LineNumberMarker(String(maxLineNumber(view.state.doc.lines)));
        },
        updateSpacer(spacer, update) {
            const max = String(maxLineNumber(update.view.state.doc.lines));
            return spacer instanceof LineNumberMarker && max === spacer.text
                ? spacer
                : new LineNumberMarker(max);
        },
    });
}

function getLineNumberExtension(relative: boolean): Extension {
    return relative ? relativeLineNumbers() : lineNumbers();
}

function updateEditorLanguage(languageExtension?: Extension) {
    if (view) {
        view.dispatch({
            effects: languageCompartment.reconfigure(languageExtension || [])
        });
    }
}

let vimExtensionFactory: (() => Extension) | null = null;
let vimLoadPromise: Promise<(() => Extension) | null> | null = null;
let vimModeSeq = 0;

function loadVimExtension(): Promise<(() => Extension) | null> {
    if (vimExtensionFactory) return Promise.resolve(vimExtensionFactory);
    if (!vimLoadPromise) {
        vimLoadPromise = import('@replit/codemirror-vim')
            .then((mod) => {
                vimExtensionFactory = mod.vim;
                return vimExtensionFactory;
            })
            .catch((err) => {
                vimLoadPromise = null;
                console.warn('[Editor] Failed to load Vim extension:', err);
                return null;
            });
    }
    return vimLoadPromise;
}

export function updateEditorVimMode(enabled: boolean) {
    if (!view) return;
    const seq = ++vimModeSeq;

    if (!enabled) {
        view.dispatch({
            effects: [
                vimCompartment.reconfigure([]),
                lineNumbersCompartment.reconfigure(getLineNumberExtension(false)),
            ]
        });
        return;
    }

    if (vimExtensionFactory) {
        view.dispatch({
            effects: [
                vimCompartment.reconfigure(vimExtensionFactory()),
                lineNumbersCompartment.reconfigure(getLineNumberExtension(true)),
            ]
        });
        return;
    }

    view.dispatch({
        effects: lineNumbersCompartment.reconfigure(getLineNumberExtension(true)),
    });

    void loadVimExtension().then((factory) => {
        if (!factory || !view || seq !== vimModeSeq || !store.getState().vimMode) return;
        view.dispatch({
            effects: vimCompartment.reconfigure(factory()),
        });
    });
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
    languageExtension?: Extension
) {
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
                vimCompartment.of(isVim && vimExtensionFactory ? vimExtensionFactory() : []),
                lintGutter(),
                lineNumbersCompartment.of(getLineNumberExtension(isVim)),
                ...baseEditorExtensions,
                autocompletion(),
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
                            showPopup('Saved!');
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
                    "&": { height: "100%", backgroundColor: "var(--bg-editor)", color: "var(--fg-primary)" },
                    ".cm-scroller": {
                        overflow: "auto",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.875rem",
                        lineHeight: "1.5",
                    },
                    ".cm-gutter-lint": {
                        width: "1rem",
                    },
                    ".cm-gutter-lint .cm-gutterElement": {
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    },
                    ".cm-lint-marker": {
                        width: "0.625rem",
                        height: "0.625rem",
                    },
                    ".cm-lineNumbers .cm-gutterElement": {
                        fontSize: "0.75rem",
                        minWidth: "1.75rem",
                        padding: "0 0.5rem 0 0.125rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                    },
                    ".cm-activeLineGutter": {
                        color: "var(--fg-primary)",
                    },
                    ".cm-line": {
                        paddingLeft: "4px",
                    },
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

        if (isVim && !vimExtensionFactory) {
            updateEditorVimMode(true);
        }
    } else {
        updateEditorLanguage(languageExtension);
        updateEditorVimMode(store.getState().vimMode);
        setDocText(code);
    }
}
