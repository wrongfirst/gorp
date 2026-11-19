import { byId } from './helpers';

export const layoutElements = {
    // Problem description
    description: {
        get desktop() { return byId('ex-desc-desktop'); },
    },

    // Sidebar
    sidebar: {
        get list() { return byId('sidebar-list'); },
        get toggle() { return byId<HTMLButtonElement>('sidebar-toggle'); },
        get nav() { return byId('sidebar-nav'); },
    },

    // Problem and editor panels
    get problemAndChatPanel() { return byId('problem-and-chat-panel'); },
    get editorOutputPanel() { return byId('editor-and-output-panel'); },
    get output() { return byId('output-content'); },
    get status() { return byId('status'); },
    get statusDot() { return byId('status-dot'); },

    // Navigation and tabs
    nav: {
        get prev() { return byId<HTMLButtonElement>('nav-prev'); },
        get next() { return byId<HTMLButtonElement>('nav-next'); },
    },
    tabs: {
        get problem() { return byId<HTMLButtonElement>('tab-problem'); },
        get code() { return byId<HTMLButtonElement>('tab-code'); },
    },

    // Resize handles and panes
    resize: {
        get paneProblem() { return byId('problem-and-chat-panel'); },
        get paneOutput() { return byId('pane-output'); },
        get dragHDesktop() { return byId('drag-h-desktop'); },
        get dragVOutput() { return byId('drag-v-output'); },
    },

    // Progress bar container
    get progressContainer() { return byId('progress-container'); },

    // Footer
    get footer() { return byId('footer'); },
};

