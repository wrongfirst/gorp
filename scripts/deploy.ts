#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWorkerName, pruneDeployments, RETENTION_LIMIT } from './prune-deployments.ts';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROUTE_DOMAIN = 'wrongfirst.dev';

interface WranglerConfig {
  $schema?: string;
  name?: string;
  account_id?: string;
  workers_dev?: boolean;
  routes?: Array<{ pattern: string; zone_name: string }>;
  assets?: {
    directory?: string;
    html_handling?: string;
    not_found_handling?: string;
    base_path?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function buildDeployConfig(workerName: string): WranglerConfig {
  // Plain JSON.parse: wrangler.jsonc must stay comment-free (also parsed by prune-deployments.ts).
  const baseConfig = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'wrangler.jsonc'), 'utf8')
  ) as WranglerConfig;
  const { $schema: _schema, ...rest } = baseConfig;

  const assetsDir = path.resolve(ROOT_DIR, baseConfig.assets?.directory ?? './dist');

  return {
    ...rest,
    name: workerName,
    workers_dev: false,
    routes: [
      { pattern: `${ROUTE_DOMAIN}/${workerName}`, zone_name: ROUTE_DOMAIN },
      { pattern: `${ROUTE_DOMAIN}/${workerName}/*`, zone_name: ROUTE_DOMAIN },
    ],
    assets: {
      ...baseConfig.assets,
      directory: assetsDir,
      base_path: `/${workerName}`,
      html_handling: baseConfig.assets?.html_handling ?? 'auto-trailing-slash',
    },
  };
}

async function main(): Promise<void> {
  const workerName = getWorkerName();
  console.log(`[deploy] Building and deploying Worker: ${workerName}`);

  console.log('\n[deploy] Step 1: Building project...');
  const build = spawnSync('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit' });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  console.log(
    `\n[deploy] Step 2: Deploying Worker '${workerName}' to https://${ROUTE_DOMAIN}/${workerName}/...`
  );
  const safePrefix = workerName.replace(/[^a-zA-Z0-9_-]/g, '-');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `codebook-wrangler-${safePrefix}-`));
  const tmpConfigPath = path.join(tmpDir, 'wrangler.json');
  let deployStatus: number | null;
  try {
    const deployConfig = buildDeployConfig(workerName);
    fs.writeFileSync(tmpConfigPath, JSON.stringify(deployConfig, null, 2));

    const deploy = spawnSync('npx', ['wrangler', 'deploy', '--latest', '--config', tmpConfigPath], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    deployStatus = deploy.status;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (deployStatus !== 0) {
    process.exit(deployStatus ?? 1);
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
