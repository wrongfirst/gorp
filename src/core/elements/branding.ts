import { byId } from './helpers';

export const brandingElements = {
    branding: {
        get brandLink() { return byId<HTMLAnchorElement>('header-brand'); },
        get logo() { return byId('header-logo'); },
        get title() { return byId('header-title'); },
        get subtitle() { return byId('header-subtitle'); },
    },
};

