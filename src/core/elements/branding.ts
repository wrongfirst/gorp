import { byId } from './helpers';

export const brandingElements = {
    branding: {
        get portalLink() { return byId<HTMLAnchorElement>('header-portal-link'); },
        get portalName() { return byId('header-portal-name'); },
        get breadcrumbSep() { return byId('header-breadcrumb-sep'); },
        get bookSwitcher() { return byId('header-book-switcher'); },
        get bookTrigger() { return byId<HTMLButtonElement>('header-book-trigger'); },
        get logo() { return byId('header-logo'); },
        get title() { return byId('header-title'); },
        get switcherChevron() { return byId('header-switcher-chevron'); },
        get switcherPopover() { return byId('course-switcher-popover'); },
    },
};

