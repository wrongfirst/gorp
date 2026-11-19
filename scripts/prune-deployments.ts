import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RETENTION_LIMIT = 10;

interface Deployment {
  id: string;
  created_on: string;
}

interface CloudflareAuth {
  token: string;
  accountId: string;
}

// Resolve credentials exactly as `wrangler deploy` does:
// - account: `account_id` in wrangler.jsonc, then CLOUDFLARE_ACCOUNT_ID
// - token: `wrangler auth token` (CLOUDFLARE_API_TOKEN, or the active OAuth login/profile, refreshed if expired)
function getCloudflareAuth(): CloudflareAuth {
  // Plain JSON.parse: wrangler.jsonc must stay comment-free.
  const config = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'wrangler.jsonc'), 'utf8')) as { account_id?: string };
  const accountId = config.account_id || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) throw new Error('No account_id in wrangler.jsonc and CLOUDFLARE_ACCOUNT_ID is not set');

  const output = execFileSync('npx', ['wrangler', 'auth', 'token', '--json'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const { token } = JSON.parse(output) as { token?: string };
  if (!token) throw new Error('Pruning requires an API token or OAuth login (API key auth is not supported)');

  return { token, accountId };
}

async function cfFetch<T>(auth: CloudflareAuth, endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/accounts/${auth.accountId}${endpoint}`, {
    ...init,
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  const data = (await response.json().catch(() => null)) as
    | { success: boolean; errors?: Array<{ code: number; message: string }>; result: T }
    | null;

  if (!response.ok || !data?.success) {
    const detail = data?.errors?.map(e => `[${e.code}] ${e.message}`).join(', ') || response.statusText;
    throw new Error(`Cloudflare API error (${response.status}): ${detail}`);
  }
  return data.result;
}

export function getWorkerName(): string {
  const envName = [process.env.WORKER_NAME, process.env.REPO_NAME, process.env.GITHUB_REPOSITORY?.split('/')[1]]
    .map(name => name?.trim())
    .find(Boolean);
  if (envName) return envName;

  try {
    const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = remoteUrl.match(/[:/][^/:]+\/([^/:]+?)(?:\.git)?$/);
    if (match?.[1]) return match[1];
  } catch {
    // fall back to directory name
  }

  return path.basename(ROOT_DIR);
}

// Deletes deployment records beyond the newest RETENTION_LIMIT. The active (newest) deployment is
// always retained. Versions are left alone: Cloudflare has no delete endpoint for them and
// automatically retains only the most recent ones.
export async function pruneDeployments(workerName = getWorkerName()): Promise<void> {
  const auth = getCloudflareAuth();
  const scriptPath = `/workers/scripts/${workerName}/deployments`;

  console.log(`[prune] Checking deployments for Worker '${workerName}' (Account: ${auth.accountId})...`);
  const { deployments = [] } = await cfFetch<{ deployments?: Deployment[] }>(auth, scriptPath);

  if (deployments.length <= RETENTION_LIMIT) {
    console.log(`[prune] ${deployments.length} deployment(s) found, within limit of ${RETENTION_LIMIT}. Nothing to prune.`);
    return;
  }

  const toDelete = deployments
    .sort((a, b) => Date.parse(b.created_on) - Date.parse(a.created_on))
    .slice(RETENTION_LIMIT);

  let failed = 0;
  for (const dep of toDelete) {
    try {
      await cfFetch(auth, `${scriptPath}/${dep.id}`, { method: 'DELETE' });
      console.log(`  ✓ Deleted deployment ${dep.id} (created: ${dep.created_on})`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ Failed to delete deployment ${dep.id}: ${err.message}`);
    }
  }

  if (failed) throw new Error(`${failed} of ${toDelete.length} deployment deletion(s) failed`);
  console.log(`[prune] Deleted ${toDelete.length} deployment(s); retained the latest ${RETENTION_LIMIT}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  pruneDeployments().catch(err => {
    console.error(`[prune] Error: ${err.message}`);
    process.exit(1);
  });
}
