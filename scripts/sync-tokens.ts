import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface CliOptions {
  targetRepo: string;
  branch: string;
  sourceFile: string;
  destFile: string;
  localDir?: string;
  dryRun: boolean;
  help: boolean;
}

const GENERATED_HEADER = `/* AUTO-GENERATED — DO NOT EDIT DIRECTLY.
 * Source of truth: wrongfirst/codebook/src/tokens.css
 * Synced automatically by .forgejo/workflows/sync-tokens.yaml.
 */

`;

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    targetRepo: 'wrongfirst/homepage',
    branch: 'main',
    sourceFile: path.resolve(process.cwd(), 'src/tokens.css'),
    destFile: 'tokens.css',
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--target=')) {
      options.targetRepo = arg.slice('--target='.length).trim();
    } else if (arg === '--target' && i + 1 < args.length) {
      options.targetRepo = args[++i].trim();
    } else if (arg.startsWith('--branch=')) {
      options.branch = arg.slice('--branch='.length).trim();
    } else if (arg === '--branch' && i + 1 < args.length) {
      options.branch = args[++i].trim();
    } else if (arg.startsWith('--source=')) {
      options.sourceFile = path.resolve(process.cwd(), arg.slice('--source='.length).trim());
    } else if (arg === '--source' && i + 1 < args.length) {
      options.sourceFile = path.resolve(process.cwd(), args[++i].trim());
    } else if (arg.startsWith('--dest=')) {
      options.destFile = arg.slice('--dest='.length).trim();
    } else if (arg === '--dest' && i + 1 < args.length) {
      options.destFile = args[++i].trim();
    } else if (arg.startsWith('--local-dir=')) {
      options.localDir = path.resolve(process.cwd(), arg.slice('--local-dir='.length).trim());
    } else if (arg === '--local-dir' && i + 1 < args.length) {
      options.localDir = path.resolve(process.cwd(), args[++i].trim());
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Usage: npm run sync:tokens -- [options]

Options:
  --target <slug>     Target Forgejo repository (default: wrongfirst/homepage)
  --branch <name>     Target branch (default: main)
  --source <path>     Source tokens CSS file (default: ./src/tokens.css)
  --dest <path>       Destination path inside target repo (default: tokens.css)
  --local-dir <path>  Write generated tokens directly to a local directory instead of cloning
  --dry-run           Simulate sync and inspect diff without pushing (or writing with --local-dir)
  --help, -h          Show this help message

Environment Variables:
  FORGEJO_TOKEN       Forgejo PAT for authenticated HTTPS operations
  FORGEJO_HOST        Host for Forgejo instance (default: git.jitin.xyz)
`);
}

function sanitize(text: string): string {
  return text.replace(/https:\/\/[^@\s/]+@/g, 'https://***@');
}

function runGit(
  cwd: string,
  args: string[]
): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: stdout.trim(), stderr: '', status: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string; message?: string; status?: number };
    const stdout = e.stdout ? String(e.stdout).trim() : '';
    const stderr = e.stderr ? String(e.stderr).trim() : (e.message || '');
    return {
      stdout,
      stderr,
      status: typeof e.status === 'number' ? e.status : 1,
    };
  }
}

function getTargetRemoteUrl(repoSlug: string): string {
  const token = process.env.FORGEJO_TOKEN?.trim();
  const host = process.env.FORGEJO_HOST?.trim() || 'git.jitin.xyz';

  if (token) {
    return `https://${token}@${host}/${repoSlug}.git`;
  }
  return `git@${host}:${repoSlug}.git`;
}

function buildSyncedContent(sourceFile: string): string {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source tokens file not found: ${sourceFile}`);
  }
  const raw = fs.readFileSync(sourceFile, 'utf-8');
  const normalized = raw.endsWith('\n') ? raw : `${raw}\n`;
  return `${GENERATED_HEADER}${normalized}`;
}

function getSourceShortSha(): string | null {
  const res = runGit(process.cwd(), ['rev-parse', '--short', 'HEAD']);
  return res.status === 0 && res.stdout ? res.stdout : null;
}

function syncToLocalDir(localDir: string, destFile: string, content: string, dryRun: boolean): void {
  const destPath = path.join(localDir, destFile);
  const existing = fs.existsSync(destPath) ? fs.readFileSync(destPath, 'utf-8') : null;

  if (existing === content) {
    console.log(`[sync:tokens] ${destPath} is already up-to-date.`);
    return;
  }

  if (dryRun) {
    console.log(`[sync:tokens] (dry-run) Would write ${destPath} (${content.length} bytes).`);
    return;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`[sync:tokens] Wrote ${destPath}.`);
}

function syncToRemote(options: CliOptions, content: string): void {
  const remoteUrl = getTargetRemoteUrl(options.targetRepo);
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `cb-tokens-${options.targetRepo.replace(/[^a-zA-Z0-9_-]/g, '-')}-`)
  );

  console.log(`[sync:tokens] Target: ${options.targetRepo} (${options.branch})`);
  console.log(`[sync:tokens] Remote: ${sanitize(remoteUrl)}`);
  console.log(`[sync:tokens] Mode:   ${options.dryRun ? 'DRY-RUN (no push)' : 'LIVE (push on change)'}`);

  try {
    console.log(`[1/4] Cloning ${options.targetRepo}...`);
    const cloneRes = runGit(os.tmpdir(), [
      'clone',
      '--depth',
      '1',
      '--branch',
      options.branch,
      remoteUrl,
      tempDir,
    ]);
    if (cloneRes.status !== 0) {
      throw new Error(`Clone failed: ${sanitize(cloneRes.stderr || cloneRes.stdout || 'unknown error')}`);
    }

    const userEmailCheck = runGit(tempDir, ['config', 'user.email']);
    if (userEmailCheck.status !== 0 || !userEmailCheck.stdout) {
      runGit(tempDir, ['config', 'user.email', 'actions@git.jitin.xyz']);
      runGit(tempDir, ['config', 'user.name', 'Forgejo Sync Runner']);
    }

    console.log(`[2/4] Writing ${options.destFile}...`);
    const destPath = path.join(tempDir, options.destFile);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content, 'utf-8');

    console.log(`[3/4] Checking for changes...`);
    const addRes = runGit(tempDir, ['add', '--', options.destFile]);
    if (addRes.status !== 0) {
      throw new Error(`git add failed: ${sanitize(addRes.stderr || addRes.stdout)}`);
    }

    const diffCheck = runGit(tempDir, ['diff', '--cached', '--quiet', '--', options.destFile]);
    if (diffCheck.status === 0) {
      console.log(`[sync:tokens] ✓ ${options.targetRepo}/${options.destFile} is already up-to-date.`);
      return;
    }

    const diffStat = runGit(tempDir, ['diff', '--cached', '--stat', '--', options.destFile]);
    if (diffStat.stdout) {
      console.log(diffStat.stdout);
    }

    if (options.dryRun) {
      console.log(`[4/4] Dry-run complete; skipping commit and push.`);
      return;
    }

    const shortSha = getSourceShortSha();
    const commitMsg = shortSha
      ? `chore: sync design tokens from codebook (${shortSha})`
      : 'chore: sync design tokens from codebook';

    console.log(`[4/4] Committing and pushing to ${options.branch}...`);
    const commitRes = runGit(tempDir, ['commit', '-m', commitMsg]);
    if (commitRes.status !== 0) {
      throw new Error(`Commit failed: ${sanitize(commitRes.stderr || commitRes.stdout)}`);
    }

    const pushRes = runGit(tempDir, ['push', 'origin', options.branch]);
    if (pushRes.status !== 0) {
      throw new Error(`Push failed: ${sanitize(pushRes.stderr || pushRes.stdout)}`);
    }

    console.log(`[sync:tokens] ✓ Synced ${options.destFile} to ${options.targetRepo} (${options.branch}).`);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const content = buildSyncedContent(options.sourceFile);

  if (options.localDir) {
    syncToLocalDir(options.localDir, options.destFile, content, options.dryRun);
    return;
  }

  syncToRemote(options, content);
}

try {
  main();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[sync:tokens] ✗ ${sanitize(message)}`);
  process.exit(1);
}
