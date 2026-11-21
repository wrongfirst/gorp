import { elements } from '../core/elements';
import { Chapter } from '../core/types';
import { ICONS } from './icons';
import { store } from '../core/store';

const LG_BREAKPOINT = 1024;

let isListenerBound = false;

function isSidebarVisible(sidebarNav: HTMLElement): boolean {
    if (window.innerWidth >= LG_BREAKPOINT) {
        return sidebarNav.classList.contains('lg:flex');
    }
    return !sidebarNav.classList.contains('hidden');
}

function syncSidebarControls() {
    const sidebarNav = elements.sidebar.nav;
    if (!sidebarNav) return;

    const open = isSidebarVisible(sidebarNav);
    const isDesktop = window.innerWidth >= LG_BREAKPOINT;

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

export function setSidebarOpen(open: boolean) {
    const sidebarNav = elements.sidebar.nav;
    if (!sidebarNav) return;

    if (window.innerWidth >= LG_BREAKPOINT) {
        sidebarNav.classList.toggle('lg:flex', open);
        sidebarNav.classList.toggle('lg:hidden', !open);
    } else {
        sidebarNav.classList.toggle('flex', open);
        sidebarNav.classList.toggle('hidden', !open);
    }

    syncSidebarControls();
}

export function toggleSidebar() {
    const sidebarNav = elements.sidebar.nav;
    if (!sidebarNav) return;
    setSidebarOpen(!isSidebarVisible(sidebarNav));
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

                // Auto-close sidebar on mobile/tablet after selecting an exercise
                if (window.innerWidth < LG_BREAKPOINT) {
                    setSidebarOpen(false);
                }
            }
        });
    }

    sidebarEl.innerHTML = curriculum.map((chapter, chIdx) => {
        const chapterHeader = `<div class="px-4 sm:px-8 pt-1 first:pt-0 pb-0 text-[10px] leading-5 font-bold text-fg-muted uppercase">${chapter.title}</div>`;

        const chapterExercises = chapter.exercises.map((e, exIdx) => {
            const isCompleted = completedSlugs.includes(e.id);
            const active = e.id === activeLessonSlug ? 'text-fg-primary border-l-2 border-brand' : 'text-fg-muted hover:text-fg-primary';
            const completed = isCompleted ? 'opacity-40' : '';
            const displayNum = `${chIdx + 1}.${exIdx + 1}`;

            return `<div class="nav-item cursor-pointer py-2 pl-4 sm:pl-8 pr-4 text-sm flex justify-between items-center transition-colors ${active} ${completed}"
                        data-exercise-id="${e.id}">
                      <span>${displayNum} ${e.title}</span>
                      ${isCompleted ? ICONS.CHECK : ''}
                    </div>`;
        }).join('');

        return chapterHeader + chapterExercises;
    }).join('');
}

export function initSidebarToggle(
    sidebarToggle: HTMLElement | null,
    sidebarNav: HTMLElement | null
) {
    if (!sidebarNav) return;

    const collapseBtn = elements.sidebar.collapseBtn;
    const expandBtn = elements.sidebar.expandBtn;
    const backdrop = elements.sidebar.backdrop;

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

    if (backdrop) {
        backdrop.addEventListener('click', () => setSidebarOpen(false));
    }

    // Close logic when clicking outside on mobile/tablet
    document.addEventListener('click', (e) => {
        if (window.innerWidth >= LG_BREAKPOINT || !isSidebarVisible(sidebarNav)) return;

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

    // Keep controls & expand button in sync across lg breakpoint resizes
    window.addEventListener('resize', syncSidebarControls);

    syncSidebarControls();
}
