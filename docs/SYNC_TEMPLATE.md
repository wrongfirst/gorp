# Syncing Template Updates

Instructions for syncing upstream template changes into an instance of this repository.

## 1. Add Template Remote (One-Time Setup)

```bash
git remote add upstream https://github.com/wrongfirst/codebook.git
```

## 2. Fetch and Merge Upstream Changes

```bash
git fetch upstream template
git merge upstream/template
```

NOTE: The first you you merge you might want to run it with `--allow-unrelated-histories`

## 3. Resolve Conflicts and Commit

Resolve any merge conflicts if prompted, then commit the merge:

```bash
git commit
```
