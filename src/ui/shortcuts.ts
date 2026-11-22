import { runner } from '../core/runner';
import { elements } from '../core/elements';
import { store } from '../core/store';
import { focusEditor, formatEditorCode } from '../core/editor';
import { toggleSidebar } from './sidebar';
import { showPopup } from './popup';
import { ICONS } from './icons';
import { createModal, type ModalController } from './modal';

let shortcutsModal: ModalController | null = null;

let commandPaletteModulePromise: Promise<typeof import('./commandPalette')> | null = null;

function loadCommandPalette(): Promise<typeof import('./commandPalette')> {
    if (!commandPaletteModulePromise) {
        commandPaletteModulePromise = import('./commandPalette').catch((err) => {
            commandPaletteModulePromise = null;
            throw err;
        });
    }
    return commandPaletteModulePromise;
}

interface Shortcut {
    action: string;
    keys: string[];
}

const EDITOR_SHORTCUTS: Shortcut[] = [
    { action: "Save Code", keys: ["Cmd/Ctrl", "S"] },
    { action: "Format Code", keys: ["Cmd/Ctrl", "Shift", "F"] },
    { action: "Indent", keys: ["Tab"] },
    { action: "Unindent", keys: ["Shift", "Tab"] },
    { action: "Focus Out", keys: ["Esc", "Tab"] },
];

const NAVIGATION_SHORTCUTS: Shortcut[] = [
    { action: "Command Palette", keys: ["Cmd/Ctrl", "K"] },
    { action: "Toggle Sidebar", keys: ["Cmd/Ctrl", "B"] },
    { action: "Run Code", keys: ["Cmd/Ctrl", "Enter"] },
    { action: "Focus Editor", keys: ["Cmd/Ctrl", "Shift", "E"] },
    { action: "Focus Rubber Duck", keys: ["Cmd/Ctrl", "Shift", "D"] },
    { action: "Previous Lesson", keys: ["Cmd/Ctrl", "["] },
    { action: "Next Lesson", keys: ["Cmd/Ctrl", "]"] },
    { action: "Show Shortcuts", keys: ["?", "or", "F1"] },
];

export function initShortcuts() {
    if (elements.shortcutsBtn) {
        elements.shortcutsBtn.innerHTML = ICONS.KEYBOARD;
    }

    renderShortcuts();

    shortcutsModal = createModal({
        modal: elements.shortcuts.modal,
        closeBtn: elements.shortcuts.closeBtn,
    });

    elements.shortcutsBtn?.addEventListener('click', () => shortcutsModal?.open());

    //shortcut logic
    document.addEventListener('keydown', (e) => {

        // command palette: Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            e.stopPropagation();
            void loadCommandPalette().then((m) => m.toggleCommandPalette());
            return;
        }

        // toggle sidebar: Cmd/Ctrl + B
        if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
            return;
        }

        // run: Cmd/Ctrl+Enter
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (!elements.runBtn.disabled) {
                runner.run();
            }
            return;
        }

        // focus Editor: Cmd/Ctrl + Shift + E
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            e.stopPropagation();
            focusEditor();
            return;
        }

        // focus Rubber Duck input: Cmd/Ctrl + Shift + D
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            e.stopPropagation();
            const cs = store.getState().chatSettings;
            if (cs?.enabled) {
                void import('./chatPanel').then((m) => {
                    m.initChatPanel();
                    m.focusChatInput();
                });
            }
            return;
        }

        // format code: Cmd/Ctrl + Shift + F
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
            e.preventDefault();
            e.stopPropagation();
            const success = formatEditorCode();
            if (success) {
                showPopup('Code formatted');
            }
            return;
        }

        // navigation: Cmd/Ctrl + [ or ]
        if ((e.metaKey || e.ctrlKey) && e.key === '[') {
            e.preventDefault();
            e.stopPropagation();
            if (elements.nav.prev && !elements.nav.prev.disabled) {
                elements.nav.prev.click();
            }
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === ']') {
            e.preventDefault();
            e.stopPropagation();
            if (elements.nav.next && !elements.nav.next.disabled) {
                elements.nav.next.click();
            }
            return;
        }

        // show shortcuts: F1 (global)
        if (e.key === 'F1') {
            e.preventDefault();
            e.stopPropagation();
            shortcutsModal?.toggle();
            return;
        }

        const active = document.activeElement;
        const isInput = active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            (active as HTMLElement).isContentEditable
        );

        //apply shortcuts when not in code editor
        if (!isInput) {
            // show shortcuts: ?
            if (e.key === '?') {
                e.preventDefault();
                e.stopPropagation();
                shortcutsModal?.toggle();
                return;
            }
        }
    }, { capture: true });
}

function renderShortcuts() {
    if (!elements.shortcuts.list) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const renderGroup = (title: string, shortcuts: Shortcut[]) => {
        const items = shortcuts.map(s => {
            const keysHtml = s.keys.map(k => {
                let label = k;
                if (k === "Cmd/Ctrl") label = isMac ? "⌘" : "Ctrl";
                if (k === "Enter") label = "↵";

                if (k === "or") return `<span class="text-fg-muted text-xs mx-1">or</span>`;

                return `<kbd class="bg-bg-editor rounded px-1.5 py-0.5 text-[11px] font-mono
                min-w-5 text-center inline-block">${label}</kbd>`;
            }).reduce((acc, curr, i) => {
                if (i === 0) return curr;
                const prevKey = s.keys[i - 1];
                const currKey = s.keys[i];
                if (prevKey === "or" || currKey === "or") return acc + curr;
                return acc + '<span class="text-fg-muted text-[11px] mx-1">+</span>' + curr;
            }, "");

            return `
                <div class="flex items-center justify-between py-2">
                    <span class="text-[13px] text-fg-primary">${s.action}</span>
                    <div class="flex items-center">
                        ${keysHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex flex-col gap-1.5">
                <h3 class="text-[10px] font-bold text-fg-muted uppercase tracking-wider pb-1.5">${title}</h3>
                <div class="flex flex-col divide-y divide-border-default/25">
                    ${items}
                </div>
            </div>
        `;
    };

    elements.shortcuts.list.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            ${renderGroup("Editor", EDITOR_SHORTCUTS)}
            ${renderGroup("Navigation", NAVIGATION_SHORTCUTS)}
        </div>
    `;
}
