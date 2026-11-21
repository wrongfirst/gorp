import {
    siteConfig,
    SITE_TITLE,
    SITE_HOME_PAGE,
    SITE_PORTAL_NAME,
    isSameOriginUrl,
} from '../core/siteConfig';
import { elements } from '../core/elements';

export function initBranding() {
    const { title, subtitle, headline, logo_image, logo_emoji } = siteConfig;
    const resolvedTitle = title || SITE_TITLE;

    document.title = headline || (subtitle ? `${resolvedTitle} | ${subtitle}` : resolvedTitle);

    const logoEl = elements.branding.logo;
    if (logoEl) {
        if (logo_image) {
            logoEl.textContent = '';
            const img = document.createElement('img');
            img.src = logo_image;
            img.alt = '';
            img.className = 'h-5 w-auto';
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
        elements.branding.title.textContent = resolvedTitle;
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
            portalLink.classList.add('inline-flex', 'site-brand');
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
            portalLink.classList.remove('inline-flex', 'site-brand');
            sep.classList.add('hidden');
        }
    }
}

