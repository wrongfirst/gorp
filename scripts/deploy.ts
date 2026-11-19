#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWorkerName, pruneDeployments, RETENTION_LIMIT } from './prune-deployments.ts';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main(): Promise<void> {
  const workerName = getWorkerName();
  console.log(`[deploy] Building and deploying Worker: ${workerName}`);

  console.log('\n[deploy] Step 1: Building project...');
  const build = spawnSync('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit' });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  console.log(`\n[deploy] Step 2: Deploying to Cloudflare Workers with name '${workerName}'...`);
  const deploy = spawnSync('npx', ['wrangler', 'deploy', '--latest', `--name=${workerName}`], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  if (deploy.status !== 0) {
    process.exit(deploy.status ?? 1);
  }

  console.log(`\n[deploy] Step 3: Pruning old deployments (max ${RETENTION_LIMIT} retained)...`);
  try {
    await pruneDeployments(workerName);
  } catch (err: any) {
    console.warn(`[deploy] Warning: Pruning failed - ${err.message}`);
  }

  console.log('\n[deploy] Deployment completed successfully.');
}

main().catch(err => {
  console.error(`[deploy] Unexpected error: ${err.message}`);
  process.exit(1);
});
