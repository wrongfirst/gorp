import { byId } from './helpers';

export const brandingElements = {
    branding: {
        get brandLink() { return byId<HTMLAnchorElement>('header-brand'); },
        get titleLink() { return byId<HTMLAnchorElement>('header-title-link'); },
        get logo() { return byId('header-logo'); },
        get title() { return byId('header-title'); },
        get subtitle() { return byId<HTMLAnchorElement>('header-subtitle'); },
        get subtitleText() { return byId('header-subtitle-text'); },
        get subtitleIcon() { return byId('header-subtitle-icon'); },
    },
};

