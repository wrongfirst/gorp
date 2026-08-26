import { Chapter } from '../core/types';
import { ICONS } from './icons';
import { store } from '../core/store';

let isListenerBound = false;

const MAX_VISIBLE_STEPS = 5;

export function renderProgressBar(
    container: HTMLElement | null,
    curriculum: Chapter[],
    activeLessonSlug: string,
    completedSlugs: string[]
) {
    if (!container) return;

    if (!isListenerBound) {
        isListenerBound = true;
        container.addEventListener('click', (e) => {
            const item = (e.target as HTMLElement).closest<HTMLElement>('.progress-step');
            if (!item) return;
            const exId = item.getAttribute('data-exercise-id');
            if (exId) {
                window.location.hash = '#' + exId;
                store.getState().setCurrent(exId);
            }
        });
    }

    const currentChapter = curriculum.find(c => c.exercises.some(e => e.id === activeLessonSlug));
    if (!currentChapter || currentChapter.exercises.length <= 1) {
        container.innerHTML = '';
        return;
    }

    const total = currentChapter.exercises.length;
    const nextUncompletedIndex = currentChapter.exercises.findIndex(e => !completedSlugs.includes(e.id));
    let currentIndex = currentChapter.exercises.findIndex(e => e.id === activeLessonSlug);
    if (currentIndex === -1) currentIndex = 0;

    let startIndex = 0;
    let endIndex = total - 1;

    if (total > MAX_VISIBLE_STEPS) {
        const half = Math.floor(MAX_VISIBLE_STEPS / 2);
        startIndex = currentIndex - half;
        endIndex = currentIndex + half;

        if (startIndex < 0) {
            endIndex = Math.min(total - 1, endIndex - startIndex);
            startIndex = 0;
        }
        if (endIndex >= total) {
            startIndex = Math.max(0, startIndex - (endIndex - (total - 1)));
            endIndex = total - 1;
        }
    }

    const showLeftEllipsis = startIndex > 0;
    const showRightEllipsis = endIndex < total - 1;

    let html = '';

    // Left truncation (Chevron Node)
    if (showLeftEllipsis) {
        const prevEx = currentChapter.exercises[startIndex - 1];
        const isPrevCompleted = completedSlugs.includes(prevEx.id);
        const leftLineClass = isPrevCompleted ? 'bg-brand' : 'bg-border-default opacity-50';

        html += `
            <div class="progress-step relative flex items-center group cursor-pointer" data-exercise-id="${prevEx.id}" title="Previous: ${prevEx.title}">
                <div class="w-4 h-4 rounded-full flex items-center justify-center border border-border-default bg-bg-surface group-hover:border-brand transition-all duration-300 z-10">
                    <svg class="w-2.5 h-2.5 text-fg-muted group-hover:text-brand transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </div>
                <div class="w-8 h-0.5 mx-0.5 rounded ${leftLineClass}"></div>
                <!-- tooltip on hover -->
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 pointer-events-none">
                    Previous (${startIndex} before)
                </div>
            </div>
        `;
    }

    // Visible exercise steps
    for (let idx = startIndex; idx <= endIndex; idx++) {
        const e = currentChapter.exercises[idx];
        const isCompleted = completedSlugs.includes(e.id);
        const isNext = idx === nextUncompletedIndex;
        const isLastVisible = idx === endIndex;
        const isActive = e.id === activeLessonSlug;

        // Circle style
        let circleClass = 'border border-border-default bg-bg-surface';
        let content = '';

        if (isNext) {
            circleClass = 'border border-brand bg-bg-surface';
        }

        if (isCompleted) {
            circleClass = 'border border-brand bg-brand';
            content = ICONS.WHITE_CHECK;
        }

        if (isActive) {
            const baseBg = isCompleted ? 'bg-brand' : 'bg-bg-surface';
            circleClass = `border border-brand ${baseBg} shadow-[0_0_6px_3px_color-mix(in_srgb,var(--color-brand)_30%,transparent)]`;
        }

        // Connection line
        let line = '';
        if (!isLastVisible || showRightEllipsis) {
            const lineClass = isCompleted ? 'bg-brand' : 'bg-border-default opacity-50';
            line = `<div class="w-8 h-0.5 mx-0.5 rounded ${lineClass}"></div>`;
        }

        html += `
            <div class="progress-step relative flex items-center group cursor-pointer" data-exercise-id="${e.id}" title="${e.title}">
                <div class="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${circleClass}">
                    ${content}
                </div>
                ${line}
                <!-- tooltip on hover -->
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 pointer-events-none">
                    ${e.title}
                </div>
            </div>
        `;
    }

    // Right truncation (Chevron Node)
    if (showRightEllipsis) {
        const nextEx = currentChapter.exercises[endIndex + 1];

        html += `
            <div class="progress-step relative flex items-center group cursor-pointer" data-exercise-id="${nextEx.id}" title="Next: ${nextEx.title}">
                <div class="w-4 h-4 rounded-full flex items-center justify-center border border-border-default bg-bg-surface group-hover:border-brand transition-all duration-300 z-10">
                    <svg class="w-2.5 h-2.5 text-fg-muted group-hover:text-brand transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
                <!-- tooltip on hover -->
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 pointer-events-none">
                    More (${total - 1 - endIndex} remaining)
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}


