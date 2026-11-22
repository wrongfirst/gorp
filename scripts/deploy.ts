#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DeployEnv,
  getDeployEnv,
  getRoutePath,
  getWorkerName,
  pruneDeployments,
  RETENTION_LIMIT,
} from './prune-deployments.ts';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PROD_DOMAIN = 'wrongfirst.dev';
const DEFAULT_STAGING_DOMAIN = 'next.wrongfirst.dev';
const DEFAULT_ROUTE_ZONE = 'wrongfirst.dev';

export interface DeployTarget {
  deployEnv: DeployEnv;
  workerName: string;
  routeDomain: string;
  routeZone: string;
  routePath: string;
}

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

export function resolveDeployTarget(env: NodeJS.ProcessEnv = process.env): DeployTarget {
  const deployEnv = getDeployEnv(env);
  const routePath = getRoutePath(env);
  const workerName = getWorkerName(env);
  const routeDomain =
    env.ROUTE_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') ||
    (deployEnv === 'staging' ? DEFAULT_STAGING_DOMAIN : DEFAULT_PROD_DOMAIN);
  const routeZone = env.ROUTE_ZONE?.trim() || DEFAULT_ROUTE_ZONE;

  return {
    deployEnv,
    workerName,
    routeDomain,
    routeZone,
    routePath,
  };
}

export function buildDeployConfig(target: DeployTarget): WranglerConfig {
  // Plain JSON.parse: wrangler.jsonc must stay comment-free (also parsed by prune-deployments.ts).
  const baseConfig = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'wrangler.jsonc'), 'utf8')
  ) as WranglerConfig;
  const { $schema: _schema, ...rest } = baseConfig;

  const assetsDir = path.resolve(ROOT_DIR, baseConfig.assets?.directory ?? './dist');

  return {
    ...rest,
    name: target.workerName,
    workers_dev: false,
    routes: [
      { pattern: `${target.routeDomain}/${target.routePath}`, zone_name: target.routeZone },
      { pattern: `${target.routeDomain}/${target.routePath}/*`, zone_name: target.routeZone },
    ],
    assets: {
      ...baseConfig.assets,
      directory: assetsDir,
      base_path: `/${target.routePath}`,
      html_handling: baseConfig.assets?.html_handling ?? 'auto-trailing-slash',
    },
  };
}

async function main(): Promise<void> {
  const target = resolveDeployTarget();
  console.log(
    `[deploy] Building and deploying Worker: ${target.workerName} (env: ${target.deployEnv}, url: https://${target.routeDomain}/${target.routePath}/)`
  );

  console.log('\n[deploy] Step 1: Building project...');
  const build = spawnSync('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit' });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  console.log(
    `\n[deploy] Step 2: Deploying Worker '${target.workerName}' (${target.deployEnv}) to https://${target.routeDomain}/${target.routePath}/...`
  );
  const safePrefix = target.workerName.replace(/[^a-zA-Z0-9_-]/g, '-');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `codebook-wrangler-${safePrefix}-`));
  const tmpConfigPath = path.join(tmpDir, 'wrangler.json');
  let deployStatus: number | null;
  try {
    const deployConfig = buildDeployConfig(target);
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

  console.log(`\n[deploy] Step 3: Pruning old deployments for '${target.workerName}' (max ${RETENTION_LIMIT} retained)...`);
  try {
    await pruneDeployments(target.workerName);
  } catch (err: any) {
    console.warn(`[deploy] Warning: Pruning failed - ${err.message}`);
  }

  console.log('\n[deploy] Deployment completed successfully.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(`[deploy] Unexpected error: ${err.message}`);
    process.exit(1);
  });
}
