import { Chapter } from '../core/types';
import { ICONS } from './icons';
import { store } from '../core/store';

let isListenerBound = false;

const MAX_TOTAL_VISIBLE = 7;

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
            const gap = (e.target as HTMLElement).closest<HTMLElement>('.progress-shift-gap');
            if (gap) {
                const targetId = gap.getAttribute('data-target-exercise-id');
                if (targetId) {
                    window.location.hash = '#' + targetId;
                    store.getState().setCurrent(targetId);
                }
                return;
            }
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

    const exercises = currentChapter.exercises;
    const total = exercises.length;
    let currentIndex = exercises.findIndex(e => e.id === activeLessonSlug);
    if (currentIndex === -1) currentIndex = 0;

    // Calculate display items (0-indexed indices into exercises array)
    let displayIndices: number[] = [];

    if (total <= MAX_TOTAL_VISIBLE) {
        for (let i = 0; i < total; i++) displayIndices.push(i);
    } else {
        let midStart = currentIndex - 2;
        let midEnd = currentIndex + 2;

        if (midStart <= 1) {
            midStart = 1;
            midEnd = 5;
        }
        if (midEnd >= total - 2) {
            midEnd = total - 2;
            midStart = total - 6;
        }

        displayIndices.push(0);
        for (let i = midStart; i <= midEnd; i++) displayIndices.push(i);
        displayIndices.push(total - 1);
    }

    let trackHtml = '';

    for (let idx = 0; idx < displayIndices.length; idx++) {
        const i = displayIndices[idx];
        const ex = exercises[i];
        const isLast = idx === displayIndices.length - 1;
        const nextIdx = !isLast ? displayIndices[idx + 1] : null;

        const isCompleted = completedSlugs.includes(ex.id);
        const isActive = ex.id === activeLessonSlug;

        // Node Styling (Fixed 28x28 Slot)
        let circleClass = "w-5 h-5 rounded-full border border-border-default bg-bg-surface text-fg-muted flex items-center justify-center font-mono tabular-nums text-[10px]";
        let content = `${i + 1}`;

        if (isCompleted) {
            circleClass = "w-5 h-5 rounded-full border border-brand bg-brand text-white flex items-center justify-center";
            content = ICONS.WHITE_CHECK;
        }

        if (isActive) {
            circleClass = "w-6 h-6 rounded-full border-2 border-brand bg-bg-surface text-brand font-mono tabular-nums text-xs font-bold flex items-center justify-center";
            content = `${i + 1}`;
            if (isCompleted) {
                circleClass = "w-6 h-6 rounded-full border-2 border-fg-primary bg-brand text-white font-bold flex items-center justify-center";
                content = ICONS.WHITE_CHECK;
            }
        }

        // Connecting Line Logic (Fixed Width)
        let lineHtml = '';
        if (!isLast && nextIdx !== null) {
            const isGap = (nextIdx - i) > 1;
            const isLineCompleted = isCompleted;

            if (isGap) {
                const isLeftGap = idx === 0;
                // If left gap, jump to exercise right before midStart; if right gap, jump to exercise right after midEnd
                const targetJumpIdx = isLeftGap ? displayIndices[1] - 1 : displayIndices[idx] + 1;
                const targetJumpEx = exercises[targetJumpIdx];

                const colorClass = isLineCompleted ? 'border-brand' : 'border-border-default opacity-60';

                lineHtml = `
                    <div class="progress-shift-gap w-5 sm:w-7 h-7 flex items-center justify-center cursor-pointer shrink-0 group/dash" data-target-exercise-id="${targetJumpEx.id}" title="${isLeftGap ? 'Previous exercises' : 'Next exercises'}">
                        <div class="w-full h-0 border-t-2 border-dashed ${colorClass} group-hover/dash:border-brand transition-colors"></div>
                    </div>
                `;
            } else {
                const colorClass = isLineCompleted ? 'border-brand' : 'border-border-default opacity-60';
                lineHtml = `
                    <div class="w-5 sm:w-7 h-7 flex items-center justify-center shrink-0">
                        <div class="w-full h-0 border-t-2 border-solid ${colorClass}"></div>
                    </div>
                `;
            }
        }

        trackHtml += `
            <div class="progress-step w-7 h-7 flex items-center justify-center shrink-0 group relative cursor-pointer" data-exercise-id="${ex.id}">
                <div class="transition-transform duration-200 ${circleClass}">
                    ${content}
                </div>
                <!-- Tooltip -->
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30 pointer-events-none text-fg-primary">
                    ${ex.title} ${isCompleted ? '✓' : ''}
                </div>
            </div>
            ${lineHtml}
        `;
    }

    container.innerHTML = `
        <div class="flex items-center justify-center py-1">
            ${trackHtml}
        </div>
    `;
}
