import { byId } from './helpers';

export const speedrunElements = {
    speedrun: {
        get modal() { return byId('speedrun-modal'); },
        get closeBtn() { return byId<HTMLButtonElement>('close-speedrun-btn'); },
        get headerIcon() { return byId('speedrun-header-icon'); },
        get langSelect() { return byId<HTMLSelectElement>('speedrun-lang-select'); },
        get startBtn() { return byId<HTMLButtonElement>('speedrun-start-btn'); },
        get startBtnText() { return byId('speedrun-start-btn-text'); },
        get exportBtn() { return byId<HTMLButtonElement>('speedrun-export-btn'); },
        get exportIcon() { return byId('speedrun-export-icon'); },
        get exportText() { return byId('speedrun-export-text'); },
        get progressContainer() { return byId('speedrun-progress-container'); },
        get progressBar() { return byId('speedrun-progress-bar'); },
        get progressStatus() { return byId('speedrun-progress-status'); },
        get progressCounter() { return byId('speedrun-progress-counter'); },
        get statusFilters() { return byId('speedrun-status-filters'); },
        stats: {
            get all() { return byId('stat-all'); },
            get passed() { return byId('stat-passed'); },
            get failed() { return byId('stat-failed'); },
            get errors() { return byId('stat-errors'); },
            get missing() { return byId('stat-missing'); },
            get time() { return byId('stat-time'); },
        },
        get sortBtn() { return byId<HTMLButtonElement>('speedrun-sort-btn'); },
        get sortIcon() { return byId('speedrun-sort-icon'); },
        get sortLabel() { return byId('speedrun-sort-label'); },
        get resultsList() { return byId('speedrun-results-list'); },
    },
};

