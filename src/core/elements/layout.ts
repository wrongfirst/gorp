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
    get editorConsolePanel() { return byId('editor-and-console-panel'); },
    get console() { return byId('console-output'); },
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
        get paneConsole() { return byId('pane-console'); },
        get dragHDesktop() { return byId('drag-h-desktop'); },
        get dragVConsole() { return byId('drag-v-console'); },
    },

    // Progress bar container
    get progressContainer() { return byId('progress-container'); },
};

