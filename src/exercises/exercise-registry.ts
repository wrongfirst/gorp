import curriculumConfig from './curriculum.yaml';
import { Exercise, Chapter, LanguageVariant, type ExerciseValidator } from '../core/types';
import { enabledLanguageIds } from '../languages/language-registry';
import { flattenCases } from '../languages/canonical';
import type { CanonicalData, FlatCanonicalTestCase } from '../languages/canonical';

// Discover all problem.md files dynamically
const problemFiles = import.meta.glob<string>(
  './*/problem.md',
  { query: '?raw', import: 'default', eager: true }
);

// Discover all static exercise assets across exercise folders
const exerciseAssets = import.meta.glob<string>(
  './*/assets/*.{png,svg,jpg,jpeg,gif,webp}',
  { import: 'default', eager: true }
);

function resolveExerciseAssets(folder: string, markdown: string): string {
  if (!markdown) return '';
  // 1. Resolve markdown image syntax: ![alt](./assets/filename.ext) or ![alt](assets/filename.ext)
  let resolved = markdown.replace(
    /!\[(.*?)\]\(\s*(?:\.\/)?assets\/([^\s)]+)(?:\s+["'](.*?)["'])?\s*\)/g,
    (match, alt, filename, title) => {
      const assetKey = `./${folder}/assets/${filename}`;
      const bundledUrl = exerciseAssets[assetKey];
      if (!bundledUrl) return match;
      const titleAttr = title ? ` "${title}"` : '';
      return `![${alt}](${bundledUrl}${titleAttr})`;
    }
  );

  // 2. Resolve HTML <img> src attribute: <img src="./assets/filename.ext" ...>
  resolved = resolved.replace(
    /<img\b([^>]*?)\bsrc=["'](?:\.\/)?assets\/([^"']+)["']([^>]*?)>/gi,
    (match, pre, filename, post) => {
      const assetKey = `./${folder}/assets/${filename}`;
      const bundledUrl = exerciseAssets[assetKey];
      if (!bundledUrl) return match;
      return `<img${pre}src="${bundledUrl}"${post}>`;
    }
  );

  return resolved;
}

// Discover canonical-data.json files across exercise folders
const canonicalDataFiles = import.meta.glob<CanonicalData>(
  './*/canonical-data.json',
  { import: 'default', eager: true }
);

// Discover colocated language test-runner generators
const testRunnerModules = import.meta.glob<{
  buildTestCode?: (cases: FlatCanonicalTestCase[], meta: CanonicalData) => string;
  default?: (cases: FlatCanonicalTestCase[], meta: CanonicalData) => string;
}>(
  '../languages/*/test-runner.ts',
  { eager: true }
);

// Discover template, test, and solution files across all exercise subfolders
const templateFiles = import.meta.glob<string>(
  './*/*/template.*',
  { query: '?raw', import: 'default', eager: true }
);

const testFiles = import.meta.glob<string>(
  './*/*/test.*',
  { query: '?raw', import: 'default', eager: true }
);

const solutionFiles = import.meta.glob<string>(
  './*/*/solution.*',
  { query: '?raw', import: 'default', eager: true }
);

type ValidatorModule = {
  default?: ExerciseValidator;
  validate?: ExerciseValidator;
};

// Discover optional exercise-level (shared) and language-level (override) validators
const sharedValidatorFiles = import.meta.glob<ValidatorModule>(
  './*/validator.ts',
  { eager: true }
);

const sharedValidatorRawFiles = import.meta.glob<string>(
  './*/validator.ts',
  { query: '?raw', import: 'default', eager: true }
);

const langValidatorFiles = import.meta.glob<ValidatorModule>(
  './*/*/validator.ts',
  { eager: true }
);

const langValidatorRawFiles = import.meta.glob<string>(
  './*/*/validator.ts',
  { query: '?raw', import: 'default', eager: true }
);

function generateId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Format exercise title from directory name
function formatTitle(folder: string): string {
  return folder
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const rawChapters: Array<{ title: string; id?: string; exercises?: string[] }> =
  curriculumConfig?.chapters
    ? Object.entries(curriculumConfig.chapters).map(([title, exercises]) => ({
        title,
        exercises: Array.isArray(exercises) ? (exercises as string[]) : []
      }))
    : [];

export const curriculum: Chapter[] = rawChapters.map((ch) => {
  const chapterId = ch.id || generateId(ch.title);

  const exerciseList: Exercise[] = (ch.exercises || [])
    .map((folder) => {
      const exId = folder;
      const problemPath = `./${folder}/problem.md`;
      const rawDescription = problemFiles[problemPath] || '';
      const description = resolveExerciseAssets(folder, rawDescription);
      const title = formatTitle(folder);

      const exercise: Exercise = {
        id: exId,
        title,
        description,
        variants: {}
      };

      return exercise;
    });

  return {
    id: chapterId,
    title: ch.title,
    exercises: exerciseList
  };
});

// Helper to auto-discover and attach variants from subfolders
function attachDiscoveredVariants(chapterList: Chapter[]) {
  const discoveredMap: Record<string, Record<string, LanguageVariant>> = {};

  for (const path in templateFiles) {
    const match = path.match(/^\.\/([^/]+)\/([^/]+)\/template\..+$/);
    if (!match) continue;
    const [, folder, langId] = match;

    if (!enabledLanguageIds.includes(langId)) continue;

    const initialCode = templateFiles[path] || '';

    let testCode = '';
    const canonicalPath = `./${folder}/canonical-data.json`;
    const canonicalData = canonicalDataFiles[canonicalPath];

    if (canonicalData) {
      const runnerPath = `../languages/${langId}/test-runner.ts`;
      const runnerMod = testRunnerModules[runnerPath];
      const buildFn = runnerMod?.buildTestCode || runnerMod?.default;
      if (buildFn) {
        const cases = flattenCases(canonicalData.cases);
        testCode = buildFn(cases, canonicalData);
      }
    }

    if (!testCode) {
      const testPathKey = Object.keys(testFiles).find(p => p.startsWith(`./${folder}/${langId}/test.`));
      testCode = testPathKey ? (testFiles[testPathKey] || '') : '';
    }

    const solutionPathKey = Object.keys(solutionFiles).find(p => p.startsWith(`./${folder}/${langId}/solution.`));
    const solutionCode = solutionPathKey ? (solutionFiles[solutionPathKey] || '') : '';

    const langValidatorPath = `./${folder}/${langId}/validator.ts`;
    const sharedValidatorPath = `./${folder}/validator.ts`;
    const validatorMod = langValidatorFiles[langValidatorPath] || sharedValidatorFiles[sharedValidatorPath];
    const validateFn = validatorMod?.validate || validatorMod?.default;
    const validatorCode = langValidatorRawFiles[langValidatorPath] || sharedValidatorRawFiles[sharedValidatorPath] || '';

    if (!discoveredMap[folder]) {
      discoveredMap[folder] = {};
    }
    discoveredMap[folder][langId] = {
      initialCode,
      testCode,
      ...(solutionCode ? { solutionCode } : {}),
      ...(validatorCode ? { validatorCode } : {}),
      ...(validateFn ? { validate: validateFn } : {})
    };
  }

  rawChapters.forEach((ch, chapterIndex) => {
    const chapterObj = chapterList[chapterIndex];
    if (!chapterObj) return;

    (ch.exercises || []).forEach((folder, exerciseIndex) => {
      const ex = chapterObj.exercises[exerciseIndex];
      if (!ex) return;

      if (!ex.variants) {
        ex.variants = {};
      }

      if (discoveredMap[folder]) {
        for (const langId in discoveredMap[folder]) {
          ex.variants[langId] = { ...discoveredMap[folder][langId] };
        }
      }
    });
  });
}

export const exercises: Exercise[] = curriculum.flatMap(c => c.exercises);

// Attach discovered variants automatically
attachDiscoveredVariants(curriculum);

export const getExercise = (id: string) => {
  return exercises.find(e => e.id === id) || exercises[0];
};

export function isValidExerciseId(id: string): boolean {
  return Boolean(id && exercises.some((e) => e.id === id.trim()));
}

export function getExerciseDisplayNumber(exerciseId: string): string {
  for (let chIdx = 0; chIdx < curriculum.length; chIdx++) {
    const exIdx = curriculum[chIdx].exercises.findIndex(e => e.id === exerciseId);
    if (exIdx !== -1) {
      return `${chIdx + 1}.${exIdx + 1}`;
    }
  }
  return '';
}



