import { byId } from './helpers';

export const resetProgressElements = {
    resetProgress: {
        get modal() { return byId('reset-progress-modal'); },
        get title() { return byId('reset-progress-title'); },
        get desc() { return byId('reset-progress-desc'); },
        get closeBtn() { return byId<HTMLButtonElement>('close-reset-progress-btn'); },
        get cancelBtn() { return byId<HTMLButtonElement>('cancel-reset-progress-btn'); },
        get confirmBtn() { return byId<HTMLButtonElement>('confirm-reset-progress-btn'); },
    },
};

