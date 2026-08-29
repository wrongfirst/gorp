import type { LanguageMetadata } from '../types';

export const metadata: LanguageMetadata = {
  id: 'cpp',
  name: 'C++',
  extension: '.cpp',
  cmLanguage: 'cpp',
  weight: 'heavy',
  prefetchUrls: [
    'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js'
  ]
};

export default metadata;
