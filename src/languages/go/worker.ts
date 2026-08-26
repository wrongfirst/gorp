import harness from './harness.go?raw';
import wasmExecRaw from './wasm_exec.js?raw';
import yaegiWasmUrl from './yaegi.wasm?url';
import { createWorkerHandler } from '../base-worker';
import type { DiagnosticItem } from '../types';

let goInstance: any = null;
let compiledWasmModule: WebAssembly.Module | null = null;

async function ensureGoRunning(): Promise<void> {
  if (goInstance && !goInstance.exited && typeof (self as any).yaegiRun === 'function') {
    return;
  }

  // Clear previous function bindings if instance exited
  delete (self as any).yaegiRun;
  delete (self as any).yaegiLint;
  delete (self as any).yaegiEval;

  // 1. Evaluate wasm_exec.js into worker scope to define self.Go
  (0, eval)(wasmExecRaw);

  if (typeof (self as any).Go !== 'function') {
    throw new Error('Failed to load Go WebAssembly bridge (Go constructor not found).');
  }

  goInstance = new (self as any).Go();

  // 2. Fetch and compile WASM module if not already cached
  if (!compiledWasmModule) {
    const response = await fetch(yaegiWasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to load yaegi.wasm: HTTP ${response.status}`);
    }
    const wasmBuffer = await response.arrayBuffer();
    compiledWasmModule = await WebAssembly.compile(wasmBuffer);
  }

  const instance = await WebAssembly.instantiate(compiledWasmModule, goInstance.importObject);

  // 3. Start Go main loop (which sets self.yaegiRun, self.yaegiLint, self.yaegiEval)
  goInstance.run(instance).catch((err: any) => {
    console.warn('[Go WASM Runtime Exited]:', err);
  });

  if (typeof (self as any).yaegiRun !== 'function') {
    throw new Error('yaegiRun is not available after WebAssembly initialization.');
  }
}

createWorkerHandler({
  async init() {
    await ensureGoRunning();
  },

  async execute(userCode: string, testCode: string = '') {
    await ensureGoRunning();

    if (typeof (self as any).yaegiRun === 'function') {
      try {
        const res = (self as any).yaegiRun(harness, userCode, testCode);
        return {
          success: Boolean(res?.success),
          output: res?.output || '',
          error: res?.error || undefined
        };
      } catch (err: any) {
        if (goInstance) {
          goInstance.exited = true;
        }
        return {
          success: false,
          output: '',
          error: err?.message || String(err)
        };
      }
    }
    throw new Error('WASM interpreter binary (yaegi.wasm) is not loaded.');
  },

  async lint(userCode: string): Promise<DiagnosticItem[]> {
    if (!userCode.trim()) return [];

    try {
      await ensureGoRunning();
      if (typeof (self as any).yaegiLint !== 'function') return [];

      const rawDiags = (self as any).yaegiLint(harness, userCode);
      if (!Array.isArray(rawDiags)) return [];

      return rawDiags.map((d: any) => ({
        line: typeof d.line === 'number' ? d.line : 1,
        column: typeof d.column === 'number' ? d.column : 1,
        message: String(d.message || ''),
        severity: d.severity || 'error',
        source: 'go'
      }));
    } catch (err: any) {
      console.warn('[Go Worker Lint Error]:', err);
      if (goInstance && String(err).includes('exited')) {
        goInstance.exited = true;
      }
      return [];
    }
  },

  async reset() {
    if (goInstance) {
      goInstance.exited = true;
    }
    await ensureGoRunning();
  }
});
