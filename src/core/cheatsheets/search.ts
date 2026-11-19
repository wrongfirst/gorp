import { Fzf } from 'fzf';
import { getAllCheatsheets } from './loader';
import { escapeHtml } from '../markdown';
import type { CheatsheetItem, CheatsheetSearchResult } from './types';

function getLanguageKeywordMap(items: CheatsheetItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    const lang = item.language.toLowerCase();
    map.set(lang, lang);
    if (item.badge) {
      map.set(item.badge.toLowerCase(), lang);
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        map.set(alias.toLowerCase(), lang);
      }
    }
  }
  return map;
}

export function parseQueryLanguage(
  query: string,
  langMap: Map<string, string>
): { explicitLang: string | null; cleanQuery: string } {
  const tokens = query.trim().split(/\s+/);
  if (tokens.length === 0 || !tokens[0]) {
    return { explicitLang: null, cleanQuery: '' };
  }

  let explicitLang: string | null = null;
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    const normalized = token.toLowerCase();

    if (!explicitLang && langMap.has(normalized)) {
      explicitLang = langMap.get(normalized)!;
    } else {
      remainingTokens.push(token);
    }
  }

  return {
    explicitLang,
    cleanQuery: remainingTokens.join(' ').trim(),
  };
}

export function searchCheatsheets(
  query: string,
  currentLangId: string
): CheatsheetSearchResult[] {
  const allItems = getAllCheatsheets();
  const normalizedCurrent = (currentLangId || '').trim().toLowerCase();
  const langMap = getLanguageKeywordMap(allItems);

  const { explicitLang, cleanQuery } = parseQueryLanguage(query, langMap);

  let pool: CheatsheetItem[];
  if (explicitLang) {
    pool = allItems.filter(item => item.language === explicitLang);
  } else {
    pool = allItems;
  }

  if (!cleanQuery) {
    const sorted = explicitLang
      ? pool
      : [
          ...pool.filter(item => item.language === normalizedCurrent),
          ...pool.filter(item => item.language !== normalizedCurrent),
        ];

    return sorted.map(item => ({
      item,
      score: 0,
      positions: new Set<number>(),
    }));
  }

  const titleFzf = new Fzf(pool, {
    selector: (item: CheatsheetItem) => item.title,
    casing: 'smart-case',
  });
  const titleMatches = titleFzf.find(cleanQuery);

  const matchedIds = new Set(titleMatches.map(m => m.item.id));
  const remaining = pool.filter(item => !matchedIds.has(item.id));

  let contentMatches: typeof titleMatches = [];
  if (remaining.length > 0) {
    const contentFzf = new Fzf(remaining, {
      selector: (item: CheatsheetItem) => item.searchableText,
      casing: 'smart-case',
    });
    contentMatches = contentFzf.find(cleanQuery);
  }

  const results: CheatsheetSearchResult[] = [
    ...titleMatches.map(m => ({
      item: m.item,
      score: m.score + 1000 + (!explicitLang && m.item.language === normalizedCurrent ? 500 : 0),
      positions: m.positions,
    })),
    ...contentMatches.map(m => ({
      item: m.item,
      score: m.score + (!explicitLang && m.item.language === normalizedCurrent ? 500 : 0),
      positions: new Set<number>(),
    })),
  ];

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function formatHighlightedTitle(title: string, positions: Set<number>): string {
  if (!positions || positions.size === 0) {
    return escapeHtml(title);
  }

  let html = '';
  let inMark = false;

  for (let i = 0; i < title.length; i++) {
    const isMatch = positions.has(i);
    if (isMatch && !inMark) {
      html += '<mark class="search-highlight">';
      inMark = true;
    } else if (!isMatch && inMark) {
      html += '</mark>';
      inMark = false;
    }
    html += escapeHtml(title[i]);
  }

  if (inMark) {
    html += '</mark>';
  }

  return html;
}
