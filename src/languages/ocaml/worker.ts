import harness from './harness.ml?raw';
import toplevelUrl from './toplevel.bc.js.gz?url';
import { createWorkerHandler } from '../base-worker';
import type { DiagnosticItem } from '../types';

interface OCamlResult {
  out: string;
  err: string;
  success: boolean;
}

interface OCamlRuntime {
  run: (code: string) => OCamlResult;
  reset?: () => void;
}

function getOCamlRuntime(): OCamlRuntime | undefined {
  const fromSelf = (self as unknown as { ocaml?: OCamlRuntime }).ocaml;
  if (fromSelf && typeof fromSelf.run === 'function') return fromSelf;

  const fromGlobal = (globalThis as unknown as { ocaml?: OCamlRuntime }).ocaml;
  if (fromGlobal && typeof fromGlobal.run === 'function') return fromGlobal;

  return undefined;
}

function parseOCamlDiagnostics(errText: string, harnessLines: number): DiagnosticItem[] {
  if (!errText || !errText.trim()) return [];

  const diagnostics: DiagnosticItem[] = [];
  const regex = /(?:File "[^"]*", |Line |line )?line (\d+), characters (\d+)-(\d+):[\s\S]*?(Error|Warning[^\n:]*):\s*([\s\S]*?)(?=(?:File "[^"]*", |Line |line \d+, characters)|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(errText)) !== null) {
    const rawLine = parseInt(match[1], 10) || 1;
    const colStart = parseInt(match[2], 10) || 0;
    const colEnd = parseInt(match[3], 10) || (colStart + 1);
    const kind = match[4].toLowerCase();
    const rawMessage = match[5].trim().replace(/\s+/g, ' ');

    let userLine = rawLine;
    if (harnessLines > 0 && userLine > harnessLines) {
      userLine = userLine - harnessLines;
    } else if (harnessLines > 0 && userLine <= harnessLines) {
      userLine = 1;
    }

    const severity: 'error' | 'warning' = kind.startsWith('warning') ? 'warning' : 'error';

    diagnostics.push({
      line: userLine,
      column: colStart + 1,
      endLine: userLine,
      endColumn: colEnd + 1,
      severity,
      message: rawMessage,
      source: 'ocaml'
    });
  }

  if (diagnostics.length === 0 && (errText.toLowerCase().includes('error') || errText.toLowerCase().includes('syntax') || errText.toLowerCase().includes('failure'))) {
    diagnostics.push({
      line: 1,
      column: 1,
      severity: 'error',
      message: errText.trim().replace(/\s+/g, ' '),
      source: 'ocaml'
    });
  }

  return diagnostics;
}

function stripHarnessSignatures(output: string): string {
  if (!output) return '';
  let cleaned = output;

  // Remove module signature blocks (e.g. module Tests : sig ... end)
  cleaned = cleaned.replace(/^module\s+\w+\s*:\s*(?:sig[\s\S]*?end|[\s\S]*?end)\n?/gm, '');

  // Remove multi-line and single-line type signatures printed by the REPL
  cleaned = cleaned.replace(/^type\s+[\s\S]*?;\s*}/gm, '');
  cleaned = cleaned.replace(/^type\s+[^\n]*\n?/gm, '');

  // Remove val bindings printed by the REPL (e.g. val create_list_node : int -> list_node = <fun>)
  cleaned = cleaned.replace(/^val\s+[\s\S]*?=\s*<fun>\n?/gm, '');
  cleaned = cleaned.replace(/^val\s+[^\n]*\n?/gm, '');

  // Remove anonymous toplevel signatures (e.g. "- : unit = ()")
  cleaned = cleaned.replace(/^-\s*:\s*[^\n]*\n?/gm, '');

  return cleaned.trim();
}

createWorkerHandler({
  async init() {
    const response = await fetch(toplevelUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching toplevel.bc.js.gz`);
    }

    let buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, 2);
    // If the server served with Content-Encoding: gzip, the browser already decompressed it.
    // Otherwise, manually decompress if still gzip-compressed (magic bytes 0x1f, 0x8b).
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = new Response(buffer).body!.pipeThrough(ds);
      buffer = await new Response(decompressedStream).arrayBuffer();
    }

    const script = new TextDecoder().decode(buffer);
    // Indirect eval: (0, eval)(...) runs in global scope in sloppy mode (required for `with()` statements in js_of_ocaml)
    (0, eval)(script);

    if (!getOCamlRuntime()) {
      throw new Error('OCaml compiler runtime (ocaml.run) was not found after script execution');
    }
  },

  execute(userCode: string, testCode: string = '') {
    const ocaml = getOCamlRuntime();

    if (!ocaml || !ocaml.run) {
      return {
        success: false,
        output: '',
        error: 'OCaml compiler not initialized in worker'
      };
    }

    const harnessLines = harness ? harness.split('\n').length : 0;
    const combinedCode = `${harness}\n${userCode}\n${testCode};;`;

    try {
      const result = ocaml.run(combinedCode);
      const cleanOutput = stripHarnessSignatures(result.out || '');
      const errText = (result.err || '').trim();

      // Check if stderr contains actual fatal errors vs non-fatal warnings
      const diagnostics = parseOCamlDiagnostics(errText, harnessLines);
      const hasFatalErrors = diagnostics.some(d => d.severity === 'error') ||
        (!result.success && errText.length > 0 && !diagnostics.every(d => d.severity === 'warning'));

      if (hasFatalErrors) {
        return {
          success: false,
          output: cleanOutput,
          error: errText || 'OCaml execution failed'
        };
      }

      // If there are only warnings, include them in stdout output without failing the test
      const fullOutput = errText ? (cleanOutput ? `${cleanOutput}\n${errText}` : errText) : cleanOutput;

      return {
        success: true,
        output: fullOutput,
        error: undefined
      };
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: err?.message || String(err)
      };
    }
  },

  lint(code: string): DiagnosticItem[] {
    if (!code.trim()) return [];
    const ocaml = getOCamlRuntime();
    if (!ocaml || !ocaml.run) return [];

    const harnessLines = harness ? harness.split('\n').length : 0;
    const combinedCode = harness ? `${harness}\n${code}\n;;` : `${code}\n;;`;

    try {
      const result = ocaml.run(combinedCode);
      if (!result.err || !result.err.trim()) {
        return [];
      }
      return parseOCamlDiagnostics(result.err, harnessLines);
    } catch (err: any) {
      console.warn('[OCaml Worker Lint Error]:', err);
      return [];
    }
  },

  reset() {
    const ocaml = getOCamlRuntime();
    if (ocaml && typeof ocaml.reset === 'function') {
      try {
        ocaml.reset();
      } catch (err) {
        console.warn('[OCaml Reset Warning]:', err);
      }
    }
  }
});
