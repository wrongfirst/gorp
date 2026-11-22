import { elements } from '../core/elements';
import { Chapter } from '../core/types';
import { ICONS } from './icons';
import { store } from '../core/store';

const lgMediaQuery = window.matchMedia('(min-width: 1024px)');

let isDesktopOpen = true;
let isDrawerOpen = false;
let isListenerBound = false;

function isDesktopViewport(): boolean {
    return lgMediaQuery.matches;
}

function isSidebarOpen(): boolean {
    return isDesktopViewport() ? isDesktopOpen : isDrawerOpen;
}

function syncSidebarUI() {
    const sidebarNav = elements.sidebar.nav;
    if (!sidebarNav) return;

    const isDesktop = isDesktopViewport();
    const open = isSidebarOpen();

    sidebarNav.classList.toggle('lg:flex', isDesktopOpen);
    sidebarNav.classList.toggle('lg:hidden', !isDesktopOpen);
    sidebarNav.classList.toggle('flex', isDrawerOpen);
    sidebarNav.classList.toggle('hidden', !isDrawerOpen);

    const mobileToggle = elements.sidebar.toggle;
    if (mobileToggle) {
        mobileToggle.innerHTML = open ? ICONS.PANEL_CLOSE : ICONS.PANEL_OPEN;
        mobileToggle.setAttribute('aria-expanded', String(open));
        mobileToggle.title = open ? 'Close Sidebar' : 'Show Exercises';
    }

    const collapseBtn = elements.sidebar.collapseBtn;
    if (collapseBtn) {
        collapseBtn.setAttribute('aria-expanded', String(open));
    }

    const expandBtn = elements.sidebar.expandBtn;
    if (expandBtn) {
        expandBtn.classList.toggle('hidden', open);
        expandBtn.classList.toggle('inline-flex', !open);
        expandBtn.setAttribute('aria-expanded', String(open));
    }

    const chapterTitle = elements.problemChapterTitle;
    if (chapterTitle) {
        chapterTitle.classList.toggle('hidden', open);
    }

    const backdrop = elements.sidebar.backdrop;
    if (backdrop) {
        backdrop.classList.toggle('hidden', !open || isDesktop);
    }
}

function setSidebarOpen(open: boolean) {
    if (isDesktopViewport()) {
        isDesktopOpen = open;
    } else {
        isDrawerOpen = open;
    }
    syncSidebarUI();
}

export function toggleSidebar() {
    if (!elements.sidebar.nav) return;
    setSidebarOpen(!isSidebarOpen());
}

export function renderSidebar(
    sidebarEl: HTMLElement | null,
    curriculum: Chapter[],
    activeLessonSlug: string,
    completedSlugs: string[]
) {
    if (!sidebarEl) return;

    // Attach delegated click listener once to handle clicks reliably
    if (!isListenerBound) {
        isListenerBound = true;
        sidebarEl.addEventListener('click', (e) => {
            const item = (e.target as HTMLElement).closest<HTMLElement>('.nav-item');
            if (!item) return;
            const exId = item.getAttribute('data-exercise-id');
            if (exId) {
                window.location.hash = '#' + exId;
                store.getState().setCurrent(exId);

                // Auto-close drawer on mobile/tablet after selecting an exercise
                if (!isDesktopViewport()) {
                    setSidebarOpen(false);
                }
            }
        });
    }

    sidebarEl.innerHTML = curriculum.map((chapter, chIdx) => {
        const chapterHeader = `<div class="px-[var(--gutter-edge)] pt-1 first:pt-0 pb-0 text-[10px] leading-5 font-bold text-fg-muted uppercase">${chapter.title}</div>`;

        const chapterExercises = chapter.exercises.map((e, exIdx) => {
            const isCompleted = completedSlugs.includes(e.id);
            const active = e.id === activeLessonSlug ? 'text-fg-primary border-l-2 border-brand' : 'text-fg-muted hover:text-fg-primary';
            const completed = isCompleted ? 'opacity-40' : '';
            const displayNum = `${chIdx + 1}.${exIdx + 1}`;

            return `<div class="nav-item cursor-pointer py-2.5 md:py-2 pl-[var(--gutter-edge)] pr-[var(--gutter-dense)] text-sm flex justify-between items-center transition-colors ${active} ${completed}"
                        data-exercise-id="${e.id}">
                      <span>${displayNum} ${e.title}</span>
                      ${isCompleted ? ICONS.CHECK : ''}
                    </div>`;
        }).join('');

        return chapterHeader + chapterExercises;
    }).join('');
}

export function initSidebar() {
    const { nav: sidebarNav, toggle: sidebarToggle, collapseBtn, expandBtn } = elements.sidebar;
    if (!sidebarNav) return;

    if (collapseBtn) {
        collapseBtn.innerHTML = ICONS.PANEL_CLOSE;
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebarOpen(false);
        });
    }

    if (expandBtn) {
        expandBtn.innerHTML = ICONS.PANEL_OPEN;
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebarOpen(true);
        });
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Close drawer when clicking outside (including backdrop and header) on mobile/tablet
    document.addEventListener('click', (e) => {
        if (isDesktopViewport() || !isDrawerOpen) return;

        const target = e.target as HTMLElement;
        const clickedInside = sidebarNav.contains(target);
        const clickedToggle =
            sidebarToggle?.contains(target) ||
            collapseBtn?.contains(target) ||
            expandBtn?.contains(target);

        if (!clickedInside && !clickedToggle) {
            setSidebarOpen(false);
        }
    });

    // Close mobile/tablet drawer on Escape (unless a modal/popover already handled it)
    document.addEventListener('keydown', (e) => {
        if (!e.defaultPrevented && e.key === 'Escape' && !isDesktopViewport() && isDrawerOpen) {
            e.preventDefault();
            setSidebarOpen(false);
        }
    });

    // Keep controls & expand button in sync when crossing lg breakpoint
    lgMediaQuery.addEventListener('change', syncSidebarUI);

    syncSidebarUI();
}
