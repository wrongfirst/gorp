import { createLanguageAdapter } from '../base-adapter';

export const runner = createLanguageAdapter(
  'markdown',
  () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
);

export default runner;
