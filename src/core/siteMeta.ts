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

export const DEFAULT_SITE_CONFIG: SiteConfig = {
    title: 'codebook',
    subtitle: 'by wrongfirst',
    home_page: 'https://wrongfirst.dev',
    logo_emoji: '📓',
};

export function resolveSiteTitle(config: Pick<SiteConfig, 'title'>): string {
    return config.title || 'codebook';
}

export function resolveSiteSlug(title: string): string {
    return (
        title
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'codebook'
    );
}

export function resolvePageTitle(
    config: Pick<SiteConfig, 'title' | 'subtitle' | 'headline'>
): string {
    const title = resolveSiteTitle(config);
    return config.headline || (config.subtitle ? `${title} | ${config.subtitle}` : title);
}

export function resolvePortalName(
    config: Pick<SiteConfig, 'portal_name' | 'subtitle' | 'home_page'>,
    baseUrl?: string
): string {
    const explicit = typeof config.portal_name === 'string' ? config.portal_name.trim() : '';
    if (explicit) return explicit;

    const subtitle = typeof config.subtitle === 'string' ? config.subtitle.trim() : '';
    const fromSubtitle = subtitle.replace(/^by\s+/i, '').trim();
    if (fromSubtitle) return fromSubtitle;

    const homePage = typeof config.home_page === 'string' ? config.home_page.trim() : '';
    if (homePage) {
        try {
            const parsed = baseUrl ? new URL(homePage, baseUrl) : new URL(homePage);
            if (parsed.hostname) {
                return parsed.hostname.replace(/^www\./, '');
            }
        } catch {
            // Ignore malformed or relative URLs when baseUrl is unavailable (e.g. build time)
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

export function resolveProjectUrl(config: Pick<SiteConfig, 'project_url'>): string {
    const raw =
        typeof config.project_url === 'string' && config.project_url.trim()
            ? config.project_url.trim()
            : 'https://github.com';
    return raw.replace(/\/+$/, '');
}
