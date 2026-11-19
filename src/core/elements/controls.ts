import { byId } from './helpers';

export const controlElements = {
    get runBtn() { return byId<HTMLButtonElement>('run-btn'); },
    get resetBtn() { return byId<HTMLButtonElement>('reset-btn'); },
    get formatCodeBtn() { return byId<HTMLButtonElement>('format-code-btn'); },
    get copyCodeBtn() { return byId<HTMLButtonElement>('copy-code-btn'); },
    get clearOutputBtn() { return byId<HTMLButtonElement>('clear-output-btn'); },
    get shortcutsBtn() { return byId<HTMLButtonElement>('shortcuts-btn'); },
    get speedrunBtn() { return byId<HTMLButtonElement>('speedrun-btn'); },
    get settingsBtn() { return byId<HTMLButtonElement>('settings-btn'); },
    get resetProgressBtn() { return byId<HTMLButtonElement>('reset-progress-btn'); },
    get languageSelectorContainer() { return byId('language-selector-container'); },
    get editorTitle() { return byId('editor-title'); },
};

