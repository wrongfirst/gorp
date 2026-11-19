import { byId } from './helpers';

export const commandPaletteElements = {
  commandPalette: {
    get modal() { return byId('command-palette-modal'); },
    get input() { return byId<HTMLInputElement>('command-palette-input'); },
    get results() { return byId('command-palette-results'); },
    get preview() { return byId('command-palette-preview'); },
    get footer() { return byId('command-palette-footer'); },
    get closeBtn() { return byId<HTMLButtonElement>('close-command-palette-btn'); },
    get searchIcon() { return byId('command-palette-search-icon'); },
  },
};
