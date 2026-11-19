# Template Synchronization

Propagates upstream template updates to downstream instances.

---

## Architecture

Upstream changes are merged into downstream repositories using a push pipeline:

```mermaid
flowchart TD
    Upstream["Upstream Repository (main)"]
    SyncWorkflow[".forgejo/workflows/sync-instances.yaml"]
    SyncScript["scripts/sync-instances.ts"]
    InstancesList["instances.json"]
    Downstream["Downstream Instances (<org>/<repo>)"]
    Deployment["Deployment Target"]

    Upstream --> SyncWorkflow
    SyncWorkflow --> SyncScript
    InstancesList --> SyncScript
    SyncScript --> Downstream
    Downstream --> Deployment
```

---

## File Preservation (`.gitattributes`)

Downstream content is protected from upstream overwrites using the `ours` merge driver:

```gitattributes
site.toml merge=ours
README.md merge=ours
instances.json merge=ours
.github/instances.json merge=ours
src/exercises/** merge=ours
public/** merge=ours
```

- `scripts/sync-instances.ts` sets `git config merge.ours.driver true` and preserves downstream state even on tree conflicts (`modify/delete`, `rename/delete`) for these protected paths.
- Upstream platform files (`src/core/`, `src/ui/`, `src/languages/`, configs) merge automatically.
- Downstream-specific files (`src/exercises/**`, `site.toml`, `README.md`, `public/**`, `instances.json`) remain unchanged.

---

## Required Secrets

| Secret | Scope | Purpose |
|---|---|---|
| `CODEBOOK_SYNC_INSTANCES` | Upstream repository or organization | Personal Access Token with repository read/write permissions to push merges to downstream repositories (exposed to the script as `FORGEJO_TOKEN`) |
| `CLOUDFLARE_API_TOKEN` | Organization / Environment | Deployment access token (if automated Pages deployment is enabled) |
| `CLOUDFLARE_ACCOUNT_ID` | Organization / Environment | Target account identifier for deployments |

---

## Running Sync

### Via Actions Workflow

1. Navigate to **Actions** → **Sync Template to Instances**.
2. Select **Run workflow**:
   - `target_repo`: Select from dropdown (`all` or a specific instance like `wrongfirst/warmup`).
   - `dry_run`: `true` to validate merges without pushing.
   - `deploy`: `true` to trigger the deployment workflow on target instances after syncing.

### Via CLI

```bash
# Sync all instances listed in instances.json (no deployments triggered)
npm run sync:instances

# Sync a specific instance
npm run sync:instances -- --repo <org>/<repo>

# Dry run (simulate clone, merge, and deployment dispatch without pushing or deploying)
npm run sync:instances -- --dry-run
npm run sync:instances -- --dry-run --repo <org>/<repo> --deploy

# Sync and trigger deployment workflow on target instance(s)
npm run sync:instances -- --repo <org>/<repo> --deploy
npm run sync:instances -- --deploy
```

### Authentication

- **CLI**: Uses local SSH credentials (`git@<host>:<org>/<repo>.git`).
- **CI**: Reads `FORGEJO_TOKEN` from the environment (`https://${FORGEJO_TOKEN}@<host>/<org>/<repo>.git`).

---

## Conflict Resolution

When a downstream instance encounters a merge conflict:
1. The sync script executes `git merge --abort`, leaving the downstream repository untouched.
2. Conflicted files are reported in the execution summary.

To resolve manually:

```bash
git clone git@<host>:<org>/<repo>.git /tmp/resolve-sync
cd /tmp/resolve-sync
git config merge.ours.driver true
git remote add upstream git@<host>:<org>/<upstream-repo>.git
git fetch upstream main
git merge upstream/main --allow-unrelated-histories
# Resolve conflicts
git commit -m "chore: resolve sync conflicts from upstream"
git push origin main
```
