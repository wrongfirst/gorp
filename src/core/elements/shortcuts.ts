import { byId } from './helpers';

export const shortcutElements = {
    shortcuts: {
        get modal() { return byId('shortcuts-modal'); },
        get closeBtn() { return byId<HTMLButtonElement>('close-shortcuts-btn'); },
        get list() { return byId('shortcuts-list'); },
    },
};

