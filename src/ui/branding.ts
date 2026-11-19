import { siteConfig, SITE_TITLE } from '../core/siteConfig';
import { elements } from '../core/elements';

export function initBranding() {
    const { title, subtitle, headline, logo_image, logo_emoji, home_page } = siteConfig;
    const resolvedTitle = title || SITE_TITLE;

    document.title = headline || (subtitle ? `${resolvedTitle} | ${subtitle}` : resolvedTitle);

    if (elements.branding.logo) {
        if (logo_image) {
            elements.branding.logo.innerHTML = `<img src="${logo_image}" alt="Logo" class="h-8 w-auto" />`;
        } else if (logo_emoji) {
            elements.branding.logo.textContent = logo_emoji;
        }
    }

    if (elements.branding.title) {
        elements.branding.title.textContent = resolvedTitle;
    }
    if (elements.branding.subtitle) {
        if (subtitle) {
            if (elements.branding.subtitleText) {
                elements.branding.subtitleText.textContent = subtitle;
            } else {
                elements.branding.subtitle.textContent = subtitle;
            }
        }
        if (home_page) {
            elements.branding.subtitle.href = home_page;
            elements.branding.subtitle.target = '_blank';
            elements.branding.subtitle.rel = 'noopener noreferrer';
        } else {
            elements.branding.subtitle.removeAttribute('href');
            elements.branding.subtitle.removeAttribute('target');
            elements.branding.subtitle.removeAttribute('rel');
            elements.branding.subtitle.classList.remove('hover:text-fg-primary');
            if (elements.branding.subtitleIcon) {
                elements.branding.subtitleIcon.style.display = 'none';
            }
        }
    }
}

