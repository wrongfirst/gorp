import { linter, type Diagnostic } from '@codemirror/lint';
import type { Text, Extension } from '@codemirror/state';
import type { CodeRunner } from '../core/types';
import type { DiagnosticItem } from './types';

/**
 * Converts generic DiagnosticItem entries (line/column based or offset based)
 * into CodeMirror Diagnostic objects with accurate 0-based character offsets.
 */
export function convertDiagnostics(
  items: DiagnosticItem[],
  doc: Text,
  defaultSource = 'linter'
): Diagnostic[] {
  const result: Diagnostic[] = [];

  for (const item of items) {
    let from = 0;
    let to = 0;

    if (item.from !== undefined && item.to !== undefined) {
      from = Math.max(0, Math.min(item.from, doc.length));
      to = Math.max(from, Math.min(item.to, doc.length));
      if (from === to && from < doc.length) {
        to = from + 1;
      }
    } else if (item.line !== undefined) {
      const lineNum = Math.max(1, Math.min(item.line, doc.lines));
      const lineObj = doc.line(lineNum);
      const col = item.column !== undefined ? item.column : 1;
      from = Math.max(lineObj.from, Math.min(lineObj.from + Math.max(0, col - 1), lineObj.to));

      if (item.endLine !== undefined && item.endColumn !== undefined) {
        const endLineNum = Math.max(1, Math.min(item.endLine, doc.lines));
        const endLineObj = doc.line(endLineNum);
        to = Math.max(from, Math.min(endLineObj.from + Math.max(0, item.endColumn - 1), endLineObj.to));
      } else if (item.endColumn !== undefined) {
        to = Math.max(from, Math.min(lineObj.from + Math.max(0, item.endColumn - 1), lineObj.to));
      } else {
        to = lineObj.to;
      }

      if (from === to && from < doc.length) {
        to = Math.min(from + 1, doc.length);
      } else if (from === to && from > 0 && from === doc.length) {
        from = Math.max(0, from - 1);
      }
    } else {
      from = 0;
      to = Math.min(1, doc.length);
    }

    result.push({
      from,
      to,
      severity: item.severity || 'error',
      message: item.message,
      source: item.source || defaultSource
    });
  }

  return result;
}

export type RunnerOrGetter =
  | { lint?: (code: string) => Promise<DiagnosticItem[]> }
  | CodeRunner
  | (() => ({ lint?: (code: string) => Promise<DiagnosticItem[]> } | CodeRunner | null | undefined));

let dynamicRunnerLookup: ((id: string) => CodeRunner | null) | null = null;

export function setLanguageRunnerLookup(lookup: (id: string) => CodeRunner | null) {
  dynamicRunnerLookup = lookup;
}

/**
 * Creates a standard CodeMirror lint Extension for any CodeRunner (or runner getter) that supports .lint(code).
 */
export function createLanguageLinter(
  runnerOrGetter: RunnerOrGetter,
  langId: string,
  options?: { delay?: number }
): Extension {
  const delay = options?.delay ?? 300;
  return linter(
    async (view) => {
      const code = view.state.doc.toString();
      if (!code.trim()) return [];

      const runner = typeof runnerOrGetter === 'function' ? runnerOrGetter() : runnerOrGetter;
      if (!runner || typeof runner.lint !== 'function') return [];

      // If runner has a getStatus method, ensure it is ready before invoking lint
      if (typeof (runner as any).getStatus === 'function') {
        const status = (runner as any).getStatus();
        if (status !== 'ready') return [];
      }

      try {
        const items = await runner.lint(code);
        return convertDiagnostics(items, view.state.doc, langId);
      } catch (err) {
        console.warn(`[${langId} Linter Error]:`, err);
        return [];
      }
    },
    { delay }
  );
}

/**
 * Creates a lazy dynamic linter for a language ID without requiring static adapter imports.
 */
export function createDynamicLanguageLinter(langId: string, options?: { delay?: number }): Extension {
  return createLanguageLinter(() => (dynamicRunnerLookup ? dynamicRunnerLookup(langId) : null), langId, options);
}
