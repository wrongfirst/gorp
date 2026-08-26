import { byId } from './helpers';

export const controlElements = {
    get runBtn() { return byId<HTMLButtonElement>('run-btn'); },
    get resetBtn() { return byId<HTMLButtonElement>('reset-btn'); },
    get clearConsoleBtn() { return byId<HTMLButtonElement>('clear-console-btn'); },
    get shortcutsBtn() { return byId<HTMLButtonElement>('shortcuts-btn'); },
    get speedrunBtn() { return byId<HTMLButtonElement>('speedrun-btn'); },
    get settingsBtn() { return byId<HTMLButtonElement>('settings-btn'); },
    get resetProgressBtn() { return byId<HTMLButtonElement>('reset-progress-btn'); },
    get languageSelectorContainer() { return byId('language-selector-container'); },
};

