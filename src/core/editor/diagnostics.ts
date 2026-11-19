import { EditorView } from '@codemirror/view';
import { forEachDiagnostic } from '@codemirror/lint';

export interface EditorDiagnostic {
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    from: number;
    to: number;
    line: number;
    column: number;
    source?: string;
}

/**
 * Returns all active diagnostics currently registered on the active CodeMirror editor view.
 */
export function getEditorDiagnostics(view: EditorView | null): EditorDiagnostic[] {
    if (!view) return [];
    const diagnostics: EditorDiagnostic[] = [];
    try {
        forEachDiagnostic(view.state, (diag, from, to) => {
            const lineObj = view.state.doc.lineAt(from);
            diagnostics.push({
                message: diag.message,
                severity: (diag.severity as any) || 'error',
                from,
                to,
                line: lineObj.number,
                column: from - lineObj.from + 1,
                source: diag.source,
            });
        });
    } catch (err) {
        console.warn('[Editor] Error reading diagnostics:', err);
    }
    return diagnostics;
}

/**
 * Formats active editor diagnostics into a human-readable list for LLM context.
 */
export function formatLintMessages(view: EditorView | null): string {
    const diags = getEditorDiagnostics(view);
    if (diags.length === 0) {
        return '';
    }
    return diags
        .map((d) => {
            const sourceStr = d.source ? ` (${d.source})` : '';
            return `[${d.severity.toUpperCase()}] Line ${d.line}, Col ${d.column}: ${d.message}${sourceStr}`;
        })
        .join('\n');
}
