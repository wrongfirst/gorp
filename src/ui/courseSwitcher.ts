import {
    SITE_SLUG,
    SITE_DIRECTORY_URL,
    isSameOriginUrl,
} from '../core/siteConfig';
import { elements } from '../core/elements';
import { escapeHtml, isSafeUrl } from '../core/markdown';
import { ICONS } from './icons';

export interface DirectoryItem {
    slug: string;
    name: string;
    url: string;
    emoji?: string;
    description?: string;
    languages?: string[];
    exerciseCount?: number;
    hidden?: boolean;
}

export interface DirectorySection {
    title: string;
    hidden?: boolean;
    items: DirectoryItem[];
}

export interface DirectoryManifest {
    version: number;
    title?: string;
    subtitle?: string;
    sections: DirectorySection[];
}

interface CachedDirectory {
    fetchedAt: number;
    data: DirectoryManifest;
}

interface BookProgress {
    completed: number;
    total: number | null;
    isComplete: boolean;
}

const SESSION_CACHE_PREFIX = 'codebook_directory_cache:';

let visibleSections: DirectorySection[] = [];
let isSwitcherActive = false;
let isOpen = false;

function parseManifest(raw: unknown): DirectoryManifest | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    if (obj.version !== 1 || !Array.isArray(obj.sections)) return null;
    return obj as unknown as DirectoryManifest;
}

function getVisibleSections(manifest: DirectoryManifest): DirectorySection[] {
    const visible: DirectorySection[] = [];
    for (const section of manifest.sections) {
        if (!section || typeof section !== 'object' || section.hidden) continue;
        if (!Array.isArray(section.items)) continue;

        const items = section.items.filter(
            (item): item is DirectoryItem =>
                Boolean(
                    item &&
                    typeof item === 'object' &&
                    !item.hidden &&
                    typeof item.slug === 'string' &&
                    item.slug.trim().length > 0 &&
                    typeof item.name === 'string' &&
                    item.name.trim().length > 0 &&
                    typeof item.url === 'string' &&
                    isSafeUrl(item.url)
                )
        );

        if (items.length > 0) {
            visible.push({
                title: typeof section.title === 'string' ? section.title : '',
                items,
            });
        }
    }
    return visible;
}

function readSessionCache(directoryUrl: string): DirectoryManifest | null {
    try {
        const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${directoryUrl}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<CachedDirectory>;
        return parseManifest(parsed?.data);
    } catch {
        return null;
    }
}

function writeSessionCache(directoryUrl: string, manifest: DirectoryManifest): void {
    try {
        const payload: CachedDirectory = {
            fetchedAt: Date.now(),
            data: manifest,
        };
        window.sessionStorage.setItem(
            `${SESSION_CACHE_PREFIX}${directoryUrl}`,
            JSON.stringify(payload)
        );
    } catch {
        // Ignore storage quota or private-mode errors
    }
}

function clearSessionCache(directoryUrl: string): void {
    try {
        window.sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${directoryUrl}`);
    } catch {
        // Ignore storage errors
    }
}

async function fetchDirectoryManifest(directoryUrl: string): Promise<DirectoryManifest | null> {
    try {
        const res = await window.fetch(directoryUrl, { cache: 'no-cache' });
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('json')) return null;
        const json: unknown = await res.json();
        return parseManifest(json);
    } catch {
        return null;
    }
}

function readBookProgress(item: DirectoryItem): BookProgress | null {
    try {
        const raw = window.localStorage.getItem(`${item.slug}_storage`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const state = parsed && typeof parsed === 'object' ? (parsed.state ?? parsed) : null;
        if (!state || typeof state !== 'object') return null;

        const completed = Array.isArray(state.completedSlugs) ? state.completedSlugs.length : 0;
        const totalFromManifest =
            typeof item.exerciseCount === 'number' && item.exerciseCount > 0
                ? item.exerciseCount
                : null;
        const totalFromStorage =
            typeof state.exerciseCount === 'number' && state.exerciseCount > 0
                ? state.exerciseCount
                : null;
        const total = totalFromManifest ?? totalFromStorage;

        if (completed <= 0) return null;

        return {
            completed,
            total,
            isComplete: total !== null && completed >= total,
        };
    } catch {
        return null;
    }
}

function formatProgressBadge(progress: BookProgress): string {
    const label = progress.total !== null
        ? `${progress.completed}/${progress.total}`
        : `${progress.completed}`;
    const title = progress.total !== null
        ? `${progress.completed} of ${progress.total} completed`
        : `${progress.completed} completed`;
    const colorClass = progress.isComplete ? 'text-green-500' : 'text-fg-muted';
    const suffix = progress.isComplete ? ' ✓' : '';

    return `<span class="font-mono text-[11px] tabular-nums shrink-0 ${colorClass}" title="${escapeHtml(title)}">${escapeHtml(label)}${suffix}</span>`;
}

function renderPopoverContent(): void {
    const popover = elements.branding.switcherPopover;
    if (!popover) return;

    const currentSlug = SITE_SLUG.toLowerCase();

    const sectionsHtml = visibleSections
        .map((section, sectionIdx) => {
            const sectionBorder = sectionIdx > 0 ? 'mt-1.5 pt-1.5 border-t border-border-default/35' : '';
            const sectionHeader = section.title
                ? `<div class="px-3 pt-1.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand select-none">${escapeHtml(section.title)}</div>`
                : '';

            const itemsHtml = section.items
                .map((item) => {
                    const isActive = item.slug.toLowerCase() === currentSlug;
                    const sameOrigin = isSameOriginUrl(item.url);
                    const targetAttr = sameOrigin ? '' : ' target="_blank" rel="noopener noreferrer"';
                    const currentAttr = isActive ? ' aria-current="page" data-active-course="true"' : '';

                    const activeDotHtml = isActive
                        ? `<span class="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true"></span>`
                        : '';
                    const externalHtml = !sameOrigin
                        ? `<span class="font-mono text-[10px] text-fg-muted shrink-0" aria-hidden="true">↗</span>`
                        : '';

                    const progress = readBookProgress(item);
                    const progressHtml = progress ? formatProgressBadge(progress) : '';

                    const descHtml = item.description
                        ? `<p class="text-[11px] text-fg-muted truncate mt-0.5 leading-snug">${escapeHtml(item.description)}</p>`
                        : '';

                    const rowClasses = isActive
                        ? 'border-l-2 border-brand bg-bg-subbar/60 text-fg-primary'
                        : 'border-l-2 border-transparent text-fg-primary hover:bg-bg-editor';

                    return `
                        <a href="${escapeHtml(item.url)}"${targetAttr}${currentAttr}
                            class="block pl-2.5 pr-3 py-2 transition-colors focus:outline-none focus-visible:bg-bg-editor ${rowClasses}">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2 min-w-0">
                                    <span class="text-xs font-semibold truncate">${escapeHtml(item.name)}</span>
                                    ${activeDotHtml}
                                </div>
                                <div class="flex items-center gap-1.5 shrink-0">
                                    ${progressHtml}
                                    ${externalHtml}
                                </div>
                            </div>
                            ${descHtml}
                        </a>
                    `;
                })
                .join('');

            return `<div class="${sectionBorder}">${sectionHeader}<div>${itemsHtml}</div></div>`;
        })
        .join('');

    popover.innerHTML = `
        <div class="subtle-scrollbar max-h-[min(24rem,calc(100dvh-6rem))] overflow-y-auto py-1">
            ${sectionsHtml}
        </div>
    `;

    // Clicking the currently active book closes the popover without reloading the page
    popover.querySelectorAll<HTMLAnchorElement>('a[data-active-course="true"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closePopover(true);
        });
    });
}

function getPopoverLinks(): HTMLAnchorElement[] {
    const popover = elements.branding.switcherPopover;
    if (!popover) return [];
    return Array.from(popover.querySelectorAll<HTMLAnchorElement>('a[href]'));
}

function deactivateSwitcher(): void {
    closePopover(false);
    visibleSections = [];
    isSwitcherActive = false;

    const trigger = elements.branding.bookTrigger;
    const chevron = elements.branding.switcherChevron;
    if (chevron) {
        chevron.classList.add('hidden');
        chevron.classList.remove('inline-flex', 'rotate-180');
        chevron.innerHTML = '';
    }
    if (trigger) {
        trigger.removeAttribute('aria-haspopup');
        trigger.removeAttribute('aria-expanded');
        trigger.removeAttribute('aria-controls');
        trigger.title = 'Return to first exercise';
    }
}

function activateSwitcher(): void {
    const trigger = elements.branding.bookTrigger;
    const chevron = elements.branding.switcherChevron;
    if (!trigger || !chevron) return;

    isSwitcherActive = true;
    chevron.innerHTML = ICONS.CHEVRON_DOWN;
    chevron.classList.remove('hidden');
    chevron.classList.add('inline-flex');

    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    trigger.setAttribute('aria-controls', 'course-switcher-popover');
    trigger.title = 'Switch course';
}

function openPopover(focusFirstItem = false): void {
    if (!isSwitcherActive || isOpen) return;
    const trigger = elements.branding.bookTrigger;
    const chevron = elements.branding.switcherChevron;
    const popover = elements.branding.switcherPopover;
    if (!trigger || !popover) return;

    renderPopoverContent();

    popover.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('bg-bg-app');
    chevron?.classList.add('rotate-180');
    isOpen = true;

    if (focusFirstItem) {
        const links = getPopoverLinks();
        const activeLink = links.find((a) => a.dataset.activeCourse === 'true');
        (activeLink || links[0])?.focus();
    }
}

export function closePopover(restoreFocus = false): void {
    if (!isOpen) return;
    const trigger = elements.branding.bookTrigger;
    const chevron = elements.branding.switcherChevron;
    const popover = elements.branding.switcherPopover;

    popover?.classList.add('hidden');
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.classList.remove('bg-bg-app');
    chevron?.classList.remove('rotate-180');
    isOpen = false;

    if (restoreFocus && trigger) {
        trigger.focus();
    }
}

function togglePopover(): void {
    if (isOpen) {
        closePopover(false);
    } else {
        openPopover(false);
    }
}

export function initCourseSwitcher(onNavigateFirst: () => void): void {
    const switcherRoot = elements.branding.bookSwitcher;
    const trigger = elements.branding.bookTrigger;
    const popover = elements.branding.switcherPopover;
    if (!switcherRoot || !trigger || !popover) return;

    // Click on <emoji> <title>: navigate to first exercise in standalone mode, or toggle popover when active
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isSwitcherActive) {
            onNavigateFirst();
            return;
        }
        togglePopover();
    });

    // Keyboard open / arrow navigation from trigger
    trigger.addEventListener('keydown', (e) => {
        if (!isSwitcherActive) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                openPopover(true);
            } else {
                const links = getPopoverLinks();
                links[0]?.focus();
            }
        }
    });

    // Keyboard navigation inside popover
    popover.addEventListener('keydown', (e) => {
        if (!isOpen) return;
        const links = getPopoverLinks();
        if (links.length === 0) return;

        const currentIdx = links.indexOf(document.activeElement as HTMLAnchorElement);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % links.length;
            links[nextIdx]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = currentIdx <= 0 ? links.length - 1 : currentIdx - 1;
            links[prevIdx]?.focus();
        } else if (e.key === 'Home') {
            e.preventDefault();
            links[0]?.focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            links[links.length - 1]?.focus();
        }
    });

    // Escape dismissal with focus restoration
    document.addEventListener(
        'keydown',
        (e) => {
            if (isOpen && e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closePopover(true);
            }
        },
        { capture: true }
    );

    // Click-outside dismissal
    document.addEventListener('click', (e) => {
        if (isOpen && !switcherRoot.contains(e.target as Node)) {
            closePopover(false);
        }
    });

    // Dismiss when focus moves outside the switcher (e.g. Tab away or Cmd+K modal)
    switcherRoot.addEventListener('focusout', (e) => {
        if (!isOpen) return;
        const nextFocus = e.relatedTarget as Node | null;
        if (nextFocus && !switcherRoot.contains(nextFocus)) {
            closePopover(false);
        }
    });

    // Ensure popover is closed before entering bfcache
    window.addEventListener('pagehide', () => {
        closePopover(false);
    });

    // Standalone safety: skip fetch completely when directory_url is unavailable
    const directoryUrl = SITE_DIRECTORY_URL;
    if (!directoryUrl) return;

    const applyManifest = (manifest: DirectoryManifest): void => {
        const sections = getVisibleSections(manifest);
        if (sections.length === 0) return;
        visibleSections = sections;
        activateSwitcher();
        if (isOpen) {
            renderPopoverContent();
        }
    };

    // Hydrate instantaneously from sessionStorage cache when available
    const cached = readSessionCache(directoryUrl);
    if (cached) {
        applyManifest(cached);
    }

    // Lazily fetch & revalidate directory.json without blocking startup
    window.setTimeout(() => {
        void fetchDirectoryManifest(directoryUrl).then((manifest) => {
            if (!manifest) return;
            const sections = getVisibleSections(manifest);
            if (sections.length === 0) {
                clearSessionCache(directoryUrl);
                deactivateSwitcher();
                return;
            }
            writeSessionCache(directoryUrl, manifest);
            applyManifest(manifest);
        });
    }, 0);
}
