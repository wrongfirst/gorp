// src/core/siteConfig.ts
import rawSiteConfig from '../../site.toml';
import {
    type SiteConfig,
    resolveSiteTitle,
    resolveSiteSlug,
    resolvePageTitle,
    resolvePortalName,
    resolveDirectoryUrl,
} from './siteMeta';

export type { SiteConfig };

export const siteConfig: SiteConfig = rawSiteConfig;

export function isSameOriginUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed || typeof window === 'undefined') return false;
    try {
        return new URL(trimmed, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}

const runtimeBaseUrl = typeof window !== 'undefined' ? window.location.href : undefined;

export const SITE_TITLE: string = resolveSiteTitle(siteConfig);
export const SITE_PAGE_TITLE: string = resolvePageTitle(siteConfig);
export const SITE_SLUG: string = resolveSiteSlug(SITE_TITLE);
export const SITE_HOME_PAGE: string = siteConfig.home_page || '';
export const SITE_PORTAL_NAME: string = resolvePortalName(siteConfig, runtimeBaseUrl);
export const SITE_DIRECTORY_URL: string = resolveDirectoryUrl(siteConfig);

export default siteConfig;
