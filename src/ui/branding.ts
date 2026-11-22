import {
    siteConfig,
    SITE_TITLE,
    SITE_PAGE_TITLE,
    SITE_HOME_PAGE,
    SITE_PORTAL_NAME,
    isSameOriginUrl,
} from '../core/siteConfig';
import { elements } from '../core/elements';

export function initBranding() {
    const { logo_image, logo_emoji } = siteConfig;

    document.title = SITE_PAGE_TITLE;

    const logoEl = elements.branding.logo;
    if (logoEl) {
        if (logo_image) {
            logoEl.textContent = '';
            const img = document.createElement('img');
            img.src = logo_image;
            img.alt = '';
            img.className = 'h-[var(--brand-logo-size)] w-auto';
            logoEl.appendChild(img);
            logoEl.classList.remove('hidden');
            logoEl.classList.add('flex');
        } else if (logo_emoji) {
            logoEl.textContent = logo_emoji;
            logoEl.classList.remove('hidden');
            logoEl.classList.add('flex');
        } else {
            logoEl.textContent = '';
            logoEl.classList.add('hidden');
            logoEl.classList.remove('flex');
        }
    }

    if (elements.branding.title) {
        elements.branding.title.textContent = SITE_TITLE;
    }

    const portalLink = elements.branding.portalLink;
    const portalNameEl = elements.branding.portalName;
    const sep = elements.branding.breadcrumbSep;
    const homePage = SITE_HOME_PAGE.trim();
    const portalName = SITE_PORTAL_NAME;

    if (portalLink && sep) {
        if (homePage && portalName) {
            portalLink.href = homePage;
            if (portalNameEl) {
                portalNameEl.textContent = portalName;
            }
            portalLink.classList.remove('hidden');
            portalLink.classList.add('inline-flex');
            sep.classList.remove('hidden');

            if (isSameOriginUrl(homePage)) {
                portalLink.removeAttribute('target');
                portalLink.removeAttribute('rel');
            } else {
                portalLink.target = '_blank';
                portalLink.rel = 'noopener noreferrer';
            }
        } else {
            portalLink.removeAttribute('href');
            portalLink.removeAttribute('target');
            portalLink.removeAttribute('rel');
            portalLink.classList.add('hidden');
            portalLink.classList.remove('inline-flex');
            sep.classList.add('hidden');
        }
    }
}

