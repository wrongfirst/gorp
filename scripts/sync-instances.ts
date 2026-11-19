import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

interface CliOptions {
  repo?: string;
  dryRun: boolean;
  deploy: boolean;
  instancesFile: string;
  upstreamUrl?: string;
  help: boolean;
}

type SyncStatus = 'SUCCESS' | 'UP-TO-DATE' | 'FAILED (CONFLICT)' | 'FAILED (ERROR)';

interface SyncResult {
  repo: string;
  status: SyncStatus;
  deployStatus?: string;
  details: string;
  durationMs: number;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    deploy: false,
    instancesFile: path.resolve(process.cwd(), 'instances.json'),
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--deploy') {
      options.deploy = true;
    } else if (arg.startsWith('--repo=')) {
      options.repo = arg.substring('--repo='.length).trim();
    } else if (arg === '--repo' && i + 1 < args.length) {
      options.repo = args[++i].trim();
    } else if (arg.startsWith('--instances-file=')) {
      options.instancesFile = path.resolve(process.cwd(), arg.substring('--instances-file='.length).trim());
    } else if (arg === '--instances-file' && i + 1 < args.length) {
      options.instancesFile = path.resolve(process.cwd(), args[++i].trim());
    } else if (arg.startsWith('--upstream=')) {
      options.upstreamUrl = arg.substring('--upstream='.length).trim();
    } else if (arg === '--upstream' && i + 1 < args.length) {
      options.upstreamUrl = args[++i].trim();
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Usage: npm run sync:instances [options]

Options:
  --repo <slug>            Target a specific repository (e.g. wrongfirst/warmup) or "all"
  --dry-run                Perform git clone and merge locally in temp workspace without pushing
  --deploy                 Trigger deployment workflow on instance after successful sync
  --instances-file <path>  Path to instances.json (default: ./instances.json)
  --upstream <url>         Override upstream repository URL
  --help, -h               Show this help message

Environment Variables:
  FORGEJO_TOKEN            Forgejo PAT for authenticated HTTPS operations
  FORGEJO_HOST             Host for Forgejo instance (default: git.jitin.xyz)
  UPSTREAM_URL             Override upstream repository URL
`);
}

function sanitize(text: string): string {
  return text.replace(/https:\/\/[^@\s/]+@/g, 'https://***@');
}

function runGit(
  cwd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
  rawOutput = false
): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: rawOutput ? stdout : stdout.trim(), stderr: '', status: 0 };
  } catch (err: any) {
    const stdoutRaw = err.stdout ? String(err.stdout) : '';
    const stderrRaw = err.stderr ? String(err.stderr) : (err.message || '');
    return {
      stdout: rawOutput ? stdoutRaw : stdoutRaw.trim(),
      stderr: rawOutput ? stderrRaw : stderrRaw.trim(),
      status: typeof err.status === 'number' ? err.status : 1,
    };
  }
}

function resolveInstances(options: CliOptions): string[] {
  if (!fs.existsSync(options.instancesFile)) {
    throw new Error(`instances configuration file not found at: ${options.instancesFile}`);
  }

  const raw = fs.readFileSync(options.instancesFile, 'utf-8');
  let instances: string[];
  try {
    instances = JSON.parse(raw);
    if (!Array.isArray(instances)) {
      throw new Error('instances.json must be a JSON array of strings');
    }
  } catch (e: any) {
    throw new Error(`Failed to parse instances configuration (${options.instancesFile}): ${e.message}`);
  }

  if (options.repo && options.repo !== 'all') {
    const targetSlug = options.repo.includes('/') ? options.repo : `wrongfirst/${options.repo}`;
    return [targetSlug];
  }

  return instances;
}

function getRemoteUrls(repoSlug: string, options: CliOptions): { downstreamUrl: string; upstreamUrl: string } {
  const token = process.env.FORGEJO_TOKEN?.trim();
  const host = process.env.FORGEJO_HOST?.trim() || 'git.jitin.xyz';

  let downstreamUrl: string;
  let upstreamUrl: string;

  if (token) {
    downstreamUrl = `https://${token}@${host}/${repoSlug}.git`;
    upstreamUrl = options.upstreamUrl || process.env.UPSTREAM_URL || `https://${token}@${host}/wrongfirst/codebook.git`;
  } else {
    downstreamUrl = `git@${host}:${repoSlug}.git`;
    upstreamUrl = options.upstreamUrl || process.env.UPSTREAM_URL || `git@${host}:wrongfirst/codebook.git`;
  }

  return { downstreamUrl, upstreamUrl };
}

function loadProtectedPatterns(attributesPath: string): string[] {
  if (!fs.existsSync(attributesPath)) {
    return [];
  }

  const patterns: string[] = [];
  const lines = fs.readFileSync(attributesPath, 'utf-8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const [pattern, ...attrs] = parts;
    if (attrs.includes('merge=ours')) {
      patterns.push(pattern);
    }
  }
  return patterns;
}

function isProtectedPath(filePath: string, protectedPatterns: string[]): boolean {
  for (const pattern of protectedPatterns) {
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3);
      if (filePath === prefix || filePath.startsWith(`${prefix}/`)) {
        return true;
      }
    } else if (filePath === pattern) {
      return true;
    }
  }
  return false;
}

const UNMERGED_STATUS_CODES = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

function getUnmergedEntries(tempDir: string): Array<{ code: string; filePath: string }> {
  const statusRes = runGit(tempDir, ['status', '--porcelain', '-z'], undefined, true);
  const tokens = statusRes.stdout.split('\0').filter(Boolean);
  const entries: Array<{ code: string; filePath: string }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length < 4) continue;
    const code = token.slice(0, 2);
    const filePath = token.slice(3);

    if (UNMERGED_STATUS_CODES.has(code)) {
      entries.push({ code, filePath });
    }

    // Porcelain -z appends the original path as an extra NUL token for renames/copies.
    if (code[0] === 'R' || code[0] === 'C') {
      i++;
    }
  }

  return entries;
}

function resolveProtectedConflicts(tempDir: string, protectedPatterns: string[]): string[] {
  const resolved: string[] = [];
  const unmerged = getUnmergedEntries(tempDir);

  for (const { code, filePath } of unmerged) {
    if (!isProtectedPath(filePath, protectedPatterns)) {
      continue;
    }

    const existsInHead = runGit(tempDir, ['cat-file', '-e', `HEAD:${filePath}`]).status === 0;
    const res = existsInHead
      ? runGit(tempDir, ['checkout', 'HEAD', '--', filePath])
      : runGit(tempDir, ['rm', '-f', '--ignore-unmatch', '--', filePath]);

    if (res.status === 0) {
      resolved.push(`${filePath} (${code})`);
      console.log(`  ↻ Kept downstream state for protected path: ${filePath} (${code})`);
    }
  }

  return resolved;
}

function getRemainingConflictedFiles(tempDir: string): string[] {
  const diffRes = runGit(tempDir, ['diff', '--name-only', '--diff-filter=U']);
  const fromDiff = diffRes.stdout ? diffRes.stdout.split('\n').filter(Boolean) : [];
  if (fromDiff.length > 0) {
    return fromDiff;
  }

  return getUnmergedEntries(tempDir).map(entry => entry.filePath);
}

function syncInstance(repo: string, options: CliOptions): SyncResult {
  const startTime = Date.now();
  const { downstreamUrl, upstreamUrl } = getRemoteUrls(repo, options);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `cb-sync-${repo.replace(/[^a-zA-Z0-9_-]/g, '-')}-`));

  console.log(`\n============================================================`);
  console.log(`Processing: ${repo}`);
  console.log(`Workspace:  ${tempDir}`);
  console.log(`Upstream:   ${sanitize(upstreamUrl)}`);
  console.log(`Downstream: ${sanitize(downstreamUrl)}`);
  console.log(`Mode:       ${options.dryRun ? 'DRY-RUN (no push)' : 'LIVE (push on clean merge)'}`);
  console.log(`============================================================`);

  try {
    // 1. Clone downstream target repo
    console.log(`[1/5] Cloning ${repo}...`);
    const cloneRes = runGit(os.tmpdir(), ['clone', downstreamUrl, tempDir]);
    if (cloneRes.status !== 0) {
      const err = sanitize(cloneRes.stderr || cloneRes.stdout || 'Clone failed');
      console.error(`  ✗ Clone failed: ${err}`);
      return {
        repo,
        status: 'FAILED (ERROR)',
        details: `Clone error: ${err.split('\n')[0]}`,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Configure Git environment (merge driver + attributes + fallback author identity for CI)
    console.log(`[2/5] Configuring git merge driver, attributes, and credentials...`);
    runGit(tempDir, ['config', 'merge.ours.driver', 'true']);

    // Ensure root .gitattributes rules are active in .git/info/attributes during merge
    const rootAttributesPath = path.resolve(process.cwd(), '.gitattributes');
    const protectedPatterns = loadProtectedPatterns(rootAttributesPath);
    if (fs.existsSync(rootAttributesPath)) {
      const gitInfoDir = path.join(tempDir, '.git', 'info');
      fs.mkdirSync(gitInfoDir, { recursive: true });
      fs.copyFileSync(rootAttributesPath, path.join(gitInfoDir, 'attributes'));
    }

    const userEmailCheck = runGit(tempDir, ['config', 'user.email']);
    if (userEmailCheck.status !== 0 || !userEmailCheck.stdout) {
      runGit(tempDir, ['config', 'user.email', 'actions@git.jitin.xyz']);
      runGit(tempDir, ['config', 'user.name', 'Forgejo Sync Runner']);
    }

    // 3. Add upstream remote and fetch
    console.log(`[3/5] Adding upstream remote and fetching upstream/main...`);
    const remoteAddRes = runGit(tempDir, ['remote', 'add', 'upstream', upstreamUrl]);
    if (remoteAddRes.status !== 0) {
      const err = sanitize(remoteAddRes.stderr || 'Failed to add upstream remote');
      console.error(`  ✗ Remote add failed: ${err}`);
      return {
        repo,
        status: 'FAILED (ERROR)',
        details: `Remote add error: ${err.split('\n')[0]}`,
        durationMs: Date.now() - startTime,
      };
    }

    const fetchRes = runGit(tempDir, ['fetch', 'upstream', 'main']);
    if (fetchRes.status !== 0) {
      const err = sanitize(fetchRes.stderr || 'Failed to fetch upstream/main');
      console.error(`  ✗ Fetch failed: ${err}`);
      return {
        repo,
        status: 'FAILED (ERROR)',
        details: `Fetch error: ${err.split('\n')[0]}`,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Check if upstream/main is already merged into HEAD
    console.log(`[4/5] Checking merge status...`);
    const ancestorCheck = runGit(tempDir, ['merge-base', '--is-ancestor', 'upstream/main', 'HEAD']);
    if (ancestorCheck.status === 0) {
      console.log(`  ✓ Already up-to-date with upstream/main`);
      return {
        repo,
        status: 'UP-TO-DATE',
        details: 'Already in sync with upstream/main',
        durationMs: Date.now() - startTime,
      };
    }

    // 5. Merge upstream/main into current branch
    console.log(`[5/5] Merging upstream/main...`);
    const mergeRes = runGit(tempDir, [
      'merge',
      'upstream/main',
      '--allow-unrelated-histories',
      '-m',
      'chore: sync template updates from codebook',
    ]);

    let resolvedProtected: string[] = [];

    if (mergeRes.status !== 0) {
      // Auto-resolve tree/content conflicts on protected downstream-owned paths by keeping HEAD
      resolvedProtected = resolveProtectedConflicts(tempDir, protectedPatterns);
      const conflictedFiles = getRemainingConflictedFiles(tempDir);

      if (conflictedFiles.length > 0 || resolvedProtected.length === 0) {
        console.error(`  ✗ Merge conflict detected in: ${conflictedFiles.join(', ') || 'unspecified files'}`);
        console.log(`  Aborting merge safely...`);
        runGit(tempDir, ['merge', '--abort']);

        return {
          repo,
          status: 'FAILED (CONFLICT)',
          details: conflictedFiles.length > 0 ? `Conflicted: ${conflictedFiles.join(', ')}` : 'Merge conflict (aborted)',
          durationMs: Date.now() - startTime,
        };
      }

      // All conflicts were protected paths; finalize the merge commit
      const commitRes = runGit(tempDir, ['commit', '--no-edit']);
      if (commitRes.status !== 0) {
        const err = sanitize(commitRes.stderr || commitRes.stdout || 'Failed to commit resolved merge');
        console.error(`  ✗ Merge commit failed after resolving protected conflicts: ${err}`);
        runGit(tempDir, ['merge', '--abort']);
        return {
          repo,
          status: 'FAILED (ERROR)',
          details: `Commit error: ${err.split('\n')[0]}`,
          durationMs: Date.now() - startTime,
        };
      }
    }

    // Double check if merge was clean or a no-op
    if (mergeRes.stdout.includes('Already up to date')) {
      console.log(`  ✓ Already up to date.`);
      return {
        repo,
        status: 'UP-TO-DATE',
        details: 'Already up-to-date',
        durationMs: Date.now() - startTime,
      };
    }

    // Clean merge completed!
    if (options.dryRun) {
      console.log(`  ✓ Clean merge completed (dry-run: skipping push)`);
      return {
        repo,
        status: 'SUCCESS',
        details: 'Merge succeeded (dry-run, push skipped)',
        durationMs: Date.now() - startTime,
      };
    }

    // Push changes to downstream main
    console.log(`  Pushing merge commit to origin/main...`);
    const pushRes = runGit(tempDir, ['push', 'origin', 'main']);
    if (pushRes.status !== 0) {
      const err = sanitize(pushRes.stderr || 'Push failed');
      console.error(`  ✗ Push failed: ${err}`);
      return {
        repo,
        status: 'FAILED (ERROR)',
        details: `Push failed: ${err.split('\n')[0]}`,
        durationMs: Date.now() - startTime,
      };
    }

    console.log(`  ✓ Successfully synced and pushed updates to ${repo}`);
    return {
      repo,
      status: 'SUCCESS',
      details: 'Merged & pushed upstream/main',
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const errorMsg = sanitize(err.message || String(err));
    console.error(`  ✗ Unexpected error on ${repo}: ${errorMsg}`);
    return {
      repo,
      status: 'FAILED (ERROR)',
      details: `Exception: ${errorMsg.split('\n')[0]}`,
      durationMs: Date.now() - startTime,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore temp dir cleanup errors
    }
  }
}

async function triggerDeployment(repo: string, options: CliOptions): Promise<{ status: string; details?: string }> {
  if (options.dryRun) {
    console.log(`  [deploy] (dry-run) Would dispatch deployment workflow for ${repo}`);
    return { status: 'DRY-RUN' };
  }

  const token = process.env.FORGEJO_TOKEN?.trim();
  const host = process.env.FORGEJO_HOST?.trim() || 'git.jitin.xyz';

  if (!token) {
    const msg = 'FORGEJO_TOKEN required to dispatch deployment';
    console.warn(`  ⚠ [deploy] Skipped: ${msg}`);
    return { status: 'NO TOKEN', details: msg };
  }

  const url = `https://${host}/api/v1/repos/${repo}/actions/workflows/deploy.yaml/dispatches`;
  try {
    console.log(`  [deploy] Dispatching deployment workflow on ${repo} (${host})...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (res.status === 204 || res.ok) {
      console.log(`  ✓ [deploy] Deployment workflow successfully triggered for ${repo}`);
      return { status: 'TRIGGERED' };
    }

    const errText = await res.text();
    console.error(`  ✗ [deploy] Failed to trigger deployment for ${repo} (${res.status}): ${errText}`);
    return { status: 'FAILED', details: `HTTP ${res.status}: ${errText.slice(0, 60)}` };
  } catch (err: any) {
    console.error(`  ✗ [deploy] Request error triggering deployment for ${repo}: ${err.message}`);
    return { status: 'FAILED', details: err.message };
  }
}

function printSummaryTable(results: SyncResult[], showDeploy: boolean): void {
  const colRepo = Math.max(12, ...results.map(r => r.repo.length));
  const colStatus = Math.max(19, ...results.map(r => r.status.length));
  const colDeploy = showDeploy ? Math.max(12, ...results.map(r => (r.deployStatus || 'N/A').length), 'Deploy'.length) : 0;
  const colDetails = Math.max(30, ...results.map(r => r.details.length));

  const pad = (str: string, len: number) => str + ' '.repeat(Math.max(0, len - str.length));

  const topBorder = showDeploy
    ? `┌─${'─'.repeat(colRepo)}─┬─${'─'.repeat(colStatus)}─┬─${'─'.repeat(colDeploy)}─┬─${'─'.repeat(colDetails)}─┐`
    : `┌─${'─'.repeat(colRepo)}─┬─${'─'.repeat(colStatus)}─┬─${'─'.repeat(colDetails)}─┐`;
  const header = showDeploy
    ? `│ ${pad('Repository', colRepo)} │ ${pad('Status', colStatus)} │ ${pad('Deploy', colDeploy)} │ ${pad('Details', colDetails)} │`
    : `│ ${pad('Repository', colRepo)} │ ${pad('Status', colStatus)} │ ${pad('Details', colDetails)} │`;
  const midBorder = showDeploy
    ? `├─${'─'.repeat(colRepo)}─┼─${'─'.repeat(colStatus)}─┼─${'─'.repeat(colDeploy)}─┼─${'─'.repeat(colDetails)}─┤`
    : `├─${'─'.repeat(colRepo)}─┼─${'─'.repeat(colStatus)}─┼─${'─'.repeat(colDetails)}─┤`;
  const botBorder = showDeploy
    ? `└─${'─'.repeat(colRepo)}─┴─${'─'.repeat(colStatus)}─┴─${'─'.repeat(colDeploy)}─┴─${'─'.repeat(colDetails)}─┘`
    : `└─${'─'.repeat(colRepo)}─┴─${'─'.repeat(colStatus)}─┴─${'─'.repeat(colDetails)}─┘`;

  console.log('\n');
  console.log('================================================================================');
  console.log('                        SYNC PIPELINE EXECUTION SUMMARY                         ');
  console.log('================================================================================');
  console.log(topBorder);
  console.log(header);
  console.log(midBorder);

  for (const r of results) {
    if (showDeploy) {
      console.log(`│ ${pad(r.repo, colRepo)} │ ${pad(r.status, colStatus)} │ ${pad(r.deployStatus || 'N/A', colDeploy)} │ ${pad(r.details, colDetails)} │`);
    } else {
      console.log(`│ ${pad(r.repo, colRepo)} │ ${pad(r.status, colStatus)} │ ${pad(r.details, colDetails)} │`);
    }
  }

  console.log(botBorder);

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const upToDateCount = results.filter(r => r.status === 'UP-TO-DATE').length;
  const conflictCount = results.filter(r => r.status === 'FAILED (CONFLICT)').length;
  const errorCount = results.filter(r => r.status === 'FAILED (ERROR)').length;

  let totalsStr = `\nTotals: ${results.length} total | ${successCount} synced | ${upToDateCount} up-to-date | ${conflictCount} conflicts | ${errorCount} errors`;
  if (showDeploy) {
    const deployCount = results.filter(r => r.deployStatus === 'TRIGGERED' || r.deployStatus === 'DRY-RUN').length;
    totalsStr += ` | ${deployCount} deployed/triggered`;
  }
  console.log(`${totalsStr}\n`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  let targetInstances: string[];
  try {
    targetInstances = resolveInstances(options);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`Starting template synchronization pipeline...`);
  console.log(`Target repositories (${targetInstances.length}):`);
  for (const inst of targetInstances) {
    console.log(`  - ${inst}`);
  }
  if (options.dryRun) {
    console.log(`Notice: Running in --dry-run mode. No commits will be pushed.`);
  }
  if (options.deploy) {
    console.log(`Notice: Deployment dispatch enabled (--deploy). Target instances will be triggered for deployment.`);
  }

  const results: SyncResult[] = [];

  for (const inst of targetInstances) {
    const result = syncInstance(inst, options);

    if (options.deploy) {
      if (result.status === 'SUCCESS' || result.status === 'UP-TO-DATE') {
        const deployRes = await triggerDeployment(inst, options);
        result.deployStatus = deployRes.status;
        if (deployRes.details && !result.details) {
          result.details = deployRes.details;
        }
      } else {
        result.deployStatus = 'SKIPPED (SYNC FAILED)';
      }
    }

    results.push(result);
  }

  printSummaryTable(results, options.deploy);

  const hasFailures = results.some(r => r.status.startsWith('FAILED') || r.deployStatus === 'FAILED');
  if (hasFailures) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal sync failure:', err);
  process.exit(1);
});
