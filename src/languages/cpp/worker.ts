import harness from './harness.hpp?raw';
import { WASI, File, OpenFile, ConsoleStdout, WASIProcExit } from '@bjorn3/browser_wasi_shim';
import { createWorkerHandler } from '../base-worker';
import type { DiagnosticItem } from '../types';

// We import @yowasp/clang types only (erased at runtime)
import type { Command as YowaspCommand, Tree as YowaspTree } from '@yowasp/clang';

const CLANG_CDN_URL = 'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js';

let runClang: YowaspCommand | null = null;
let isClangReady = false;
let clangReadyPromise: Promise<void> | null = null;
let cachedPchBytes: Uint8Array | null = null;

async function ensureClangReady(): Promise<void> {
  if (isClangReady && runClang) return;
  if (clangReadyPromise) return clangReadyPromise;

  clangReadyPromise = (async () => {
    try {
      // Load from CDN to ensure import.meta.url inside the package resolves to the CDN,
      // avoiding Vite bundling issues and local 404s.
      const yowaspClang = await import(/* @vite-ignore */ CLANG_CDN_URL);

      runClang = (
        yowaspClang.runClang ||
        yowaspClang.commands?.clang ||
        yowaspClang.default?.runClang
      ) as YowaspCommand;

      if (!runClang) {
        throw new Error("Failed to find runClang in the loaded module");
      }

      // Warm up Clang and attempt to precompile the harness header into a PCH
      try {
        const pchRes = await runClang(
          ['clang++', '-x', 'c++-header', '-std=c++20', '-fno-exceptions', '-Xclang', '-fno-pch-timestamp', 'harness.hpp', '-o', 'harness.pch'],
          { 'harness.hpp': harness },
          {
            stdout: () => {},
            stderr: () => {}
          }
        ) as YowaspTree | undefined;

        const pch = pchRes?.['harness.pch'];
        if (pch && pch instanceof Uint8Array) {
          cachedPchBytes = pch;
        }
      } catch (pchErr) {
        console.warn('[C++ Worker] PCH precompilation skipped, using direct include fallback:', pchErr);
        cachedPchBytes = null;
      }

      if (!cachedPchBytes) {
        // Fallback warmup via standard version check if PCH generation was skipped
        await runClang(['clang++', '--version'], {}, {
          stdout: () => {},
          stderr: () => {}
        });
      }

      isClangReady = true;
    } catch (err) {
      console.error('[C++ Worker] Clang++ warmup failed:', err);
      clangReadyPromise = null;
      throw err;
    }
  })();

  return clangReadyPromise;
}

function prepareSourceCode(userCode: string, testCode: string = '', includeHarnessText = true): string {
  const mainRegex = /\b(?:int\s+)?main\s*\(/;
  const testHasMain = mainRegex.test(testCode);
  const userHasMain = mainRegex.test(userCode);

  let fullCode = '';
  if (includeHarnessText) {
    fullCode += harness + '\n\n';
  }

  if (testHasMain && userHasMain) {
    // If userCode defines a main() while testCode also provides main(), isolate user's main
    fullCode += '#define main __user_unused_main\n';
    fullCode += '#line 1 "user.cpp"\n' + userCode + '\n\n';
    fullCode += '#undef main\n';
  } else {
    fullCode += '#line 1 "user.cpp"\n' + userCode + '\n\n';
  }

  if (testCode.trim()) {
    fullCode += '#line 1 "test.cpp"\n' + testCode + '\n';
  }

  // Fallback: If neither provided a main entry point, synthesize an empty one
  if (!testHasMain && !userHasMain) {
    fullCode += '\nint main(int argc, char** argv) {\n    return 0;\n}\n';
  }

  return fullCode;
}

function parseClangDiagnostics(stderrOutput: string): DiagnosticItem[] {
  if (!stderrOutput || !stderrOutput.trim()) return [];

  const diags: DiagnosticItem[] = [];
  // Match lines like: user.cpp:12:5: error: expected ';' after expression
  // or: ./user.cpp:12:5: fatal error: 'foo.h' file not found
  const diagRegex = /(?:(?:\.\/)?user\.cpp):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.*)/g;

  let match: RegExpExecArray | null;
  let lastDiag: DiagnosticItem | null = null;

  while ((match = diagRegex.exec(stderrOutput)) !== null) {
    const line = parseInt(match[1], 10) || 1;
    const column = parseInt(match[2], 10) || 1;
    const type = match[3];
    const message = match[4].trim();

    if (type === 'note') {
      // Attach contextual note to the previous nearby diagnostic if available
      if (lastDiag && Math.abs((lastDiag.line || 1) - line) <= 1) {
        lastDiag.message += ` (note: ${message})`;
      }
      continue;
    }

    const item: DiagnosticItem = {
      line,
      column,
      endLine: line,
      endColumn: column + 1,
      message,
      severity: (type === 'error' || type === 'fatal error') ? 'error' : 'warning',
      source: 'clang++'
    };

    diags.push(item);
    lastDiag = item;
  }

  return diags;
}

function formatCompileError(compileStderr: string): string {
  if (!compileStderr) return '';

  const lines = compileStderr.split('\n');
  const formatted: string[] = [];

  for (const line of lines) {
    if (line.includes('test.cpp:')) {
      const cleaned = line.replace(/test\.cpp:\d+:\d+:\s*(fatal error|error|warning):\s*/, '');
      formatted.push(`[Function Signature Mismatch] Test harness compilation error:\n  -> ${cleaned}`);
    } else {
      formatted.push(line);
    }
  }

  return formatted.join('\n');
}

createWorkerHandler({
  async init() {
    await ensureClangReady();
  },

  async execute(userCode: string, testCode: string = '') {
    await ensureClangReady();

    const usePch = Boolean(cachedPchBytes);
    const source = prepareSourceCode(userCode, testCode, !usePch);
    let compileStderr = '';

    const decoder = new TextDecoder('utf-8');

    const clangArgs = ['clang++', '-std=c++20', '-fno-exceptions', '-O0', '-Wall', '-Wno-unused-variable', '-Wno-unused-function'];
    const virtualFiles: Record<string, Uint8Array | string> = { 'main.cpp': source };

    if (usePch && cachedPchBytes) {
      clangArgs.push('-include-pch', 'harness.pch');
      virtualFiles['harness.pch'] = cachedPchBytes;
      virtualFiles['harness.hpp'] = harness;
    }

    clangArgs.push('main.cpp', '-o', 'main.wasm');

    let outputFiles: YowaspTree | undefined;
    try {
      const res = await runClang!(
        clangArgs,
        virtualFiles,
        {
          stdout: () => {},
          stderr: (bytes: Uint8Array | null) => {
            if (bytes) {
              compileStderr += decoder.decode(bytes, { stream: true });
            }
          }
        }
      );
      outputFiles = res as YowaspTree | undefined;
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: formatCompileError(compileStderr) || err?.message || String(err)
      };
    }

    const wasmBytes = outputFiles?.['main.wasm'];
    if (!wasmBytes || typeof wasmBytes === 'string' || !(wasmBytes instanceof Uint8Array)) {
      return {
        success: false,
        output: '',
        error: formatCompileError(compileStderr) || 'Compilation failed: no WebAssembly binary was generated.'
      };
    }

    // Run compiled WASM module via browser WASI shim
    let stdoutText = '';
    let stderrText = '';

    const stdoutFd = new ConsoleStdout((buffer: Uint8Array) => {
      stdoutText += decoder.decode(buffer, { stream: true });
    });

    const stderrFd = new ConsoleStdout((buffer: Uint8Array) => {
      stderrText += decoder.decode(buffer, { stream: true });
    });

    const stdinFd = new OpenFile(new File(new Uint8Array(0)));

    const wasi = new WASI(['main.wasm'], [], [stdinFd, stdoutFd, stderrFd]);

    try {
      const wasmResult: any = await WebAssembly.instantiate(wasmBytes, {
        wasi_snapshot_preview1: wasi.wasiImport
      });
      const instance = wasmResult.instance || wasmResult;

      let exitCode = 0;
      try {
        wasi.start(instance as any);
      } catch (err: any) {
        if (err instanceof WASIProcExit) {
          exitCode = err.code;
        } else {
          throw err;
        }
      }

      // Flush remaining decoded characters
      stdoutText += decoder.decode();
      stderrText += decoder.decode();

      const success = exitCode === 0;
      return {
        success,
        output: stdoutText,
        error: success ? (stderrText || undefined) : (stderrText || `Process exited with code ${exitCode}`)
      };
    } catch (runtimeErr: any) {
      return {
        success: false,
        output: stdoutText,
        error: runtimeErr?.message || String(runtimeErr)
      };
    }
  },

  async lint(userCode: string): Promise<DiagnosticItem[]> {
    if (!userCode.trim()) return [];

    try {
      await ensureClangReady();

      const usePch = Boolean(cachedPchBytes);
      const source = prepareSourceCode(userCode, '', !usePch);
      let compileStderr = '';
      const decoder = new TextDecoder('utf-8');

      const clangArgs = ['clang++', '-std=c++20', '-fno-exceptions', '-fsyntax-only', '-Wall'];
      const virtualFiles: Record<string, Uint8Array | string> = { 'main.cpp': source };

      if (usePch && cachedPchBytes) {
        clangArgs.push('-include-pch', 'harness.pch');
        virtualFiles['harness.pch'] = cachedPchBytes;
        virtualFiles['harness.hpp'] = harness;
      }

      clangArgs.push('main.cpp');

      try {
        await runClang!(
          clangArgs,
          virtualFiles,
          {
            stdout: () => {},
            stderr: (bytes: Uint8Array | null) => {
              if (bytes) {
                compileStderr += decoder.decode(bytes, { stream: true });
              }
            }
          }
        );
      } catch {
        // Compiler error expected when code has syntax errors
      }

      return parseClangDiagnostics(compileStderr);
    } catch (err) {
      console.warn('[C++ Worker Lint Error]:', err);
      return [];
    }
  },

  async reset() {
    isClangReady = false;
    clangReadyPromise = null;
    cachedPchBytes = null;
    await ensureClangReady();
  }
});
