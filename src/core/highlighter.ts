import hljs from 'highlight.js';
import { escapeHtml } from './markdown';

export function highlightCodeSnippet(code: string, lang?: string): string {
  const normalized = (lang || '').trim().toLowerCase();

  if (normalized && hljs.getLanguage(normalized)) {
    try {
      return hljs.highlight(code, { language: normalized, ignoreIllegals: true }).value;
    } catch {
      return escapeHtml(code);
    }
  }

  return escapeHtml(code);
}

