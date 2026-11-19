import type { LanguageMetadata } from '../types';

export const metadata: LanguageMetadata = {
  id: 'python',
  name: 'Python',
  extension: '.py',
  cmLanguage: 'python',
  weight: 'heavy',
  prefetchUrls: [
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide-lock.json`,
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.asm.mjs`,
  ]
};

export default metadata;
