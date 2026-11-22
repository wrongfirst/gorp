import {
  runVerification,
  type VerificationItemResult
} from '../core/verifier';
import { getEnabledLanguages } from '../languages/language-registry';
import { getExercise, getExerciseDisplayNumber } from '../exercises/exercise-registry';
import { getExerciseVariant } from '../core/types';
import { elements } from '../core/elements';
import { escapeHtml } from '../core/markdown';
import { downloadJsonFile } from './download';
import { ICONS } from './icons';
import { createModal, type ModalController } from './modal';

type StatusFilter = 'all' | 'passed' | 'failed' | 'error' | 'missing_solution';
type SortOrder = 'default' | 'desc' | 'asc';

let isRunning = false;
let abortRequested = false;
let selectedLanguage = 'all';
let speedrunModal: ModalController | null = null;

let activeStatusFilter: StatusFilter = 'all';
let currentSortOrder: SortOrder = 'default';
let allResults: VerificationItemResult[] = [];
const expandedCardIds = new Set<string>();

export function initSpeedrunButton() {
  if (!import.meta.env.DEV) return;

  const btn = elements.speedrunBtn;
  if (!btn) return;

  btn.innerHTML = ICONS.ROCKET;
  btn.classList.add('md:inline-flex');

  btn.addEventListener('click', openSpeedrunModal);
}

function initSpeedrunModal() {
  if (speedrunModal) return;

  if (elements.speedrun.headerIcon) {
    elements.speedrun.headerIcon.innerHTML = ICONS.ROCKET;
  }
  if (elements.speedrun.exportIcon) {
    elements.speedrun.exportIcon.innerHTML = ICONS.DOWNLOAD;
  }
  if (elements.speedrun.sortIcon) {
    elements.speedrun.sortIcon.innerHTML = ICONS.SORT;
  }

  speedrunModal = createModal({
    modal: elements.speedrun.modal,
    closeBtn: elements.speedrun.closeBtn,
    canClose: () => !isRunning,
  });

  // Bind actions
  elements.speedrun.startBtn?.addEventListener('click', handleToggleRun);
  elements.speedrun.exportBtn?.addEventListener('click', handleExportCases);
  elements.speedrun.sortBtn?.addEventListener('click', toggleDurationSort);

  initLanguageSelect();
  initStatusFilters();
}

function initLanguageSelect() {
  const select = elements.speedrun.langSelect;
  if (!select) return;

  const enabledLanguages = getEnabledLanguages();
  const options = [{ id: 'all', name: 'All Languages' }, ...enabledLanguages];

  select.innerHTML = options
    .map((opt) => `<option value="${opt.id}">${opt.name}</option>`)
    .join('');

  select.value = selectedLanguage;

  select.addEventListener('change', () => {
    if (isRunning) return;
    selectedLanguage = select.value;
    updateStartButtonText();
  });
}

function updateStartButtonText() {
  const { startBtnText, langSelect } = elements.speedrun;
  if (!startBtnText) return;

  if (isRunning) return;

  if (selectedLanguage === 'all') {
    startBtnText.textContent = 'Start Speedrun (All)';
  } else {
    const selectedOption = langSelect?.selectedOptions?.[0];
    const name = selectedOption?.textContent || selectedLanguage;
    startBtnText.textContent = `Run ${name}`;
  }
}

function initStatusFilters() {
  const container = elements.speedrun.statusFilters;
  if (!container) return;

  container.querySelectorAll('.speedrun-status-pill').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const filter = (target.dataset.filter || 'all') as StatusFilter;
      setStatusFilter(filter);
    });
  });
}

function setStatusFilter(filter: StatusFilter) {
  activeStatusFilter = filter;
  updateStatusFilterPills();
  renderResultsList();
  updateExportButton();
}

function updateStatusFilterPills() {
  const container = elements.speedrun.statusFilters;
  if (!container) return;

  container.querySelectorAll('.speedrun-status-pill').forEach((el) => {
    const btn = el as HTMLElement;
    const filter = btn.dataset.filter as StatusFilter;
    const isActive = activeStatusFilter === filter;

    btn.className = 'speedrun-status-pill h-[var(--ctrl-sm)] px-2.5 inline-flex items-center rounded font-medium text-xs transition-all cursor-pointer';

    if (isActive) {
      if (filter === 'all') {
        btn.classList.add('bg-brand', 'text-white');
      } else if (filter === 'passed') {
        btn.classList.add('bg-green-500/20', 'text-green-400');
      } else if (filter === 'failed') {
        btn.classList.add('bg-yellow-500/20', 'text-yellow-400');
      } else if (filter === 'error') {
        btn.classList.add('bg-red-500/20', 'text-red-400');
      } else if (filter === 'missing_solution') {
        btn.classList.add('bg-bg-subbar', 'text-fg-primary');
      }
    } else {
      if (filter === 'all') {
        btn.classList.add('bg-bg-editor', 'text-fg-primary', 'hover:bg-bg-subbar');
      } else if (filter === 'passed') {
        btn.classList.add('bg-bg-editor', 'text-green-500', 'hover:bg-green-500/10');
      } else if (filter === 'failed') {
        btn.classList.add('bg-bg-editor', 'text-yellow-500', 'hover:bg-yellow-500/10');
      } else if (filter === 'error') {
        btn.classList.add('bg-bg-editor', 'text-red-500', 'hover:bg-red-500/10');
      } else if (filter === 'missing_solution') {
        btn.classList.add('bg-bg-editor', 'text-fg-muted', 'hover:bg-bg-subbar');
      }
    }
  });
}

function toggleDurationSort() {
  if (currentSortOrder === 'default') {
    currentSortOrder = 'desc';
  } else if (currentSortOrder === 'desc') {
    currentSortOrder = 'asc';
  } else {
    currentSortOrder = 'default';
  }
  updateSortButtonUI();
  renderResultsList();
}

function updateSortButtonUI() {
  const { sortLabel, sortBtn } = elements.speedrun;
  if (!sortLabel) return;

  if (currentSortOrder === 'desc') {
    sortLabel.textContent = 'Sort: Slowest First (↓)';
    sortBtn?.classList.add('text-brand');
  } else if (currentSortOrder === 'asc') {
    sortLabel.textContent = 'Sort: Fastest First (↑)';
    sortBtn?.classList.add('text-brand');
  } else {
    sortLabel.textContent = 'Sort: Default';
    sortBtn?.classList.remove('text-brand');
  }
}

function openSpeedrunModal() {
  initSpeedrunModal();
  updateStartButtonText();
  updateStatusFilterPills();
  updateSortButtonUI();
  updateExportButton();
  speedrunModal?.open();
}

function getExportableResults(): VerificationItemResult[] {
  if (activeStatusFilter === 'all') {
    return allResults;
  }
  return allResults.filter((r) => r.status === activeStatusFilter);
}

function updateExportButton() {
  const { exportBtn, exportText } = elements.speedrun;
  if (!exportBtn) return;

  const currentExportList = getExportableResults();

  if (allResults.length > 0 && currentExportList.length > 0) {
    exportBtn.classList.remove('hidden');
    exportBtn.classList.add('flex');
    exportBtn.removeAttribute('disabled');
    if (exportText) {
      if (activeStatusFilter === 'all') {
        exportText.textContent = `Export All (${currentExportList.length})`;
      } else if (activeStatusFilter === 'failed') {
        exportText.textContent = `Export Failed (${currentExportList.length})`;
      } else if (activeStatusFilter === 'passed') {
        exportText.textContent = `Export Passed (${currentExportList.length})`;
      } else if (activeStatusFilter === 'error') {
        exportText.textContent = `Export Errors (${currentExportList.length})`;
      } else if (activeStatusFilter === 'missing_solution') {
        exportText.textContent = `Export Missing (${currentExportList.length})`;
      }
    }
  } else if (allResults.length > 0) {
    exportBtn.classList.remove('hidden');
    exportBtn.classList.add('flex');
    exportBtn.setAttribute('disabled', 'true');
    if (exportText) {
      exportText.textContent = `Export (0)`;
    }
  } else {
    exportBtn.classList.add('hidden');
    exportBtn.classList.remove('flex');
  }
}

function handleExportCases() {
  const rawList = getExportableResults();
  if (rawList.length === 0) return;

  const exportList = rawList.map((item) => {
    if (item.description !== undefined && item.solutionCode !== undefined && item.testCode !== undefined) {
      return item;
    }
    const ex = getExercise(item.exerciseId);
    const variant = ex ? getExerciseVariant(ex, item.languageId) : undefined;
    return {
      ...item,
      description: item.description ?? ex?.description ?? '',
      solutionCode: item.solutionCode ?? variant?.solutionCode ?? '',
      testCode: item.testCode ?? variant?.testCode ?? ''
    };
  });

  const prefix = activeStatusFilter === 'all' ? 'speedrun-report' : `speedrun-${activeStatusFilter}`;
  downloadJsonFile(prefix, exportList);
}

function getFilteredAndSortedResults(): VerificationItemResult[] {
  let list = [...allResults];

  if (activeStatusFilter !== 'all') {
    list = list.filter((r) => r.status === activeStatusFilter);
  }

  if (currentSortOrder === 'desc') {
    list.sort((a, b) => b.durationMs - a.durationMs);
  } else if (currentSortOrder === 'asc') {
    list.sort((a, b) => a.durationMs - b.durationMs);
  }

  return list;
}

function renderResultsList() {
  const container = elements.speedrun.resultsList;
  if (!container) return;

  const previousScrollTop = container.scrollTop;
  const results = getFilteredAndSortedResults();

  if (results.length === 0) {
    if (allResults.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-fg-muted text-sm flex flex-col items-center gap-2">
          <span>Click <strong>Start Speedrun</strong> to test reference solutions against active runtimes.</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="text-center py-8 text-fg-muted text-xs">
          No test items matching filter "<strong>${activeStatusFilter}</strong>".
        </div>
      `;
    }
    return;
  }

  container.innerHTML = '';
  for (const res of results) {
    appendResultCard(container, res);
  }
  container.scrollTop = previousScrollTop;
}

async function handleToggleRun() {
  if (isRunning) {
    abortRequested = true;
    if (elements.speedrun.startBtnText) elements.speedrun.startBtnText.textContent = 'Stopping...';
    return;
  }

  isRunning = true;
  abortRequested = false;
  allResults = [];
  expandedCardIds.clear();
  activeStatusFilter = 'all';
  updateStatusFilterPills();
  updateSortButtonUI();
  updateExportButton();

  const { startBtn, startBtnText, progressContainer, progressBar, progressStatus, progressCounter, resultsList, stats } = elements.speedrun;

  if (startBtn) {
    startBtn.classList.remove('btn--primary');
    startBtn.classList.add('btn--danger');
  }
  if (startBtnText) {
    startBtnText.textContent = 'Abort Run';
  }
  if (progressContainer) progressContainer.classList.remove('hidden');
  if (progressStatus) progressStatus.textContent = 'Initializing runtimes...';
  if (progressBar) progressBar.style.width = '0%';
  if (progressCounter) progressCounter.textContent = '0 / 0';
  if (stats.all) stats.all.textContent = '0';
  if (stats.passed) stats.passed.textContent = '0';
  if (stats.failed) stats.failed.textContent = '0';
  if (stats.errors) stats.errors.textContent = '0';
  if (stats.missing) stats.missing.textContent = '0';
  if (stats.time) stats.time.textContent = '0.00s';
  if (resultsList) resultsList.innerHTML = '';

  let passedCount = 0;
  let failedCount = 0;
  let errorCount = 0;
  let missingCount = 0;

  const startTime = performance.now();

  try {
    await runVerification({
      languageId: selectedLanguage === 'all' ? undefined : selectedLanguage,
      shouldAbort: () => abortRequested,
      onProgress: (prog) => {
        const percent = Math.round((prog.current / prog.total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressCounter) progressCounter.textContent = `${prog.current} / ${prog.total}`;

        if (prog.currentItem && !prog.latestResult) {
          if (progressStatus) {
            const displayNum = getExerciseDisplayNumber(prog.currentItem.exerciseId);
            const title = displayNum ? `${displayNum} ${prog.currentItem.exerciseTitle}` : (prog.currentItem.exerciseTitle || prog.currentItem.exerciseId);
            progressStatus.textContent = `Running ${title} (${prog.currentItem.languageId})...`;
          }
        }

        if (prog.latestResult) {
          const res = prog.latestResult;
          allResults.push(res);

          if (res.status === 'passed') passedCount++;
          else if (res.status === 'failed') failedCount++;
          else if (res.status === 'error') errorCount++;
          else if (res.status === 'missing_solution') missingCount++;

          if (stats.all) stats.all.textContent = String(allResults.length);
          if (stats.passed) stats.passed.textContent = String(passedCount);
          if (stats.failed) stats.failed.textContent = String(failedCount);
          if (stats.errors) stats.errors.textContent = String(errorCount);
          if (stats.missing) stats.missing.textContent = String(missingCount);
          if (stats.time) stats.time.textContent = `${((performance.now() - startTime) / 1000).toFixed(2)}s`;

          if (activeStatusFilter === 'all' || activeStatusFilter === res.status) {
            if (currentSortOrder === 'default') {
              if (resultsList) {
                if (resultsList.querySelector('.text-center')) {
                  resultsList.innerHTML = '';
                }
                appendResultCard(resultsList, res);
              }
            } else {
              renderResultsList();
            }
          }
          updateExportButton();
        }
      }
    });

    if (progressStatus) {
      progressStatus.textContent = abortRequested ? 'Verification Aborted' : 'Verification Complete';
    }
  } catch (err: any) {
    if (progressStatus) progressStatus.textContent = `Error: ${err?.message || err}`;
  } finally {
    isRunning = false;
    abortRequested = false;
    updateExportButton();
    if (startBtn) {
      startBtn.classList.remove('btn--danger');
      startBtn.classList.add('btn--primary');
    }
    updateStartButtonText();
  }
}

function appendResultCard(container: HTMLElement, result: VerificationItemResult) {
  const badgeColors: Record<string, { bg: string; text: string; label: string }> = {
    passed: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', label: 'PASS' },
    failed: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'FAIL' },
    error: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'ERROR' },
    missing_solution: { bg: 'bg-zinc-500/10 border-zinc-500/30', text: 'text-zinc-400', label: 'MISSING' }
  };

  const badge = badgeColors[result.status] || badgeColors.error;
  const hasLogs = Boolean(result.error || result.output);
  const cardId = `speedrun-card-${result.exerciseId.replace(/\./g, '_')}-${result.languageId}`;
  const displayNum = getExerciseDisplayNumber(result.exerciseId);
  const titleText = displayNum ? `${displayNum} ${result.exerciseTitle}` : result.exerciseTitle;
  const isExpanded = expandedCardIds.has(cardId);

  const card = document.createElement('div');
  card.className = 'transition-colors text-xs';

  card.innerHTML = `
    <div class="px-6 py-2.5 flex items-center justify-between cursor-pointer hover:bg-bg-editor/60 transition-colors" data-toggle="${cardId}">
      <div class="flex items-center gap-3">
        <span class="px-2 py-0.5 font-bold uppercase rounded text-[10px] border ${badge.bg} ${badge.text}">
          ${badge.label}
        </span>
        <span class="font-semibold text-fg-primary">${escapeHtml(titleText)}</span>
        <span class="font-mono text-fg-muted text-[11px]">${result.languageId}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-mono text-fg-muted">${result.durationMs}ms</span>
        ${hasLogs ? `<span data-details-label="${cardId}" class="text-fg-muted text-[10px] underline">${isExpanded ? 'Hide' : 'Details'}</span>` : ''}
      </div>
    </div>
    ${hasLogs
      ? `
      <div id="${cardId}" class="${isExpanded ? '' : 'hidden '}px-6 py-3 bg-bg-editor space-y-2 font-mono text-[11px]">
        ${result.error
        ? `<div><span class="text-red-400 font-bold block mb-1">Error / Failure:</span><pre class="overflow-x-auto text-red-300 whitespace-pre-wrap">${escapeHtml(result.error)}</pre></div>`
        : ''
      }
        ${result.output
        ? `<div><span class="text-fg-muted block mb-1">Standard Output:</span><pre class="overflow-x-auto whitespace-pre-wrap">${escapeHtml(result.output)}</pre></div>`
        : ''
      }
      </div>
    `
      : ''
    }
  `;

  if (hasLogs) {
    const toggleBtn = card.querySelector(`[data-toggle="${cardId}"]`);
    const details = card.querySelector(`#${cardId}`);
    const detailsLabel = card.querySelector(`[data-details-label="${cardId}"]`);
    toggleBtn?.addEventListener('click', () => {
      if (!details) return;
      const isHidden = details.classList.contains('hidden');
      if (isHidden) {
        details.classList.remove('hidden');
        expandedCardIds.add(cardId);
        if (detailsLabel) detailsLabel.textContent = 'Hide';
      } else {
        details.classList.add('hidden');
        expandedCardIds.delete(cardId);
        if (detailsLabel) detailsLabel.textContent = 'Details';
      }
    });
  }

  container.appendChild(card);
}

