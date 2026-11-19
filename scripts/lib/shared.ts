import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import toml from 'toml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const EXERCISES_DIR = path.join(ROOT_DIR, 'src', 'exercises');
export const LANGUAGES_DIR = path.join(ROOT_DIR, 'src', 'languages');

export interface BaseCliArgs {
  exercise?: string;
  all?: boolean;
  lang?: string;
  force?: boolean;
}

export function parseCliArgs(): BaseCliArgs {
  const args = process.argv.slice(2);
  const result: BaseCliArgs = {};

  for (const arg of args) {
    if (arg === '--all') {
      result.all = true;
    } else if (arg.startsWith('--exercise=')) {
      result.exercise = arg.split('=')[1];
    } else if (arg.startsWith('--lang=')) {
      result.lang = arg.split('=')[1];
    } else if (arg === '--force' || arg === '-f') {
      result.force = true;
    }
  }

  return result;
}

export interface LanguageModule {
  id: string;
  extension: string;
  harnessCode?: string;
  buildTestCode?: (cases: any[], meta: any) => string;
  buildTemplateCode?: (meta: any) => string;
}

export function getActiveLanguages(): string[] {
  const siteTomlPath = path.join(ROOT_DIR, 'site.toml');
  if (!fs.existsSync(siteTomlPath)) {
    throw new Error(`site.toml not found at ${siteTomlPath}`);
  }

  const content = fs.readFileSync(siteTomlPath, 'utf-8');
  let config: any;
  try {
    config = toml.parse(content);
  } catch (err: any) {
    throw new Error(`Failed to parse site.toml: ${err?.message || err}`);
  }

  if (Array.isArray(config.languages) && config.languages.length > 0) {
    return config.languages.map((l: string) => l.trim()).filter(Boolean);
  }

  if (typeof config.default_language === 'string' && config.default_language.trim()) {
    return [config.default_language.trim()];
  }

  throw new Error(`Could not determine active languages or default_language from ${siteTomlPath}`);
}

export async function discoverLanguageModules(targetLang?: string): Promise<LanguageModule[]> {
  const activeLangs = targetLang ? [targetLang] : getActiveLanguages();
  const modules: LanguageModule[] = [];

  for (const id of activeLangs) {
    const runnerPath = path.join(LANGUAGES_DIR, id, 'test-runner.ts');
    const metadataPath = path.join(LANGUAGES_DIR, id, 'metadata.ts');

    if (!fs.existsSync(runnerPath) || !fs.existsSync(metadataPath)) {
      continue;
    }

    try {
      const metaModule = await import(`file://${metadataPath}`);
      const metadata = metaModule.metadata || metaModule.default;
      const extension = metadata?.extension;

      if (!extension) continue;

      const runnerModule = await import(`file://${runnerPath}`);
      const buildTestCode = runnerModule.buildTestCode || runnerModule.default;
      const buildTemplateCode = runnerModule.buildTemplateCode || runnerModule.default?.buildTemplateCode;

      // Dynamically discover harness file in language directory (e.g. harness.hpp, harness.c, harness.go, etc.)
      let harnessCode: string | undefined;
      const langDir = path.join(LANGUAGES_DIR, id);
      const harnessFile = fs.readdirSync(langDir).find(f => f.startsWith('harness.') && !f.endsWith('.md'));
      if (harnessFile) {
        harnessCode = fs.readFileSync(path.join(langDir, harnessFile), 'utf-8');
      }

      modules.push({
        id,
        extension,
        harnessCode,
        buildTestCode: typeof buildTestCode === 'function' ? buildTestCode : undefined,
        buildTemplateCode: typeof buildTemplateCode === 'function' ? buildTemplateCode : undefined
      });
    } catch (err) {
      console.warn(`[WARN] Could not load language module for '${id}':`, err);
    }
  }

  return modules;
}
