// src/core/siteConfig.ts
import rawSiteConfig from '../../site.toml';

export interface SiteConfig {
    title?: string;
    subtitle?: string;
    portal_name?: string;
    directory_url?: string;
    headline?: string;
    description?: string;
    keywords?: string;
    home_page?: string;
    project_url?: string;
    author_url?: string;
    logo_emoji?: string;
    logo_image?: string;
    og_image?: string;
    default_language?: string;
    languages?: string[];
    [key: string]: any;
}

export const siteConfig: SiteConfig = rawSiteConfig || {};

export function isSameOriginUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed || typeof window === 'undefined') return false;
    try {
        return new URL(trimmed, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}

export function resolvePortalName(
    config: Pick<SiteConfig, 'portal_name' | 'subtitle' | 'home_page'>
): string {
    const explicit = typeof config.portal_name === 'string' ? config.portal_name.trim() : '';
    if (explicit) return explicit;

    const subtitle = typeof config.subtitle === 'string' ? config.subtitle.trim() : '';
    const fromSubtitle = subtitle.replace(/^by\s+/i, '').trim();
    if (fromSubtitle) return fromSubtitle;

    const homePage = typeof config.home_page === 'string' ? config.home_page.trim() : '';
    if (homePage) {
        try {
            const base = typeof window !== 'undefined' ? window.location.href : undefined;
            const parsed = base ? new URL(homePage, base) : new URL(homePage);
            if (parsed.hostname) {
                return parsed.hostname.replace(/^www\./, '');
            }
        } catch {
            // Ignore malformed or relative URLs when window is unavailable
        }
    }

    return '';
}

export function resolveDirectoryUrl(
    config: Pick<SiteConfig, 'directory_url' | 'home_page'>
): string {
    if (typeof config.directory_url === 'string') {
        return config.directory_url.trim();
    }

    const homePage = typeof config.home_page === 'string' ? config.home_page.trim() : '';
    if (homePage) {
        return '/directory.json';
    }

    return '';
}

export const SITE_TITLE: string = siteConfig.title || 'codebook';
export const SITE_SLUG: string =
    SITE_TITLE.toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'codebook';
export const SITE_SUBTITLE: string = siteConfig.subtitle || '';
export const SITE_HOME_PAGE: string = siteConfig.home_page || '';
export const SITE_PORTAL_NAME: string = resolvePortalName(siteConfig);
export const SITE_DIRECTORY_URL: string = resolveDirectoryUrl(siteConfig);

export default siteConfig;
