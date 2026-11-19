#!/usr/bin/env node
/**
 * Scaffold starter template.<ext> files for DSA exercises from canonical-data.json.
 * 
 * Usage:
 *   npx tsx scripts/gen-templates.ts --exercise=<id> [--lang=<id>] [--force]
 *   npx tsx scripts/gen-templates.ts --all [--lang=<id>] [--force]
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT_DIR,
  EXERCISES_DIR,
  parseCliArgs,
  discoverLanguageModules
} from './lib/shared';

async function run() {
  const args = parseCliArgs();

  if (!args.exercise && !args.all) {
    console.error('Usage:');
    console.error('  npx tsx scripts/gen-templates.ts --exercise=<id> [--lang=<id>] [--force]');
    console.error('  npx tsx scripts/gen-templates.ts --all [--lang=<id>] [--force]');
    process.exit(1);
  }

  const languages = await discoverLanguageModules(args.lang);
  if (languages.length === 0) {
    console.error(`No language modules with test-runner.ts found${args.lang ? ` matching '${args.lang}'` : ''}.`);
    process.exit(1);
  }

  if (args.exercise) {
    const canonicalPath = path.join(EXERCISES_DIR, args.exercise, 'canonical-data.json');
    if (!fs.existsSync(canonicalPath)) {
      console.error(`[ERROR] Exercise '${args.exercise}' not found or missing canonical-data.json at: ${canonicalPath}`);
      process.exit(1);
    }
  }

  const exerciseIds = args.all
    ? fs.readdirSync(EXERCISES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && fs.existsSync(path.join(EXERCISES_DIR, d.name, 'canonical-data.json')))
        .map(d => d.name)
    : [args.exercise!];

  if (exerciseIds.length === 0) {
    console.error('[ERROR] No exercises found with canonical-data.json.');
    process.exit(1);
  }

  console.log(`\nScaffolding templates for ${exerciseIds.length} exercise(s) across ${languages.length} language(s)...\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let missingGeneratorCount = 0;

  for (const exId of exerciseIds) {
    const exDir = path.join(EXERCISES_DIR, exId);
    const canonicalPath = path.join(exDir, 'canonical-data.json');

    if (!fs.existsSync(canonicalPath)) {
      console.warn(`[SKIP] Missing canonical-data.json for exercise: ${exId}`);
      continue;
    }

    let canonicalData: any;
    try {
      canonicalData = JSON.parse(fs.readFileSync(canonicalPath, 'utf-8'));
    } catch (err: any) {
      console.error(`[ERROR] Invalid JSON in ${canonicalPath}:`, err?.message);
      continue;
    }

    for (const lang of languages) {
      const targetDir = path.join(exDir, lang.id);
      const targetFile = path.join(targetDir, `template${lang.extension}`);

      if (fs.existsSync(targetFile) && !args.force) {
        skippedCount++;
        continue;
      }

      if (!lang.buildTemplateCode) {
        missingGeneratorCount++;
        console.warn(`[NO-GEN] ${lang.id}: test-runner.ts does not export buildTemplateCode()`);
        continue;
      }

      try {
        const templateCode = lang.buildTemplateCode(canonicalData);
        if (!templateCode || !templateCode.trim()) {
          console.warn(`[EMPTY] ${lang.id}: buildTemplateCode returned empty string for ${exId}`);
          continue;
        }

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.writeFileSync(targetFile, templateCode.trimEnd() + '\n', 'utf-8');
        console.log(`[CREATED] ${path.relative(ROOT_DIR, targetFile)}`);
        createdCount++;
      } catch (err: any) {
        console.error(`[FAIL] ${lang.id} template generation failed for ${exId}:`, err?.message || err);
      }
    }
  }

  console.log(`\nTemplate Scaffolding Summary:`);
  console.log(`  - Created: ${createdCount}`);
  console.log(`  - Skipped (already exists): ${skippedCount}`);
  if (missingGeneratorCount > 0) {
    console.log(`  - Missing buildTemplateCode(): ${missingGeneratorCount}`);
  }
}

run().catch((err) => {
  console.error('Fatal error running template generator:', err);
  process.exit(1);
});
