import { parseCheatsheet } from './parser';
import type { CheatsheetItem } from './types';
import { enabledLanguageIds } from '../../languages/language-registry';

const cheatsheetModules = import.meta.glob<string>(
  '../../../cheatsheets/**/*.{md,markdown}',
  { query: '?raw', eager: true, import: 'default' }
);

let cachedItems: CheatsheetItem[] | null = null;

export function loadAllCheatsheets(): CheatsheetItem[] {
  if (cachedItems !== null) {
    return cachedItems;
  }

  const items: CheatsheetItem[] = [];
  const enabledSet = new Set(enabledLanguageIds.map(id => id.toLowerCase()));

  for (const path in cheatsheetModules) {
    const raw = cheatsheetModules[path];
    const content = typeof raw === 'string' ? raw : (raw as { default?: string })?.default || '';
    if (!content.trim()) continue;

    const segments = path.split('/');
    const filename = segments.pop()?.replace(/\.(md|markdown)$/i, '') || '';
    const parentDir = segments.pop() || '';
    const candidateLang = parentDir && parentDir.toLowerCase() !== 'cheatsheets' ? parentDir : filename;
    const fallbackLang = candidateLang.toLowerCase() !== 'cheatsheet' ? candidateLang.toLowerCase() : '';

    const parsed = parseCheatsheet(content, fallbackLang || undefined);
    const enabledParsed = parsed.filter(item => enabledSet.has(item.language.toLowerCase()));

    if (enabledParsed.length > 0) {
      items.push(...enabledParsed);
    }
  }

  cachedItems = items;
  return cachedItems;
}

export function getAllCheatsheets(): CheatsheetItem[] {
  return cachedItems !== null ? cachedItems : loadAllCheatsheets();
}
