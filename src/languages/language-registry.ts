import { siteConfig } from '../core/siteConfig';
import type { Extension } from '@codemirror/state';
import type { CodeRunner } from '../core/types';
import type { LanguageMetadata } from './types';
import { createLanguageLinter, setLanguageRunnerLookup } from './lint-helper';

// Discover metadata and syntax extensions synchronously for immediate UI rendering
const metadataModules = import.meta.glob<{ metadata?: LanguageMetadata; default?: LanguageMetadata }>(
  './*/metadata.ts',
  { eager: true }
);

// Discover adapters as lazy dynamic imports (loaded on-demand for enabled languages)
const adapterModules = import.meta.glob<{ runner?: CodeRunner; default?: CodeRunner; [key: string]: any }>(
  './*/adapter.ts'
);

const syntaxModules = import.meta.glob<{ syntaxExtension?: Extension; lintExtension?: Extension; default?: Extension }>(
  './*/syntax.ts',
  { eager: true }
);

const linterModules = import.meta.glob<{ lintExtension?: Extension; default?: Extension }>(
  './*/linter.ts',
  { eager: true }
);

// Maps for metadata, syntax, and linters
const metadataMap = new Map<string, LanguageMetadata>();
const syntaxMap = new Map<string, Extension>();
const linterMap = new Map<string, Extension>();

for (const path in metadataModules) {
  const match = path.match(/\.\/([^/]+)\/metadata\.ts$/);
  if (!match) continue;
  const langId = match[1];

  const metaMod = metadataModules[path];
  const metadata = metaMod.metadata || metaMod.default;

  if (metadata) {
    metadataMap.set(langId, metadata);
  }

  const syntaxPath = `./${langId}/syntax.ts`;
  const syntaxMod = syntaxModules[syntaxPath];
  const syntax = syntaxMod ? (syntaxMod.syntaxExtension || syntaxMod.default) : undefined;
  if (syntax) {
    syntaxMap.set(langId, syntax);
  }

  const linterPath = `./${langId}/linter.ts`;
  const linterMod = linterModules[linterPath];
  const linter = linterMod ? (linterMod.lintExtension || linterMod.default) : undefined;
  if (linter) {
    linterMap.set(langId, linter);
  }
}

// Extract site config for enabled languages & default language
const config = siteConfig;
const allDiscoveredIds = Array.from(metadataMap.keys());

const rawLanguages: string[] = Array.isArray(config.languages)
  ? config.languages
  : (config.default_language ? [config.default_language] : allDiscoveredIds);

export const enabledLanguageIds = rawLanguages.filter(id => metadataMap.has(id));

export const defaultLanguageId: string =
  config.default_language ||
  (enabledLanguageIds.length > 0 ? enabledLanguageIds[0] : (allDiscoveredIds[0] || ''));

// Cache for loaded CodeRunner instances and pending load promises
const runnerCache = new Map<string, CodeRunner>();
const runnerLoadPromises = new Map<string, Promise<CodeRunner>>();

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const nav = navigator as any;

  // 1. Direct hardware memory constraint detection (devices with <= 4GB RAM)
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) {
    return true;
  }

  // 2. Modern Client Hints API
  if (nav.userAgentData?.mobile !== undefined) {
    return Boolean(nav.userAgentData.mobile);
  }

  // 3. Media Query (coarse touch pointer + mobile viewport)
  if (typeof window.matchMedia === 'function') {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isMobileWidth = window.matchMedia('(max-width: 768px)').matches;
    if (isTouch && isMobileWidth) return true;
  }

  // 4. Fallback touch and screen check
  const isSmallScreen = typeof window.innerWidth === 'number' && window.innerWidth <= 768;
  const hasTouch = typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 1;
  return isSmallScreen && hasTouch;
}

// Track active heavy language runners for LRU eviction
const activeHeavyRunners: string[] = [];

export function notifyLanguageActivated(id: string): void {
  const meta = metadataMap.get(id);
  if (!meta || meta.weight !== 'heavy') return;

  const idx = activeHeavyRunners.indexOf(id);
  if (idx !== -1) {
    activeHeavyRunners.splice(idx, 1);
  }
  activeHeavyRunners.push(id);

  const maxAllowed = isMobileDevice() ? 1 : 2;

  while (activeHeavyRunners.length > maxAllowed) {
    const oldestId = activeHeavyRunners.shift();
    if (oldestId && oldestId !== id) {
      const runner = runnerCache.get(oldestId);
      if (runner && typeof runner.terminate === 'function') {
        try {
          runner.terminate();
        } catch (err) {
          console.warn(`[LanguageRegistry] Failed to terminate evicted runner '${oldestId}':`, err);
        }
      }
    }
  }
}

export function getEnabledLanguages(): LanguageMetadata[] {
  return enabledLanguageIds
    .map(id => metadataMap.get(id))
    .filter((meta): meta is LanguageMetadata => meta !== undefined);
}

export function getLanguageMetadata(id: string): LanguageMetadata | undefined {
  return metadataMap.get(id);
}

export function getLoadedLanguageRunner(id: string): CodeRunner | null {
  return runnerCache.get(id) || null;
}

setLanguageRunnerLookup(getLoadedLanguageRunner);

export async function loadLanguageRunner(id: string): Promise<CodeRunner> {
  if (!enabledLanguageIds.includes(id)) {
    throw new Error(
      `Language '${id}' is not enabled in site.toml.\n` +
      `Enabled languages: ${enabledLanguageIds.join(', ')}`
    );
  }

  notifyLanguageActivated(id);

  if (runnerCache.has(id)) {
    return runnerCache.get(id)!;
  }

  if (runnerLoadPromises.has(id)) {
    return runnerLoadPromises.get(id)!;
  }

  const adapterPath = `./${id}/adapter.ts`;
  const importFn = adapterModules[adapterPath];
  if (!importFn) {
    throw new Error(
      `Adapter module for language '${id}' is not registered under 'src/languages/${id}/adapter.ts'.`
    );
  }

  const promise = importFn().then((adapterMod) => {
    const runner = adapterMod.runner || adapterMod.default || Object.values(adapterMod)[0];
    if (!runner) {
      throw new Error(`Failed to find CodeRunner export in 'src/languages/${id}/adapter.ts'.`);
    }
    runnerCache.set(id, runner);
    runnerLoadPromises.delete(id);
    return runner;
  }).catch((err) => {
    runnerLoadPromises.delete(id);
    throw err;
  });

  runnerLoadPromises.set(id, promise);
  return promise;
}

export function getLanguageSyntax(id: string): Extension | undefined {
  return syntaxMap.get(id);
}

export function getLanguageLinter(id: string): Extension | undefined {
  if (linterMap.has(id)) {
    return linterMap.get(id);
  }
  const autoLinter = createLanguageLinter(() => getLoadedLanguageRunner(id), id);
  linterMap.set(id, autoLinter);
  return autoLinter;
}

export function getLanguageExtension(id: string): Extension {
  const syntax = syntaxMap.get(id);
  const linter = getLanguageLinter(id);
  const extensions: Extension[] = [];
  if (syntax) extensions.push(syntax);
  if (linter) extensions.push(linter);
  return extensions;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const prefetchedUrls = new Set<string>();

function prefetchUrl(url: string): void {
  if (!url || prefetchedUrls.has(url) || typeof document === 'undefined') return;
  prefetchedUrls.add(url);
  try {
    if ('fetch' in window) {
      fetch(url, { mode: 'cors', priority: 'low' as any }).catch(() => {});
    } else {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
  } catch { }
}

let isPrefetching = false;

/**
 * Downloads adapter bundles and CDN compiler assets into browser HTTP cache
 * during browser idle time, without creating Web Workers or allocating WebAssembly RAM.
 */
export async function prefetchInactiveLanguageAssets(activeLangId?: string): Promise<void> {
  if (isPrefetching) return;
  isPrefetching = true;

  const activeId = activeLangId || defaultLanguageId;
  const otherLangIds = enabledLanguageIds.filter(id => id !== activeId);

  for (const langId of otherLangIds) {
    try {
      await sleep(200);

      // 1. Prefetch the dynamic adapter JS module (adapter is lazy, so no worker is spawned)
      const adapterPath = `./${langId}/adapter.ts`;
      const importFn = adapterModules[adapterPath];
      if (importFn) {
        await importFn().catch(() => {});
      }

      // 2. Prefetch heavy external CDN compiler scripts declared in metadata
      const meta = metadataMap.get(langId);
      if (meta?.prefetchUrls) {
        for (const url of meta.prefetchUrls) {
          prefetchUrl(url);
        }
      }
    } catch (err) {
      console.warn(`[LanguageRegistry] Asset prefetch for '${langId}' deferred:`, err);
    }
  }
}

export async function prewarmBackgroundLanguages(activeLangId?: string): Promise<void> {
  return prefetchInactiveLanguageAssets(activeLangId);
}

